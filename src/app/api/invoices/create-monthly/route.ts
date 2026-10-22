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
      month_name,
      posting_date,
      due_date,
      subject_hours_breakdown, // array of { subject, hours, rate, subtotal }
    } = body;

    if (!customer || !Array.isArray(subject_hours_breakdown) || subject_hours_breakdown.length === 0) {
      return NextResponse.json({ error: "Customer and subject hours are required" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];
    const invoicePostingDate = posting_date || today;
    const invoiceDueDate = due_date || invoicePostingDate;

    // Calculate total amount & line items
    let grandTotal = 0;
    const items = subject_hours_breakdown.map((item: any) => {
      const hrs = Number(item.hours) || 0;
      const rate = Number(item.rate) || 0;
      const amount = hrs * rate;
      grandTotal += amount;
      return {
        item_code: "TUITION-FEE",
        item_name: `${item.subject || "Subject"} - ${month_name || "Monthly"} Tuition (${hrs} hrs @ ₹${rate}/hr)`,
        description: `Subject: ${item.subject} | Classes: ${hrs} hrs | Rate: ₹${rate}/hr`,
        qty: hrs,
        rate: rate,
        amount: amount,
      };
    });

    // 1. Create Sales Invoice in ERPNext
    const invoiceDoc = {
      doctype: "Sales Invoice",
      customer: customer,
      company: "SMART UP",
      posting_date: invoicePostingDate,
      due_date: invoiceDueDate,
      currency: "INR",
      remarks: `Monthly tuition fee for ${month_name || "Current Month"}`,
      items: items,
    };

    const invRes = await fetch(`${FRAPPE_URL}/api/resource/Sales%20Invoice`, {
      method: "POST",
      headers: {
        Authorization: AUTH_HEADER,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoiceDoc),
    });

    if (!invRes.ok) {
      const errText = await invRes.text();
      return NextResponse.json({ error: "Failed to create Sales Invoice in Frappe", details: errText }, { status: 400 });
    }

    const invData = await invRes.json();
    const createdInvoiceName = invData.data.name;

    // 2. Submit Sales Invoice (post to General Ledger)
    await fetch(`${FRAPPE_URL}/api/resource/Sales%20Invoice/${encodeURIComponent(createdInvoiceName)}`, {
      method: "PUT",
      headers: {
        Authorization: AUTH_HEADER,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ docstatus: 1 }),
    });

    return NextResponse.json({
      success: true,
      message: `Monthly Invoice ${createdInvoiceName} created and submitted successfully`,
      invoice_name: createdInvoiceName,
      grand_total: grandTotal,
      posting_date: invoicePostingDate,
      due_date: invoiceDueDate,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create invoice" }, { status: 500 });
  }
}
