import { NextRequest, NextResponse } from "next/server";

const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || "https://smartupedu.frappe.cloud";
const API_KEY = process.env.FRAPPE_API_KEY || "39f71c6530cd462";
const API_SECRET = process.env.FRAPPE_API_SECRET || "064f8d6fb2fb0bc";

const AUTH_HEADER = `token ${API_KEY}:${API_SECRET}`;

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch Students count and recent (All programs, limit=1000 ensures full data)
    const studentsRes = await fetch(
      `${FRAPPE_URL}/api/resource/SmartUp%20Student?fields=["name","student_name","guardian_name","guardian_phone","country","status","admission_date","program"]&order_by=creation%20desc&limit_page_length=1000`,
      {
        headers: { Authorization: AUTH_HEADER },
        cache: "no-store",
      }
    );
    const studentsData = studentsRes.ok ? await studentsRes.json() : { data: [] };
    const students = studentsData.data || [];
    const validStudentIds = new Set(students.map((s: any) => s.name));

    // 2. Fetch Fee Ledgers
    const ledgersRes = await fetch(
      `${FRAPPE_URL}/api/resource/SmartUp%20Fee%20Ledger?fields=["name","student","gross_fee","discount_amount","net_payable","total_collected","pending_balance","due_till_date","fee_status"]&limit_page_length=1000`,
      {
        headers: { Authorization: AUTH_HEADER },
        cache: "no-store",
      }
    );
    const ledgersData = ledgersRes.ok ? await ledgersRes.json() : { data: [] };
    const ledgers = (ledgersData.data || []).filter((l: any) => validStudentIds.has(l.student));

    // 3. Compute KPI aggregations
    let totalGrossFee = 0;
    let totalDiscounts = 0;
    let totalNetPayable = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let totalDueTillDate = 0;
    let overdueCount = 0;

    for (const l of ledgers) {
      totalGrossFee += Number(l.gross_fee) || 0;
      totalDiscounts += Number(l.discount_amount) || 0;
      totalNetPayable += Number(l.net_payable) || 0;
      totalCollected += Number(l.total_collected) || 0;
      totalPending += Number(l.pending_balance) || 0;
      totalDueTillDate += Number(l.due_till_date) || 0;
      if (l.fee_status === "Overdue") {
        overdueCount++;
      }
    }

    // 4. Region Breakdown
    const regionCounts: Record<string, number> = {
      India: 0,
      Kuwait: 0,
      UAE: 0,
      Qatar: 0,
      "Saudi Arabia": 0,
      Oman: 0,
      Bahrain: 0,
    };

    for (const s of students) {
      let c = s.country || "India";
      if (c === "United Arab Emirates") c = "UAE";
      if (regionCounts[c] !== undefined) {
        regionCounts[c]++;
      } else {
        regionCounts[c] = 1;
      }
    }

    // 5. Compute Program-Wise Financial Breakdown
    const PROGRAM_DEFS = [
      {
        id: "CBSE Kerala",
        code: "SU KL",
        title: "CBSE Kerala",
        subtitle: "Kerala Regional Online Batches",
        frappeId: "foue41ggaf",
        accent: "violet" as const,
      },
      {
        id: "State Board",
        code: "SU ST",
        title: "State Board",
        subtitle: "Kerala State Board Syllabus",
        frappeId: "6ou3e6qktl",
        accent: "amber" as const,
      },
      {
        id: "CBSE GCC Online",
        code: "SU GCC-ON",
        title: "CBSE GCC Online",
        subtitle: "Middle East Live Virtual Campus",
        frappeId: "7oui15udm7",
        accent: "teal" as const,
      },
      {
        id: "CBSE GCC Offline",
        code: "SU GCC-OFF",
        title: "CBSE GCC Offline",
        subtitle: "In-Person Gulf Learning Centers",
        frappeId: "5oukbeccjt",
        accent: "sky" as const,
      },
    ];

    const isStudentInProgram = (studentProg: string, p: (typeof PROGRAM_DEFS)[0]) => {
      return (
        studentProg === p.id ||
        studentProg === p.frappeId ||
        (p.id === "State Board" && (studentProg === "State" || studentProg === "6ou3e6qktl")) ||
        (p.id === "CBSE GCC Online" && (studentProg === "CBSE GCC" || studentProg === "7oui15udm7" || studentProg === "GCC Online")) ||
        (p.id === "CBSE Kerala" && (studentProg === "CBSE Kerala" || studentProg === "foue41ggaf" || studentProg === "CBSE Online"))
      );
    };

    const programFinancials = PROGRAM_DEFS.map((p) => {
      const pStudents = students.filter((s: any) => isStudentInProgram(s.program || "", p));
      const pStudentIds = new Set(pStudents.map((s: any) => s.name));
      const pLedgers = ledgers.filter((l: any) => pStudentIds.has(l.student));

      let pNet = 0;
      let pCollected = 0;
      let pPending = 0;

      for (const l of pLedgers) {
        pNet += Number(l.net_payable) || 0;
        pCollected += Number(l.total_collected) || 0;
        pPending += Number(l.pending_balance) || 0;
      }

      const collectionRate = pNet > 0 ? Math.round((pCollected / pNet) * 100) : 0;

      return {
        ...p,
        studentCount: pStudents.length,
        totalNet: pNet,
        totalCollected: pCollected,
        totalPending: pPending,
        collectionRate,
      };
    });

    return NextResponse.json({
      totalStudents: students.length,
      totalGrossFee,
      totalDiscounts,
      totalNetPayable,
      totalCollected,
      totalPending,
      totalDueTillDate,
      overdueCount,
      regionCounts,
      recentStudents: students.slice(0, 5),
      programs: programFinancials,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load summary" }, { status: 500 });
  }
}
