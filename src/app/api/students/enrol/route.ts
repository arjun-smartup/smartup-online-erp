import { NextRequest, NextResponse } from "next/server";

const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || "https://smartupedu.frappe.cloud";
const API_KEY = process.env.FRAPPE_API_KEY || "39f71c6530cd462";
const API_SECRET = process.env.FRAPPE_API_SECRET || "064f8d6fb2fb0bc";

const AUTH_HEADER = `token ${API_KEY}:${API_SECRET}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      student_name,
      guardian_name,
      guardian_phone,
      guardian_email,
      country,
      admission_date,
      program,
      class_level,
      course_type,
      delivery_mode,
      batch_name,
      billing_mode,
      contract_duration_months,
      subject_allocations,
      package_fee,
      instalment_plan,
      instalments,
      discount_amount,
      discount_reason,
      collect_advance,
      advance_amount,
      payment_mode,
      transaction_reference,
    } = body;

    if (!student_name) {
      return NextResponse.json({ error: "Student name is required" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];

    // 1. Resolve Program ID & Batch
    const PROGRAM_ID_MAP: Record<string, string> = {
      "State": "6ou3e6qktl",
      "State Board": "6ou3e6qktl",
      "CBSE Kerala": "foue41ggaf",
      "CBSE GCC": "7oui15udm7",
      "CBSE GCC Online": "7oui15udm7",
      "CBSE GCC Offline": "5oukbeccjt",
    };

    const resolvedProgramId = PROGRAM_ID_MAP[program] || program || "foue41ggaf";
    const finalBatchName = batch_name || `${program} - ${class_level} - ${course_type}`;

    try {
      const checkBatch = await fetch(`${FRAPPE_URL}/api/resource/SmartUp%20Batch/${encodeURIComponent(finalBatchName)}`, {
        headers: { Authorization: AUTH_HEADER },
      });
      if (!checkBatch.ok) {
        await fetch(`${FRAPPE_URL}/api/resource/SmartUp%20Batch`, {
          method: "POST",
          headers: {
            Authorization: AUTH_HEADER,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            doctype: "SmartUp Batch",
            batch_name: finalBatchName,
            program: resolvedProgramId,
            class_level: class_level || "Class 10",
            course_type: course_type || "1:1 Tutoring",
            delivery_mode: "Online Live",
            centre: country === "India" ? "Kochi Online" : `${country} GCC`,
            is_active: 1,
          }),
        });
      }
    } catch (e) {
      console.warn("Batch auto-creation note:", e);
    }

    // 2. Create ERPNext Customer (Debtor for GL Accounting)
    let customerName = student_name;
    try {
      const customerRes = await fetch(`${FRAPPE_URL}/api/resource/Customer`, {
        method: "POST",
        headers: {
          Authorization: AUTH_HEADER,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctype: "Customer",
          customer_name: student_name,
          customer_type: "Individual",
          customer_group: "Commercial",
          territory: country === "India" ? "India" : "All Territories",
        }),
      });
      if (customerRes.ok) {
        const cJson = await customerRes.json();
        customerName = cJson.data?.name || student_name;
      }
    } catch (e) {
      console.warn("Customer creation note:", e);
    }

    // 3. Create SmartUp Student
    const studentDoc = {
      doctype: "SmartUp Student",
      student_name,
      guardian_name,
      guardian_phone,
      guardian_email,
      country: country || "India",
      billing_currency: "INR",
      admission_date: admission_date || today,
      customer: customerName,
      status: "Active",
      program: resolvedProgramId,
      class_level: class_level || "10th",
      course_type: course_type || "Regular",
      delivery_mode: delivery_mode || (program === "State Board" || program === "State" ? "Batch Cohort" : "1:1 Tutoring"),
      batch_name: batch_name || "Batch A",
      enrolled_batches: [
        {
          batch: finalBatchName,
          enrolled_date: admission_date || today,
          status: "Active",
        },
      ],
    };

    const studentRes = await fetch(`${FRAPPE_URL}/api/resource/SmartUp%20Student`, {
      method: "POST",
      headers: {
        Authorization: AUTH_HEADER,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(studentDoc),
    });

    if (!studentRes.ok) {
      const errData = await studentRes.text();
      return NextResponse.json({ error: "Failed to create Student in Frappe", details: errData }, { status: 400 });
    }

    const studentData = await studentRes.json();
    const createdStudentId = studentData.data.name;

    // 4. Calculate Financials
    let grossFee = 0;
    const finalSubjectAllocations: any[] = [];
    const finalInstalments: any[] = [];

    if (billing_mode === "Hourly Sessions (1:1 / 1:3)" && Array.isArray(subject_allocations)) {
      let monthlyTotal = 0;
      for (const row of subject_allocations) {
        const sub = row.subject || "General";
        const hrs = Number(row.monthly_hours) || 0;
        const rate = Number(row.hourly_rate) || 0;
        const subtotal = hrs * rate;
        monthlyTotal += subtotal;
        finalSubjectAllocations.push({
          subject: sub,
          monthly_hours: hrs,
          hourly_rate: rate,
          monthly_subtotal: subtotal,
        });
      }
      const months = Number(contract_duration_months) || 10;
      grossFee = monthlyTotal * months;
    } else {
      grossFee = Number(package_fee) || 0;
      if (Array.isArray(instalments) && instalments.length > 0) {
        for (const inst of instalments) {
          finalInstalments.push({
            instalment_number: inst.instalment_number,
            due_date: inst.due_date,
            amount_due: Number(inst.amount_due) || 0,
            amount_paid: 0,
            outstanding_balance: Number(inst.amount_due) || 0,
            status: "Pending",
          });
        }
      }
    }

    const discount = Number(discount_amount) || 0;
    const netPayable = Math.max(0, grossFee - discount);
    const collected = collect_advance ? Number(advance_amount) || 0 : 0;
    const pendingBalance = Math.max(0, netPayable - collected);

    // 5. Create SmartUp Fee Ledger
    const feeLedgerDoc = {
      doctype: "SmartUp Fee Ledger",
      student: createdStudentId,
      batch: finalBatchName,
      academic_year: "2026-2027",
      billing_mode: billing_mode || "Fixed Instalments (Micro / Regular)",
      currency: "INR",
      gross_fee: grossFee,
      discount_amount: discount,
      discount_reason: discount_reason || "",
      net_payable: netPayable,
      total_collected: collected,
      pending_balance: pendingBalance,
      due_till_date: collected,
      fee_status: collected >= netPayable && netPayable > 0 ? "Paid" : collected > 0 ? "Part Paid" : "Due Soon",
      subject_allocations: finalSubjectAllocations,
      instalments: finalInstalments,
    };

    const ledgerRes = await fetch(`${FRAPPE_URL}/api/resource/SmartUp%20Fee%20Ledger`, {
      method: "POST",
      headers: {
        Authorization: AUTH_HEADER,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(feeLedgerDoc),
    });

    let createdLedgerId = "";
    if (ledgerRes.ok) {
      const ledgerData = await ledgerRes.json();
      createdLedgerId = ledgerData.data.name;
    }

    // 6. AUTOMATED ERPNEXT ACCOUNTS INTEGRATION:
    // A) Create & Submit Sales Order (Committed Revenue Contract)
    let createdSalesOrderId = "";
    try {
      const soRes = await fetch(`${FRAPPE_URL}/api/resource/Sales%20Order`, {
        method: "POST",
        headers: {
          Authorization: AUTH_HEADER,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctype: "Sales Order",
          customer: customerName,
          company: "SMART UP",
          transaction_date: today,
          delivery_date: today,
          currency: "INR",
          items: [
            {
              item_code: "TUITION-FEE",
              qty: 1,
              rate: netPayable,
            },
          ],
        }),
      });

      if (soRes.ok) {
        const soData = await soRes.json();
        createdSalesOrderId = soData.data?.name;
        // Submit Sales Order
        await fetch(`${FRAPPE_URL}/api/resource/Sales%20Order/${encodeURIComponent(createdSalesOrderId)}`, {
          method: "PUT",
          headers: {
            Authorization: AUTH_HEADER,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ docstatus: 1 }),
        });
      }
    } catch (e) {
      console.warn("Sales Order creation error:", e);
    }

    // B) Create & Submit Sales Invoice (Debit Debtors, Credit Tuition Fee Income)
    let createdInvoiceId = "";
    try {
      const invRes = await fetch(`${FRAPPE_URL}/api/resource/Sales%20Invoice`, {
        method: "POST",
        headers: {
          Authorization: AUTH_HEADER,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctype: "Sales Invoice",
          customer: customerName,
          company: "SMART UP",
          posting_date: today,
          due_date: today,
          currency: "INR",
          items: [
            {
              item_code: "TUITION-FEE",
              qty: 1,
              rate: netPayable,
            },
          ],
        }),
      });

      if (invRes.ok) {
        const invData = await invRes.json();
        createdInvoiceId = invData.data?.name;
        // Submit Sales Invoice to post to General Ledger
        await fetch(`${FRAPPE_URL}/api/resource/Sales%20Invoice/${encodeURIComponent(createdInvoiceId)}`, {
          method: "PUT",
          headers: {
            Authorization: AUTH_HEADER,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ docstatus: 1 }),
        });
      }
    } catch (e) {
      console.warn("Sales Invoice creation error:", e);
    }

    // C) Create & Submit Payment Entry (Credit Debtors, Debit Bank/Cash, Reconcile Invoice)
    let createdReceiptId = "";
    let createdPaymentEntryId = "";

    if (collect_advance && collected > 0) {
      // 1. Create SmartUp Fee Receipt
      if (createdLedgerId) {
        const receiptDoc = {
          doctype: "SmartUp Fee Receipt",
          naming_series: "SU-REC-.YYYY.-.#####",
          student: createdStudentId,
          fee_ledger: createdLedgerId,
          posting_date: today,
          amount_received: collected,
          currency: "INR",
          mode_of_payment: payment_mode || "Bank Transfer",
          transaction_reference: transaction_reference || `REC-${Date.now()}`,
          payment_status: "Successful",
          remarks: "Initial admission advance collection",
        };

        const receiptRes = await fetch(`${FRAPPE_URL}/api/resource/SmartUp%20Fee%20Receipt`, {
          method: "POST",
          headers: {
            Authorization: AUTH_HEADER,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(receiptDoc),
        });

        if (receiptRes.ok) {
          const rJson = await receiptRes.json();
          createdReceiptId = rJson.data.name;
        }
      }

      // 2. Create ERPNext Payment Entry
      try {
        const payRes = await fetch(`${FRAPPE_URL}/api/resource/Payment%20Entry`, {
          method: "POST",
          headers: {
            Authorization: AUTH_HEADER,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            doctype: "Payment Entry",
            payment_type: "Receive",
            party_type: "Customer",
            party: customerName,
            company: "SMART UP",
            posting_date: today,
            paid_amount: collected,
            received_amount: collected,
            target_exchange_rate: 1,
            paid_to: payment_mode === "Cash" ? "Cash - SU" : "ACADEMIQEDU LEARNING LLP - SU",
            reference_no: transaction_reference || `REC-${Date.now()}`,
            reference_date: today,
            references: createdInvoiceId
              ? [
                  {
                    reference_doctype: "Sales Invoice",
                    reference_name: createdInvoiceId,
                    total_amount: netPayable,
                    outstanding_amount: netPayable,
                    allocated_amount: collected,
                  },
                ]
              : [],
          }),
        });

        if (payRes.ok) {
          const payData = await payRes.json();
          createdPaymentEntryId = payData.data?.name;
          // Submit Payment Entry to finalize GL entry and reconcile Invoice
          await fetch(`${FRAPPE_URL}/api/resource/Payment%20Entry/${encodeURIComponent(createdPaymentEntryId)}`, {
            method: "PUT",
            headers: {
              Authorization: AUTH_HEADER,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ docstatus: 1 }),
          });
        }
      } catch (e) {
        console.warn("Payment Entry creation error:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Student enrolled, Sales Order, Sales Invoice & Payment Entry posted to Frappe General Ledger successfully",
      student_id: createdStudentId,
      student_name,
      ledger_id: createdLedgerId,
      receipt_id: createdReceiptId,
      sales_order_id: createdSalesOrderId,
      sales_invoice_id: createdInvoiceId,
      payment_entry_id: createdPaymentEntryId,
      customer_id: customerName,
    });
  } catch (error: any) {
    console.error("Enrolment API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
