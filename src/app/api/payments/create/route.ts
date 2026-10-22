import { NextRequest, NextResponse } from "next/server";

const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || "https://smartupedu.frappe.cloud";
const API_KEY = process.env.FRAPPE_API_KEY || "39f71c6530cd462";
const API_SECRET = process.env.FRAPPE_API_SECRET || "064f8d6fb2fb0bc";

const AUTH_HEADER = `token ${API_KEY}:${API_SECRET}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      student_id,
      customer,
      invoice_name,
      paid_amount,
      payment_date,
      mode_of_payment = "Bank Transfer",
      reference_no = "",
    } = body;

    if (!student_id || !customer || !invoice_name || !paid_amount) {
      return NextResponse.json(
        { error: "Missing required payment fields (student_id, customer, invoice_name, paid_amount)" },
        { status: 400 }
      );
    }

    const numericAmount = Number(paid_amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    const postingDate = payment_date || new Date().toISOString().split("T")[0];

    // Determine target payment account based on mode
    let paidToAccount = "Cash - SU";
    let erpMode = "Cash";
    if (mode_of_payment.toLowerCase().includes("bank") || mode_of_payment.toLowerCase().includes("wire") || mode_of_payment.toLowerCase().includes("razorpay")) {
      paidToAccount = "Bank Accounts - SU";
      erpMode = "Wire Transfer";
    }

    // 1. Fetch the Sales Invoice to get outstanding & total
    const invoiceRes = await fetch(
      `${FRAPPE_URL}/api/resource/Sales%20Invoice/${encodeURIComponent(invoice_name)}`,
      {
        headers: { Authorization: AUTH_HEADER },
        cache: "no-store",
      }
    );

    if (!invoiceRes.ok) {
      return NextResponse.json({ error: `Sales Invoice ${invoice_name} not found in Frappe` }, { status: 404 });
    }

    const invoiceData = await invoiceRes.json();
    const invoice = invoiceData.data;

    // 2. Create ERPNext Payment Entry
    const paymentEntryPayload = {
      naming_series: "ACC-PAY-.YYYY.-",
      payment_type: "Receive",
      payment_order_status: "Initiated",
      posting_date: postingDate,
      company: invoice.company || "SMART UP",
      party_type: "Customer",
      party: customer,
      party_name: invoice.customer_name || customer,
      mode_of_payment: erpMode,
      paid_from: invoice.debit_to || "Debtors - SU",
      paid_from_account_type: "Receivable",
      paid_from_account_currency: invoice.currency || "INR",
      paid_to: paidToAccount,
      paid_to_account_currency: "INR",
      paid_amount: numericAmount,
      received_amount: numericAmount,
      source_exchange_rate: 1,
      target_exchange_rate: 1,
      total_allocated_amount: numericAmount,
      unallocated_amount: 0,
      difference_amount: 0,
      reference_no: reference_no || `REC-${Date.now().toString().slice(-6)}`,
      reference_date: postingDate,
      remarks: `Payment of ${invoice.currency || "INR"} ${numericAmount} received for ${invoice_name}`,
      references: [
        {
          reference_doctype: "Sales Invoice",
          reference_name: invoice_name,
          due_date: invoice.due_date || invoice.posting_date,
          total_amount: invoice.grand_total,
          outstanding_amount: invoice.outstanding_amount,
          allocated_amount: numericAmount,
          account: invoice.debit_to || "Debtors - SU",
        },
      ],
    };

    const peCreateRes = await fetch(`${FRAPPE_URL}/api/resource/Payment%20Entry`, {
      method: "POST",
      headers: {
        Authorization: AUTH_HEADER,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentEntryPayload),
    });

    const peCreated = await peCreateRes.json();
    if (!peCreateRes.ok) {
      console.error("Payment Entry creation error:", peCreated);
      return NextResponse.json(
        { error: peCreated._server_messages || peCreated.exception || "Failed to create Payment Entry in ERPNext" },
        { status: 500 }
      );
    }

    const paymentEntryName = peCreated.data.name;

    // 3. Submit the Payment Entry (docstatus: 1) so it reflects in General Ledger and clears invoice balance
    const peSubmitRes = await fetch(`${FRAPPE_URL}/api/resource/Payment%20Entry/${encodeURIComponent(paymentEntryName)}`, {
      method: "PUT",
      headers: {
        Authorization: AUTH_HEADER,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ docstatus: 1 }),
    });

    if (!peSubmitRes.ok) {
      console.warn("Could not submit payment entry, left in draft:", await peSubmitRes.text());
    }

    // 4. Create custom SmartUp Fee Receipt for student ledger tracking
    let receiptName = null;
    try {
      const receiptPayload = {
        naming_series: "SU-REC-.YYYY.-.#####",
        student: student_id,
        posting_date: postingDate,
        amount_received: numericAmount,
        currency: invoice.currency || "INR",
        mode_of_payment: mode_of_payment,
        transaction_reference: reference_no || paymentEntryName,
        payment_status: "Successful",
        remarks: `Payment recorded against ${invoice_name} (Payment Entry: ${paymentEntryName})`,
      };

      const recRes = await fetch(`${FRAPPE_URL}/api/resource/SmartUp%20Fee%20Receipt`, {
        method: "POST",
        headers: {
          Authorization: AUTH_HEADER,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(receiptPayload),
      });

      if (recRes.ok) {
        const recData = await recRes.json();
        receiptName = recData.data?.name;
      }
    } catch (e) {
      console.warn("Could not create SmartUp Fee Receipt:", e);
    }

    // 5. Update SmartUp Fee Ledger total_collected & pending_balance
    try {
      const ledgerFindRes = await fetch(
        `${FRAPPE_URL}/api/resource/SmartUp%20Fee%20Ledger?filters=[["student","=","${encodeURIComponent(student_id)}"]]&fields=["name","total_collected","pending_balance"]`,
        { headers: { Authorization: AUTH_HEADER } }
      );
      if (ledgerFindRes.ok) {
        const ledgerList = await ledgerFindRes.json();
        if (ledgerList.data?.length > 0) {
          const ledgerDoc = ledgerList.data[0];
          const newCollected = (Number(ledgerDoc.total_collected) || 0) + numericAmount;
          const newPending = Math.max(0, (Number(ledgerDoc.pending_balance) || 0) - numericAmount);

          await fetch(`${FRAPPE_URL}/api/resource/SmartUp%20Fee%20Ledger/${encodeURIComponent(ledgerDoc.name)}`, {
            method: "PUT",
            headers: {
              Authorization: AUTH_HEADER,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              total_collected: newCollected,
              pending_balance: newPending,
              fee_status: newPending === 0 ? "Fully Paid" : "Part Paid",
            }),
          });
        }
      }
    } catch (e) {
      console.warn("Fee Ledger update notice:", e);
    }

    return NextResponse.json({
      success: true,
      payment_entry: paymentEntryName,
      receipt_name: receiptName,
      amount: numericAmount,
      invoice: invoice_name,
    });
  } catch (error: any) {
    console.error("Payment API Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error recording payment" }, { status: 500 });
  }
}
