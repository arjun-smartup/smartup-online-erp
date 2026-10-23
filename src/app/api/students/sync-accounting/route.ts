import { NextRequest, NextResponse } from "next/server";

const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || "https://smartupedu.frappe.cloud";
const API_KEY = process.env.FRAPPE_API_KEY || "39f71c6530cd462";
const API_SECRET = process.env.FRAPPE_API_SECRET || "064f8d6fb2fb0bc";

const AUTH_HEADER = `token ${API_KEY}:${API_SECRET}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { student_id, sync_all } = body;

    const today = new Date().toISOString().split("T")[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const unpaidDueDate = nextMonth.toISOString().split("T")[0];

    // 1. Fetch Students to sync
    let studentsToSync: any[] = [];
    if (student_id) {
      const sRes = await fetch(`${FRAPPE_URL}/api/resource/SmartUp%20Student/${encodeURIComponent(student_id)}`, {
        headers: { Authorization: AUTH_HEADER },
        cache: "no-store",
      });
      if (!sRes.ok) {
        return NextResponse.json({ error: `Student ${student_id} not found` }, { status: 404 });
      }
      const sJson = await sRes.json();
      studentsToSync = [sJson.data];
    } else {
      const listRes = await fetch(`${FRAPPE_URL}/api/resource/SmartUp%20Student?fields=["name","student_name","country","customer","status","admission_date","delivery_mode"]&limit_page_length=200`, {
        headers: { Authorization: AUTH_HEADER },
        cache: "no-store",
      });
      if (!listRes.ok) {
        return NextResponse.json({ error: "Failed to list students" }, { status: 500 });
      }
      const listJson = await listRes.json();
      studentsToSync = listJson.data || [];
    }

    const syncResults: any[] = [];

    for (const student of studentsToSync) {
      try {
        const sId = student.name;
        const sName = student.student_name;

        // Fetch Fee Ledger
        const flRes = await fetch(`${FRAPPE_URL}/api/resource/SmartUp%20Fee%20Ledger?filters=[["student","=","${encodeURIComponent(sId)}"]]&fields=["*"]`, {
          headers: { Authorization: AUTH_HEADER },
          cache: "no-store",
        });
        const flJson = await flRes.json();
        const ledger = flJson.data?.[0];

        if (!ledger) {
          syncResults.push({ student_id: sId, status: "skipped", reason: "No fee ledger found" });
          continue;
        }

        const grossFee = Number(ledger.gross_fee) || 0;
        const collected = Number(ledger.total_collected) || 0;
        const pending = Number(ledger.pending_balance) || Math.max(0, grossFee - collected);

        if (grossFee <= 0) {
          syncResults.push({ student_id: sId, status: "skipped", reason: "Zero gross fee" });
          continue;
        }

        // A. Ensure Customer
        let customerName = student.customer;
        if (!customerName) {
          const custPayload = {
            doctype: "Customer",
            customer_name: `${sName} (${sId})`,
            customer_type: "Individual",
            customer_group: "Commercial",
            territory: student.country === "India" ? "India" : "All Territories",
          };
          const cRes = await fetch(`${FRAPPE_URL}/api/resource/Customer`, {
            method: "POST",
            headers: { Authorization: AUTH_HEADER, "Content-Type": "application/json" },
            body: JSON.stringify(custPayload),
          });
          if (cRes.ok) {
            const cJson = await cRes.json();
            customerName = cJson.data?.name;
            await fetch(`${FRAPPE_URL}/api/resource/SmartUp%20Student/${encodeURIComponent(sId)}`, {
              method: "PUT",
              headers: { Authorization: AUTH_HEADER, "Content-Type": "application/json" },
              body: JSON.stringify({ customer: customerName }),
            });
          }
        }

        if (!customerName) {
          syncResults.push({ student_id: sId, status: "failed", reason: "Could not establish customer" });
          continue;
        }

        // B. Ensure Sales Order
        const soCheckRes = await fetch(`${FRAPPE_URL}/api/resource/Sales%20Order?filters=[["customer","=","${encodeURIComponent(customerName)}"],["docstatus","!=",2]]&fields=["name"]`, {
          headers: { Authorization: AUTH_HEADER },
          cache: "no-store",
        });
        const soData = (await soCheckRes.json()).data || [];
        let salesOrderId = soData[0]?.name;

        if (!salesOrderId) {
          const soPayload = {
            doctype: "Sales Order",
            naming_series: "SAL-ORD-.YYYY.-",
            customer: customerName,
            company: "SMART UP",
            order_type: "Sales",
            transaction_date: today,
            delivery_date: today,
            currency: "INR",
            selling_price_list: "Standard Selling",
            items: [
              {
                item_code: "TUITION-FEE",
                item_name: "Academic Tuition & Course Fee",
                qty: 1,
                rate: grossFee,
                amount: grossFee,
                delivery_date: today,
              },
            ],
          };
          const soRes = await fetch(`${FRAPPE_URL}/api/resource/Sales%20Order`, {
            method: "POST",
            headers: { Authorization: AUTH_HEADER, "Content-Type": "application/json" },
            body: JSON.stringify(soPayload),
          });
          if (soRes.ok) {
            const soJson = await soRes.json();
            salesOrderId = soJson.data?.name;
            await fetch(`${FRAPPE_URL}/api/resource/Sales%20Order/${encodeURIComponent(salesOrderId)}`, {
              method: "PUT",
              headers: { Authorization: AUTH_HEADER, "Content-Type": "application/json" },
              body: JSON.stringify({ docstatus: 1 }),
            });
          }
        }

        // C. Fetch Existing Invoices
        const invCheckRes = await fetch(`${FRAPPE_URL}/api/resource/Sales%20Invoice?filters=[["customer","=","${encodeURIComponent(customerName)}"],["docstatus","!=",2]]&fields=["name","grand_total","outstanding_amount","status"]`, {
          headers: { Authorization: AUTH_HEADER },
          cache: "no-store",
        });
        const existingInvoices = (await invCheckRes.json()).data || [];

        let createdPaidInv = "";
        let createdUnpaidInv = "";

        // D. Create Paid Invoice + Payment Entry if needed
        if (collected > 0) {
          const hasPaidInvoice = existingInvoices.some((i: any) => Number(i.grand_total) === collected && Number(i.outstanding_amount) === 0);
          if (!hasPaidInvoice) {
            const paidInvPayload = {
              doctype: "Sales Invoice",
              naming_series: "ACC-SINV-.YYYY.-",
              customer: customerName,
              company: "SMART UP",
              posting_date: today,
              due_date: today,
              currency: "INR",
              debit_to: "Debtors - SU",
              remarks: `Admission Advance / Collected Tuition Fee (Student: ${sName} - ${sId})`,
              items: [
                {
                  item_code: "TUITION-FEE",
                  sales_order: salesOrderId || undefined,
                  qty: 1,
                  rate: collected,
                  amount: collected,
                  income_account: "Sales - SU",
                  cost_center: "Main - SU",
                },
              ],
            };
            const pRes = await fetch(`${FRAPPE_URL}/api/resource/Sales%20Invoice`, {
              method: "POST",
              headers: { Authorization: AUTH_HEADER, "Content-Type": "application/json" },
              body: JSON.stringify(paidInvPayload),
            });
            if (pRes.ok) {
              const pData = await pRes.json();
              createdPaidInv = pData.data.name;
              await fetch(`${FRAPPE_URL}/api/resource/Sales%20Invoice/${encodeURIComponent(createdPaidInv)}`, {
                method: "PUT",
                headers: { Authorization: AUTH_HEADER, "Content-Type": "application/json" },
                body: JSON.stringify({ docstatus: 1 }),
              });

              // Payment Entry
              const peRes = await fetch(`${FRAPPE_URL}/api/resource/Payment%20Entry`, {
                method: "POST",
                headers: { Authorization: AUTH_HEADER, "Content-Type": "application/json" },
                body: JSON.stringify({
                  doctype: "Payment Entry",
                  naming_series: "ACC-PAY-.YYYY.-",
                  payment_type: "Receive",
                  party_type: "Customer",
                  party: customerName,
                  company: "SMART UP",
                  posting_date: today,
                  paid_amount: collected,
                  received_amount: collected,
                  source_exchange_rate: 1,
                  target_exchange_rate: 1,
                  paid_from: "Debtors - SU",
                  paid_from_account_currency: "INR",
                  paid_to: "ACADEMIQEDU LEARNING LLP - SU",
                  paid_to_account_currency: "INR",
                  reference_no: `UTR-${sId}-INIT`,
                  reference_date: today,
                  remarks: `Admission payment against ${createdPaidInv}`,
                  references: [
                    {
                      reference_doctype: "Sales Invoice",
                      reference_name: createdPaidInv,
                      total_amount: collected,
                      outstanding_amount: collected,
                      allocated_amount: collected,
                    },
                  ],
                }),
              });

              if (peRes.ok) {
                const peData = await peRes.json();
                const peId = peData.data.name;
                await fetch(`${FRAPPE_URL}/api/resource/Payment%20Entry/${encodeURIComponent(peId)}`, {
                  method: "PUT",
                  headers: { Authorization: AUTH_HEADER, "Content-Type": "application/json" },
                  body: JSON.stringify({ docstatus: 1 }),
                });

                // Fee Receipt
                await fetch(`${FRAPPE_URL}/api/resource/SmartUp%20Fee%20Receipt`, {
                  method: "POST",
                  headers: { Authorization: AUTH_HEADER, "Content-Type": "application/json" },
                  body: JSON.stringify({
                    doctype: "SmartUp Fee Receipt",
                    naming_series: "SU-REC-.YYYY.-.#####",
                    student: sId,
                    fee_ledger: ledger.name,
                    posting_date: today,
                    amount_received: collected,
                    currency: "INR",
                    mode_of_payment: "Bank Transfer",
                    transaction_reference: peId,
                    payment_status: "Successful",
                    remarks: `Advance collection against ${createdPaidInv}`,
                  }),
                });
              }
            }
          }
        }

        // E. Create Unpaid Invoice if needed
        if (pending > 0) {
          const hasUnpaidInvoice = existingInvoices.some((i: any) => Number(i.grand_total) === pending && Number(i.outstanding_amount) > 0);
          if (!hasUnpaidInvoice) {
            const unpaidInvPayload = {
              doctype: "Sales Invoice",
              naming_series: "ACC-SINV-.YYYY.-",
              customer: customerName,
              company: "SMART UP",
              posting_date: today,
              due_date: unpaidDueDate,
              currency: "INR",
              debit_to: "Debtors - SU",
              remarks: `Remaining Tuition Fee Balance (Student: ${sName} - ${sId})`,
              items: [
                {
                  item_code: "TUITION-FEE",
                  sales_order: salesOrderId || undefined,
                  qty: 1,
                  rate: pending,
                  amount: pending,
                  income_account: "Sales - SU",
                  cost_center: "Main - SU",
                },
              ],
            };
            const uRes = await fetch(`${FRAPPE_URL}/api/resource/Sales%20Invoice`, {
              method: "POST",
              headers: { Authorization: AUTH_HEADER, "Content-Type": "application/json" },
              body: JSON.stringify(unpaidInvPayload),
            });
            if (uRes.ok) {
              const uData = await uRes.json();
              createdUnpaidInv = uData.data.name;
              await fetch(`${FRAPPE_URL}/api/resource/Sales%20Invoice/${encodeURIComponent(createdUnpaidInv)}`, {
                method: "PUT",
                headers: { Authorization: AUTH_HEADER, "Content-Type": "application/json" },
                body: JSON.stringify({ docstatus: 1 }),
              });
            }
          }
        }

        syncResults.push({
          student_id: sId,
          student_name: sName,
          customer: customerName,
          sales_order: salesOrderId,
          paid_invoice: createdPaidInv || "already_exists",
          unpaid_invoice: createdUnpaidInv || "already_exists",
          status: "success",
        });

      } catch (innerErr: any) {
        syncResults.push({ student_id: student.name, status: "error", error: innerErr.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Accounting synchronization completed for ${syncResults.length} student(s)`,
      results: syncResults,
    });

  } catch (error: any) {
    console.error("Accounting Sync API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to synchronize accounting" }, { status: 500 });
  }
}
