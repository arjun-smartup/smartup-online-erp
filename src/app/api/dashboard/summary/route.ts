import { NextRequest, NextResponse } from "next/server";
import { UserSessionData } from "@/lib/types/auth";

const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || "https://smartupedu.frappe.cloud";
const API_KEY = process.env.FRAPPE_API_KEY || "39f71c6530cd462";
const API_SECRET = process.env.FRAPPE_API_SECRET || "064f8d6fb2fb0bc";

const AUTH_HEADER = `token ${API_KEY}:${API_SECRET}`;

export async function GET(req: NextRequest) {
  try {
    // Check user session & role
    let isSalesRole = false;
    let canViewTotalPending = true;
    const sessionCookie = req.cookies.get("smartup_session")?.value;
    if (sessionCookie) {
      try {
        const session: UserSessionData = JSON.parse(sessionCookie);
        if (session.primaryRole === "Sales User" || session.permissions?.canViewExecutiveFinancials === false) {
          isSalesRole = true;
        }
        if (session.permissions && session.permissions.canViewTotalPending === false) {
          canViewTotalPending = false;
        }
      } catch {
        // Continue
      }
    }

    // 1. Fetch Students count and recent (All programs, limit=1000 ensures full data)
    const studentsRes = await fetch(
      `${FRAPPE_URL}/api/resource/SmartUp%20Student?fields=["name","student_name","guardian_name","guardian_phone","country","status","admission_date","program","class_level"]&order_by=creation%20desc&limit_page_length=1000`,
      {
        headers: { Authorization: AUTH_HEADER },
        cache: "no-store",
      }
    );
    const studentsData = studentsRes.ok ? await studentsRes.json() : { data: [] };
    const students = studentsData.data || [];
    const validStudentIds = new Set(students.map((s: any) => s.name));

    // 2. Class Distribution (Class 8 to 12)
    const classCounts: Record<string, number> = {
      "Class 8": 0,
      "Class 9": 0,
      "Class 10": 0,
      "Class 11": 0,
      "Class 12": 0,
    };
    for (const s of students) {
      if (s.class_level && classCounts[s.class_level] !== undefined) {
        classCounts[s.class_level]++;
      }
    }

    // 3. Region Breakdown
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
        subtitle: "GCC Physical Tuition Centers",
        frappeId: "doubb0d4i2",
        accent: "blue" as const,
      },
    ];

    // If Sales User: return Admissions & Learner metrics without confidential financial ledgers
    if (isSalesRole) {
      const salesProgramData = PROGRAM_DEFS.map((p) => {
        const pStudents = students.filter(
          (s: any) =>
            s.program === p.id ||
            s.program === p.frappeId ||
            (p.id === "CBSE GCC Online" && s.program === "GCC Online") ||
            (p.id === "CBSE Kerala" && s.program === "CBSE Online")
        );
        return {
          ...p,
          studentCount: pStudents.length,
        };
      });

      return NextResponse.json({
        isSalesRole: true,
        totalStudents: students.length,
        activeStudents: students.filter((s: any) => s.status !== "Inactive").length,
        regionCounts,
        classCounts,
        recentStudents: students.slice(0, 8),
        programs: salesProgramData,
      });
    }

    // 4. Fetch Fee Ledgers (for Director role only)
    const ledgersRes = await fetch(
      `${FRAPPE_URL}/api/resource/SmartUp%20Fee%20Ledger?fields=["name","student","gross_fee","discount_amount","net_payable","total_collected","pending_balance","due_till_date","fee_status"]&limit_page_length=1000`,
      {
        headers: { Authorization: AUTH_HEADER },
        cache: "no-store",
      }
    );
    const ledgersData = ledgersRes.ok ? await ledgersRes.json() : { data: [] };
    const ledgers = (ledgersData.data || []).filter((l: any) => validStudentIds.has(l.student));

    // 5. Compute Executive Financial Aggregations
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

    // 6. Compute Program-Wise Financial Breakdown
    const programFinancials = PROGRAM_DEFS.map((p) => {
      const pStudents = students.filter(
        (s: any) =>
          s.program === p.id ||
          s.program === p.frappeId ||
          (p.id === "CBSE GCC Online" && s.program === "GCC Online") ||
          (p.id === "CBSE Kerala" && s.program === "CBSE Online")
      );
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
      isSalesRole: false,
      canViewTotalPending,
      totalStudents: students.length,
      totalGrossFee,
      totalDiscounts,
      totalNetPayable,
      totalCollected,
      totalPending: canViewTotalPending ? totalPending : null,
      totalDueTillDate,
      overdueCount,
      regionCounts,
      classCounts,
      recentStudents: students.slice(0, 8),
      programs: programFinancials,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load summary" }, { status: 500 });
  }
}
