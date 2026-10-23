import { NextRequest, NextResponse } from "next/server";

const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || "https://smartupedu.frappe.cloud";
const API_KEY = process.env.FRAPPE_API_KEY || "39f71c6530cd462";
const API_SECRET = process.env.FRAPPE_API_SECRET || "064f8d6fb2fb0bc";

const AUTH_HEADER = `token ${API_KEY}:${API_SECRET}`;

export async function GET(req: NextRequest) {
  try {
    // Role check: Enforce Director access
    const sessionCookie = req.cookies.get("smartup_session")?.value;
    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie);
        if (session.primaryRole === "Sales User" || session.permissions?.canViewFees === false) {
          return NextResponse.json(
            { error: "Forbidden", message: "Fees & Collections data is restricted to Director role." },
            { status: 403 }
          );
        }
      } catch {
        // Continue
      }
    }

    // 1. Fetch all Students without restrictive program filters (limit=1000 ensures full data)
    const studentsRes = await fetch(
      `${FRAPPE_URL}/api/resource/SmartUp%20Student?fields=["name","student_name","guardian_phone","country","admission_date","program","class_level","delivery_mode","course_type","batch_name","status"]&limit_page_length=1000`,
      {
        headers: { Authorization: AUTH_HEADER },
        cache: "no-store",
      }
    );
    const studentsData = studentsRes.ok ? await studentsRes.json() : { data: [] };
    const studentMap: Record<string, any> = {};
    for (const s of studentsData.data || []) {
      studentMap[s.name] = s;
    }

    // 2. Fetch all Fee Ledgers (limit=1000 ensures full data)
    const ledgersRes = await fetch(
      `${FRAPPE_URL}/api/resource/SmartUp%20Fee%20Ledger?fields=["name","student","batch","billing_mode","gross_fee","discount_amount","net_payable","total_collected","pending_balance","due_till_date","overdue_amount","fee_status","currency"]&limit_page_length=1000`,
      {
        headers: { Authorization: AUTH_HEADER },
        cache: "no-store",
      }
    );

    const ledgersData = ledgersRes.ok ? await ledgersRes.json() : { data: [] };
    const ledgers = (ledgersData.data || []).filter((l: any) => Boolean(studentMap[l.student]));

    // 3. Fetch Receipts (limit=1000 ensures full data)
    const receiptsRes = await fetch(
      `${FRAPPE_URL}/api/resource/SmartUp%20Fee%20Receipt?fields=["name","student","fee_ledger","posting_date","amount_received","mode_of_payment","transaction_reference","payment_status"]&order_by=posting_date%20desc&limit_page_length=1000`,
      {
        headers: { Authorization: AUTH_HEADER },
        cache: "no-store",
      }
    );
    const receiptsData = receiptsRes.ok ? await receiptsRes.json() : { data: [] };
    const receipts = receiptsData.data || [];

    // 4. Calculate Aggregate KPIs
    let totalGross = 0;
    let totalDiscount = 0;
    let totalNet = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let totalDueTillDate = 0;
    let overdueCount = 0;

    const enrichedLedgers = ledgers.map((l: any) => {
      const studentInfo = studentMap[l.student] || {};
      const gross = Number(l.gross_fee) || 0;
      const disc = Number(l.discount_amount) || 0;
      const net = Number(l.net_payable) || 0;
      const collected = Number(l.total_collected) || 0;
      const pending = Number(l.pending_balance) || 0;
      const due = Number(l.due_till_date) || 0;

      totalGross += gross;
      totalDiscount += disc;
      totalNet += net;
      totalCollected += collected;
      totalPending += pending;
      totalDueTillDate += due;

      if (l.fee_status === "Overdue") overdueCount++;

      return {
        ...l,
        student_name: studentInfo.student_name || l.student,
        guardian_phone: studentInfo.guardian_phone || "—",
        country: studentInfo.country || "India",
        admission_date: studentInfo.admission_date || "—",
        program: studentInfo.program || "CBSE Online",
        class_level: studentInfo.class_level || "10th",
        delivery_mode: studentInfo.delivery_mode || "1:1 Tutoring",
        batch_name: studentInfo.batch_name || l.batch,
        status: studentInfo.status || "Active",
      };
    });

    const enrichedReceipts = receipts.map((r: any) => {
      const studentInfo = studentMap[r.student] || {};
      return {
        ...r,
        student_name: studentInfo.student_name || r.student,
      };
    });

    return NextResponse.json({
      summary: {
        totalGross,
        totalDiscount,
        totalNet,
        totalCollected,
        totalPending,
        totalDueTillDate,
        overdueCount,
        studentCount: enrichedLedgers.length,
      },
      ledgers: enrichedLedgers,
      recentReceipts: enrichedReceipts,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch fee data" }, { status: 500 });
  }
}
