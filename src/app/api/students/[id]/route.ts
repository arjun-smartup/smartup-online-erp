import { NextRequest, NextResponse } from "next/server";

const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || "https://smartupedu.frappe.cloud";
const API_KEY = process.env.FRAPPE_API_KEY || "39f71c6530cd462";
const API_SECRET = process.env.FRAPPE_API_SECRET || "064f8d6fb2fb0bc";

const AUTH_HEADER = `token ${API_KEY}:${API_SECRET}`;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    // 1. Fetch Student Doc
    const studentRes = await fetch(
      `${FRAPPE_URL}/api/resource/SmartUp%20Student/${encodeURIComponent(id)}`,
      {
        headers: { Authorization: AUTH_HEADER },
        cache: "no-store",
      }
    );

    if (!studentRes.ok) {
      return NextResponse.json({ error: "Student not found in Frappe" }, { status: 404 });
    }

    const studentJson = await studentRes.json();
    const student = studentJson.data;

    // 2. Fetch Program Details if linked
    let programName = student.program;
    if (student.program) {
      try {
        const progRes = await fetch(
          `${FRAPPE_URL}/api/resource/SmartUp%20Program/${encodeURIComponent(student.program)}`,
          {
            headers: { Authorization: AUTH_HEADER },
            cache: "no-store",
          }
        );
        if (progRes.ok) {
          const progJson = await progRes.json();
          if (progJson.data?.program_name) {
            programName = progJson.data.program_name;
          }
        }
      } catch (e) {
        console.warn("Program fetch note:", e);
      }
    }

    // 3. Fetch Fee Ledger for this student
    const ledgerRes = await fetch(
      `${FRAPPE_URL}/api/resource/SmartUp%20Fee%20Ledger?filters=[["student","=","${encodeURIComponent(id)}"]]&fields=["name"]`,
      {
        headers: { Authorization: AUTH_HEADER },
        cache: "no-store",
      }
    );

    let feeLedger: any = null;
    if (ledgerRes.ok) {
      const ledgerList = await ledgerRes.json();
      if (ledgerList.data && ledgerList.data.length > 0) {
        const fullLedgerRes = await fetch(
          `${FRAPPE_URL}/api/resource/SmartUp%20Fee%20Ledger/${encodeURIComponent(ledgerList.data[0].name)}`,
          {
            headers: { Authorization: AUTH_HEADER },
            cache: "no-store",
          }
        );
        if (fullLedgerRes.ok) {
          const fl = await fullLedgerRes.json();
          feeLedger = fl.data;
        }
      }
    }

    // 4. Fetch Receipts for this student
    const receiptsRes = await fetch(
      `${FRAPPE_URL}/api/resource/SmartUp%20Fee%20Receipt?filters=[["student","=","${encodeURIComponent(id)}"]]&fields=["name","posting_date","amount_received","currency","mode_of_payment","transaction_reference","payment_status","remarks"]&order_by=posting_date%20desc`,
      {
        headers: { Authorization: AUTH_HEADER },
        cache: "no-store",
      }
    );

    const receiptsData = receiptsRes.ok ? await receiptsRes.json() : { data: [] };
    const receipts = receiptsData.data || [];

    // 5. Fetch Linked ERPNext Sales Invoices if customer exists
    let salesInvoices: any[] = [];
    if (student.customer) {
      try {
        const invoiceRes = await fetch(
          `${FRAPPE_URL}/api/resource/Sales%20Invoice?filters=[["customer","=","${encodeURIComponent(student.customer)}"]]&fields=["name","posting_date","due_date","grand_total","outstanding_amount","status","currency"]&order_by=posting_date%20desc`,
          {
            headers: { Authorization: AUTH_HEADER },
            cache: "no-store",
          }
        );
        if (invoiceRes.ok) {
          const invJson = await invoiceRes.json();
          salesInvoices = invJson.data || [];
        }
      } catch (e) {
        console.warn("Invoice fetch note:", e);
      }
    }

    return NextResponse.json({
      student: {
        ...student,
        resolved_program_name: programName,
      },
      feeLedger,
      receipts,
      salesInvoices,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load student" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    const body = await req.json();

    // Whitelist allowed fields for editing
    const allowedFields = [
      "student_name",
      "guardian_name",
      "guardian_phone",
      "guardian_email",
      "country",
      "billing_currency",
      "admission_date",
      "status",
      "class_level",
      "course_type",
      "delivery_mode",
      "batch_name",
      "program"
    ];

    const payload: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        payload[key] = body[key];
      }
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No valid fields provided for update" }, { status: 400 });
    }

    const frappeRes = await fetch(
      `${FRAPPE_URL}/api/resource/SmartUp%20Student/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers: {
          Authorization: AUTH_HEADER,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!frappeRes.ok) {
      const errText = await frappeRes.text();
      return NextResponse.json(
        { error: "Failed to update student in Frappe Cloud", details: errText },
        { status: frappeRes.status }
      );
    }

    const json = await frappeRes.json();
    return NextResponse.json({
      success: true,
      data: json.data,
      message: "Student details updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update student" }, { status: 500 });
  }
}

