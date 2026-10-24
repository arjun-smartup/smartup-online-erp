"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  CreditCard, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  ArrowLeft,
  ChevronRight,
  ArrowUpRight,
  Download,
  Building2,
  Layers,
  CheckCircle2,
  FileText,
  UserPlus,
  GraduationCap,
  Sparkles,
  PieChart,
  ArrowRight,
  User,
  Users,
  Globe2,
  BookOpen,
  School,
  Wallet
} from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";

interface FeeSummary {
  totalGross: number;
  totalDiscount: number;
  totalNet: number;
  totalCollected: number;
  totalPending: number | null;
  totalDueTillDate: number;
  overdueCount: number;
  studentCount: number;
  canViewTotalPending?: boolean;
}

interface FeeLedger {
  name: string;
  student: string;
  student_name: string;
  guardian_phone: string;
  batch: string;
  country: string;
  billing_mode: string;
  gross_fee: number;
  discount_amount: number;
  net_payable: number;
  total_collected: number;
  pending_balance: number;
  due_till_date: number;
  fee_status: string;
  program?: string;
  class_level?: string;
  course_type?: string;
  delivery_mode?: string;
  batch_name?: string;
  status?: string;
  currency?: string;
}

interface FeeReceipt {
  name: string;
  student_name: string;
  posting_date: string;
  amount_received: number;
  mode_of_payment: string;
  transaction_reference: string;
  payment_status: string;
}

interface ProgramConfig {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  frappeId: string;
  accent: "violet" | "teal" | "amber" | "sky";
}

const PROGRAMS: ProgramConfig[] = [
  {
    id: "CBSE Kerala",
    code: "SU KL",
    title: "CBSE Kerala",
    subtitle: "Kerala Regional Online Batches",
    frappeId: "foue41ggaf",
    accent: "violet",
  },
  {
    id: "State Board",
    code: "SU ST",
    title: "State Board",
    subtitle: "Kerala State Board Syllabus",
    frappeId: "6ou3e6qktl",
    accent: "amber",
  },
  {
    id: "CBSE GCC Online",
    code: "SU GCC-ON",
    title: "CBSE GCC Online",
    subtitle: "Middle East Live Virtual Campus",
    frappeId: "7oui15udm7",
    accent: "teal",
  },
  {
    id: "CBSE GCC Offline",
    code: "SU GCC-OFF",
    title: "CBSE GCC Offline",
    subtitle: "In-Person Gulf Learning Centers",
    frappeId: "5oukbeccjt",
    accent: "sky",
  },
];

const CLASS_LEVELS = ["8th", "9th", "10th", "+1", "+2"];

function FeesPageContent() {
  const searchParams = useSearchParams();
  const metricParam = searchParams.get("metric");

  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [ledgers, setLedgers] = useState<FeeLedger[]>([]);
  const [receipts, setReceipts] = useState<FeeReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Active Metric Filter: "all" | "net_fees" | "collected" | "pending"
  const [activeMetric, setActiveMetric] = useState<"all" | "net_fees" | "collected" | "pending">(() => {
    if (metricParam === "net_fees") return "net_fees";
    if (metricParam === "collected") return "collected";
    if (metricParam === "pending") return "pending";
    return "all";
  });

  // Multi-tier Financial Drill-down state:
  // Tier 1: activeProgram (null => All Programs view)
  // Tier 2: selectedClass (null => Classes view under activeProgram)
  // Tier 3: selectedStream (null => Course Streams view under selectedClass: Regular vs Crash Course)
  // Tier 4: selectedFormat (null => Formats / Batches view under selectedStream)
  // Tier 5: selectedFormat is set (when set => Student Ledger Table)
  const [activeProgram, setActiveProgram] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<"Regular" | "Crash Course" | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);

  const loadFeeData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fees/summary");
      if (res.ok) {
        const json = await res.json();
        setSummary(json.summary);
        setLedgers(json.ledgers || []);
        setReceipts(json.recentReceipts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeeData();
  }, []);

  // Update active metric if query parameter changes
  useEffect(() => {
    if (metricParam === "net_fees") setActiveMetric("net_fees");
    else if (metricParam === "collected") setActiveMetric("collected");
    else if (metricParam === "pending") setActiveMetric("pending");
  }, [metricParam]);

  // Helper to map ledger to program accurately
  const isLedgerInProgram = (l: FeeLedger, p: ProgramConfig) => {
    const prog = l.program;
    return (
      prog === p.id ||
      prog === p.frappeId ||
      (p.id === "State Board" && (prog === "State" || prog === "6ou3e6qktl")) ||
      (p.id === "CBSE GCC Online" && (prog === "CBSE GCC" || prog === "7oui15udm7" || prog === "GCC Online")) ||
      (p.id === "CBSE Kerala" && (prog === "CBSE Kerala" || prog === "foue41ggaf" || prog === "CBSE Online"))
    );
  };

  // Helper to distinguish Regular vs Crash Course
  const isLedgerCrash = (l: FeeLedger) => {
    return (
      l.course_type === "Crash Course" ||
      l.delivery_mode === "Crash Course" ||
      Boolean(l.batch_name && l.batch_name.toLowerCase().includes("crash"))
    );
  };

  const isLedgerRegular = (l: FeeLedger) => !isLedgerCrash(l);

  // Helper to calculate financial metrics for any ledger subset
  const calcMetrics = (ledgerList: FeeLedger[]) => {
    let gross = 0;
    let disc = 0;
    let net = 0;
    let collected = 0;
    let pending = 0;
    let due = 0;
    for (const l of ledgerList) {
      gross += Number(l.gross_fee) || 0;
      disc += Number(l.discount_amount) || 0;
      net += Number(l.net_payable) || 0;
      collected += Number(l.total_collected) || 0;
      pending += Number(l.pending_balance) || 0;
      due += Number(l.due_till_date) || 0;
    }
    const collectionRate = net > 0 ? Math.round((collected / net) * 100) : 0;
    return { gross, disc, net, collected, pending, due, count: ledgerList.length, collectionRate };
  };

  // Filter ledgers for current active program
  const currentProgramObj = useMemo(() => {
    return PROGRAMS.find((p) => p.id === activeProgram) || null;
  }, [activeProgram]);

  const programLedgers = useMemo(() => {
    if (!currentProgramObj) return ledgers;
    return ledgers.filter((l) => isLedgerInProgram(l, currentProgramObj));
  }, [ledgers, currentProgramObj]);

  // Filter ledgers for selected class
  const classLedgers = useMemo(() => {
    if (!selectedClass) return programLedgers;
    return programLedgers.filter((l) => l.class_level?.includes(selectedClass));
  }, [programLedgers, selectedClass]);

  // Filter ledgers for selected stream (Regular vs Crash Course)
  const streamLedgers = useMemo(() => {
    if (!selectedStream) return classLedgers;
    if (selectedStream === "Crash Course") {
      return classLedgers.filter(isLedgerCrash);
    }
    return classLedgers.filter(isLedgerRegular);
  }, [classLedgers, selectedStream]);

  // Format options depending on program type and stream
  const isStateBoard = activeProgram === "State Board";
  const isCrash = selectedStream === "Crash Course";

  const formatOptions = useMemo(() => {
    if (isCrash) {
      const defaultBatches = ["Crash Batch 1", "Crash Batch 2", "Crash Batch 3"];
      const customBatches: string[] = [];
      for (const l of streamLedgers) {
        if (l.batch_name && !defaultBatches.includes(l.batch_name) && l.batch_name.toLowerCase().includes("crash")) {
          if (!customBatches.includes(l.batch_name)) {
            customBatches.push(l.batch_name);
          }
        }
      }
      return [...defaultBatches, ...customBatches].map((b) => ({
        id: b,
        label: b,
        desc: "Fast Track Exam Sprint & Revision Cohort",
      }));
    }

    if (isStateBoard) {
      return [
        { id: "Batch A", label: "Batch A", desc: "Cohort Morning / Primary Track" },
        { id: "Batch B", label: "Batch B", desc: "Cohort Evening Track" },
        { id: "Batch C", label: "Batch C", desc: "Cohort Weekend Track" },
      ];
    }

    return [
      { id: "1:1 Tutoring", label: "1:1 Tutoring", desc: "Dedicated 1-on-1 Personalized Mentorship" },
      { id: "1:3 Group", label: "1:3 Group", desc: "Focused Triad Micro-Group" },
      { id: "Micro Batch", label: "Micro Batch", desc: "Small Cohort Delivery Batch" },
    ];
  }, [isCrash, isStateBoard, streamLedgers]);

  // Helper to match ledger against format or batch
  const isLedgerInFormat = (l: FeeLedger, formatId: string) => {
    if (isCrash) {
      return l.batch_name === formatId || (!l.batch_name && formatId === "Crash Batch 1");
    }
    if (isStateBoard) {
      return l.batch_name?.includes(formatId) || (!l.batch_name && formatId === "Batch A");
    }
    return (
      l.delivery_mode?.toLowerCase().includes(formatId.toLowerCase()) ||
      (formatId === "1:1 Tutoring" && (l.delivery_mode?.includes("1:1") || !l.delivery_mode))
    );
  };

  // Filtered ledgers for Tier 5 Table Roster
  const rosterLedgers = useMemo(() => {
    let list = streamLedgers;
    if (selectedFormat && selectedFormat !== "All") {
      list = list.filter((l) => isLedgerInFormat(l, selectedFormat));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.student_name?.toLowerCase().includes(q) ||
          l.batch?.toLowerCase().includes(q) ||
          l.guardian_phone?.includes(q) ||
          l.student?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "All") {
      list = list.filter((l) => l.fee_status === statusFilter);
    }
    return list;
  }, [streamLedgers, selectedFormat, search, statusFilter, isCrash, isStateBoard]);

  // Export Roster to CSV
  const exportToCSV = () => {
    if (rosterLedgers.length === 0) return;
    const headers = [
      "Student ID",
      "Student Name",
      "Program",
      "Class Level",
      "Course Stream",
      "Delivery Mode / Batch",
      "Gross Fee",
      "Discount",
      "Net Payable",
      "Collected",
      "Pending",
      "Status"
    ];
    const rows = rosterLedgers.map((l) => [
      l.student,
      `"${l.student_name}"`,
      `"${l.program || ''}"`,
      `"${l.class_level || ''}"`,
      `"${l.course_type || (isLedgerCrash(l) ? 'Crash Course' : 'Regular')}"`,
      `"${l.delivery_mode || l.batch_name || ''}"`,
      l.gross_fee,
      l.discount_amount,
      l.net_payable,
      l.total_collected,
      l.pending_balance,
      l.fee_status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SmartUp_Fee_Ledger_${activeProgram || 'All'}_Class_${selectedClass || 'All'}_${selectedStream || 'All'}_${selectedFormat || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Financial metrics calculated at each level
  const activeProgramMetrics = useMemo(() => calcMetrics(programLedgers), [programLedgers]);
  const activeClassMetrics = useMemo(() => calcMetrics(classLedgers), [classLedgers]);
  const activeStreamMetrics = useMemo(() => calcMetrics(streamLedgers), [streamLedgers]);
  const activeCohortMetrics = useMemo(() => calcMetrics(rosterLedgers), [rosterLedgers]);

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-20">
      
      {/* Sleek Minimal Breadcrumbs & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium flex-wrap">
          <Link href="/" className="hover:text-slate-900 transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          
          <button
            onClick={() => {
              setActiveProgram(null);
              setSelectedClass(null);
              setSelectedStream(null);
              setSelectedFormat(null);
              setSearch("");
            }}
            className={`hover:text-slate-900 transition-colors cursor-pointer ${
              !activeProgram ? "text-slate-900 font-semibold" : "text-slate-500"
            }`}
          >
            Fees & Collections
          </button>

          {activeProgram && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <button
                onClick={() => {
                  setSelectedClass(null);
                  setSelectedStream(null);
                  setSelectedFormat(null);
                  setSearch("");
                }}
                className={`hover:text-slate-900 transition-colors cursor-pointer ${
                  !selectedClass ? "text-slate-900 font-semibold" : "text-slate-500"
                }`}
              >
                {activeProgram}
              </button>
            </>
          )}

          {selectedClass && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <button
                onClick={() => {
                  setSelectedStream(null);
                  setSelectedFormat(null);
                  setSearch("");
                }}
                className={`hover:text-slate-900 transition-colors cursor-pointer ${
                  !selectedStream ? "text-slate-900 font-semibold" : "text-slate-500"
                }`}
              >
                Class {selectedClass}
              </button>
            </>
          )}

          {selectedStream && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <button
                onClick={() => {
                  setSelectedFormat(null);
                  setSearch("");
                }}
                className={`hover:text-slate-900 transition-colors cursor-pointer ${
                  !selectedFormat ? "text-slate-900 font-semibold" : "text-slate-500"
                }`}
              >
                {selectedStream}
              </button>
            </>
          )}

          {selectedFormat && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span className="text-slate-900 font-semibold px-2 py-0.5 rounded bg-slate-100 border border-slate-200/80">
                {selectedFormat === "All" ? `All ${selectedStream} Ledgers` : selectedFormat}
              </span>
            </>
          )}
        </div>

        {/* Right Action Tools: Metric Filter & Refresh */}
        <div className="flex items-center gap-2">
          {/* Segmented Metric Focus Tabs */}
          <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs font-medium shadow-2xs">
            <button
              onClick={() => setActiveMetric("all")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeMetric === "all" ? "bg-white text-slate-900 font-semibold shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              All Metrics
            </button>
            <button
              onClick={() => setActiveMetric("net_fees")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeMetric === "net_fees" ? "bg-white text-slate-900 font-semibold shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Net Fees
            </button>
            <button
              onClick={() => setActiveMetric("collected")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeMetric === "collected" ? "bg-white text-emerald-700 font-semibold shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Collected
            </button>
            <button
              onClick={() => setActiveMetric("pending")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeMetric === "pending" ? "bg-white text-rose-700 font-semibold shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Pending
            </button>
          </div>

          <button
            onClick={loadFeeData}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh Ledger Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIER 1: PROGRAM-WISE FINANCIAL OVERVIEW */}
      {/* ========================================================================= */}
      {!activeProgram && (
        <div className="space-y-5 animate-in fade-in duration-150">
          
          {/* Top Aggregate KPI Strip (Interactive Executive Control Bar) */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${summary?.canViewTotalPending !== false ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-3`}>
            
            {/* KPI 1: Net Fees */}
            <div 
              onClick={() => setActiveMetric(activeMetric === "net_fees" ? "all" : "net_fees")}
              className={`relative bg-white rounded-xl p-3.5 space-y-1.5 transition-all duration-200 cursor-pointer group border overflow-hidden ${
                activeMetric === "net_fees" 
                  ? "border-violet-500/60 ring-2 ring-violet-500/10 shadow-sm bg-gradient-to-b from-white via-white to-violet-50/20 before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-violet-500 before:to-indigo-600" 
                  : "border-slate-200/80 hover:border-slate-300 hover:shadow-xs shadow-2xs"
              }`}
            >
              <div className="flex items-center justify-between text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Net Revenue</span>
                  {activeMetric === "net_fees" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
                  )}
                </div>
                <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition-all ${
                  activeMetric === "net_fees" 
                    ? "bg-violet-600 text-white shadow-xs" 
                    : "bg-violet-50 text-violet-600 group-hover:scale-105"
                }`}>
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline">
                <span className="text-sm font-semibold text-slate-400 mr-1">₹</span>
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 font-feature-settings-['tnum']">
                  {loading ? "—" : <AnimatedNumber value={summary?.totalNet || 0} />}
                </span>
              </div>
              <div className="flex items-center justify-between pt-0.5 text-[11px]">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  Across {summary?.studentCount || 0} active agreements
                </span>
                <span className={`text-[9px] font-bold ${activeMetric === "net_fees" ? "text-violet-600" : "text-slate-400 group-hover:text-slate-700"}`}>
                  {activeMetric === "net_fees" ? "Active" : "Filter"}
                </span>
              </div>
            </div>

            {/* KPI 2: Total Collected */}
            <div 
              onClick={() => setActiveMetric(activeMetric === "collected" ? "all" : "collected")}
              className={`relative bg-white rounded-xl p-3.5 space-y-1.5 transition-all duration-200 cursor-pointer group border overflow-hidden ${
                activeMetric === "collected" 
                  ? "border-emerald-500/60 ring-2 ring-emerald-500/10 shadow-sm bg-gradient-to-b from-white via-white to-emerald-50/20 before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-emerald-500 before:to-teal-500" 
                  : "border-slate-200/80 hover:border-slate-300 hover:shadow-xs shadow-2xs"
              }`}
            >
              <div className="flex items-center justify-between text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Collected</span>
                  {activeMetric === "collected" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  )}
                </div>
                <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition-all ${
                  activeMetric === "collected" 
                    ? "bg-emerald-600 text-white shadow-xs" 
                    : "bg-emerald-50 text-emerald-600 group-hover:scale-105"
                }`}>
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline">
                <span className="text-sm font-semibold text-emerald-600/70 mr-1">₹</span>
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-600 font-feature-settings-['tnum']">
                  {loading ? "—" : <AnimatedNumber value={summary?.totalCollected || 0} />}
                </span>
              </div>
              <div className="flex items-center justify-between pt-0.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-mono">
                    {summary?.totalNet ? Math.round(((summary.totalCollected || 0) / summary.totalNet) * 100) : 0}%
                  </span>
                  <span className="text-slate-400 font-medium">In GL</span>
                </div>
                <span className={`text-[9px] font-bold ${activeMetric === "collected" ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-700"}`}>
                  {activeMetric === "collected" ? "Active" : "Filter"}
                </span>
              </div>
            </div>

            {/* KPI 3: Pending Balance (Visible for Director, hidden for Operations) */}
            {summary?.canViewTotalPending !== false && (
              <div 
                onClick={() => setActiveMetric(activeMetric === "pending" ? "all" : "pending")}
                className={`relative bg-white rounded-xl p-3.5 space-y-1.5 transition-all duration-200 cursor-pointer group border overflow-hidden ${
                  activeMetric === "pending" 
                    ? "border-amber-500/60 ring-2 ring-amber-500/10 shadow-sm bg-gradient-to-b from-white via-white to-amber-50/20 before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-amber-400 before:to-orange-500" 
                    : "border-slate-200/80 hover:border-slate-300 hover:shadow-xs shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Balance</span>
                    {activeMetric === "pending" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                    )}
                  </div>
                  <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition-all ${
                    activeMetric === "pending" 
                      ? "bg-amber-500 text-white shadow-xs" 
                      : "bg-amber-50 text-amber-600 group-hover:scale-105"
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline">
                  <span className="text-sm font-semibold text-slate-400 mr-1">₹</span>
                  <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 font-feature-settings-['tnum']">
                    {loading ? "—" : <AnimatedNumber value={summary?.totalPending || 0} />}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-0.5 text-[11px]">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Remaining dues
                  </span>
                  <span className={`text-[9px] font-bold ${activeMetric === "pending" ? "text-amber-600" : "text-slate-400 group-hover:text-slate-700"}`}>
                    {activeMetric === "pending" ? "Active" : "Filter"}
                  </span>
                </div>
              </div>
            )}

            {/* KPI 4: Due Till Date */}
            <div className="relative bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl p-3.5 space-y-1.5 shadow-2xs hover:shadow-xs transition-all duration-200">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Due Till Date</span>
                <div className="w-7.5 h-7.5 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline">
                <span className="text-sm font-semibold text-slate-400 mr-1">₹</span>
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 font-feature-settings-['tnum']">
                  {loading ? "—" : <AnimatedNumber value={summary?.totalDueTillDate || 0} />}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium pt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {summary?.overdueCount || 0} overdue accounts
              </p>
            </div>
          </div>

          {/* Program Cards Grid — Elevated Executive Grade */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-950 tracking-tight">Program Financial Breakdown</h2>
                <p className="text-[11px] text-slate-500">Click a program to explore class-wise and format-wise fee ledgers</p>
              </div>
              <span className="text-[11px] text-slate-600 font-semibold bg-white border border-slate-200/80 px-2.5 py-0.5 rounded-lg shadow-2xs">
                {PROGRAMS.length} Operating Programs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PROGRAMS.map((p) => {
                const pLedgers = ledgers.filter((l) => isLedgerInProgram(l, p));
                const metrics = calcMetrics(pLedgers);

                // Distinct theme styling per program
                const getProgramTheme = () => {
                  if (p.accent === "violet") {
                    return {
                      icon: <Sparkles className="w-3 h-3 text-white" />,
                      avatarBg: "bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xs shadow-violet-500/25",
                      topBar: "before:bg-gradient-to-r before:from-violet-500 before:via-indigo-500 before:to-purple-600",
                      hoverBorder: "hover:border-violet-300",
                    };
                  }
                  if (p.accent === "teal") {
                    return {
                      icon: <Globe2 className="w-3 h-3 text-white" />,
                      avatarBg: "bg-gradient-to-br from-teal-500 to-emerald-600 shadow-2xs shadow-teal-500/25",
                      topBar: "before:bg-gradient-to-r before:from-teal-500 before:via-emerald-500 before:to-cyan-600",
                      hoverBorder: "hover:border-teal-300",
                    };
                  }
                  if (p.accent === "amber") {
                    return {
                      icon: <BookOpen className="w-3 h-3 text-white" />,
                      avatarBg: "bg-gradient-to-br from-amber-500 to-orange-500 shadow-2xs shadow-amber-500/25",
                      topBar: "before:bg-gradient-to-r before:from-amber-400 before:via-orange-500 before:to-amber-600",
                      hoverBorder: "hover:border-amber-300",
                    };
                  }
                  return {
                    icon: <School className="w-3 h-3 text-white" />,
                    avatarBg: "bg-gradient-to-br from-sky-500 to-blue-600 shadow-2xs shadow-sky-500/25",
                    topBar: "before:bg-gradient-to-r before:from-sky-400 before:via-blue-500 before:to-indigo-600",
                    hoverBorder: "hover:border-sky-300",
                  };
                };

                const theme = getProgramTheme();

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveProgram(p.id);
                      setSelectedClass(null);
                      setSelectedFormat(null);
                    }}
                    className={`relative bg-white border border-slate-200/80 ${theme.hoverBorder} rounded-xl p-3 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-2 overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 ${theme.topBar}`}
                  >
                    {/* Header: Program Avatar, Title, Enrolled Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white shrink-0 ${theme.avatarBg}`}>
                          {theme.icon}
                        </div>
                        <h3 className="font-bold text-xs sm:text-[13px] text-slate-900 group-hover:text-slate-950 tracking-tight truncate">
                          {p.title}
                        </h3>
                      </div>

                      <div className="shrink-0">
                        {metrics.count > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-800 border border-slate-200/70 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {metrics.count} St.
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[9px] font-medium px-1.5 py-0.2 rounded-full bg-slate-50 text-slate-400 border border-slate-200/50">
                            0
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Financial Amount: Clean Bold Typography */}
                    <div className="flex items-baseline pt-0">
                      <span className="text-xs font-semibold text-slate-400 mr-1">₹</span>
                      <span className="text-lg sm:text-xl font-extrabold text-slate-950 tracking-tight font-feature-settings-['tnum']">
                        <AnimatedNumber value={metrics.net} />
                      </span>
                    </div>

                    {/* Two-Pillar Split: Collected vs Pending */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {/* Collected Pillar */}
                      <div className="bg-emerald-50/70 hover:bg-emerald-50/90 border border-emerald-100/90 rounded-lg p-1.5 space-y-0.5 transition-colors">
                        <div className="flex items-center justify-between text-[8.5px]">
                          <span className="font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            Collected
                          </span>
                          <span className="font-extrabold text-emerald-800 font-mono">
                            {metrics.collectionRate}%
                          </span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-[10px] font-semibold text-emerald-600/70 mr-0.5">₹</span>
                          <span className="text-xs sm:text-[13px] font-bold text-emerald-950 tracking-tight font-feature-settings-['tnum'] truncate">
                            <AnimatedNumber value={metrics.collected} />
                          </span>
                        </div>
                      </div>

                      {/* Pending Pillar */}
                      <div className="bg-slate-50/90 hover:bg-slate-100/80 border border-slate-200/80 rounded-lg p-1.5 space-y-0.5 transition-colors">
                        <div className="flex items-center justify-between text-[8.5px]">
                          <span className="font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-amber-400" />
                            Pending
                          </span>
                          <span className="font-extrabold text-slate-700 font-mono">
                            {metrics.count > 0 ? 100 - metrics.collectionRate : 0}%
                          </span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-[10px] font-semibold text-slate-400 mr-0.5">₹</span>
                          <span className="text-xs sm:text-[13px] font-bold text-slate-950 tracking-tight font-feature-settings-['tnum'] truncate">
                            <AnimatedNumber value={metrics.pending} />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Realization Gauge */}
                    <div className="space-y-0.5">
                      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500 shadow-2xs shadow-emerald-500/20"
                          style={{ width: `${Math.min(100, metrics.collectionRate)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[8.5px] text-slate-400 font-medium">
                        <span className="text-emerald-700 font-semibold">{metrics.collectionRate}% Realized</span>
                        <span className="truncate">₹ <AnimatedNumber value={metrics.pending} /> rem.</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TIER 2: CLASS-WISE FINANCIAL BREAKDOWN */}
      {/* ========================================================================= */}
      {activeProgram && !selectedClass && (
        <div className="space-y-7 animate-in fade-in duration-150">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
            <div className="space-y-1">
              <button
                onClick={() => {
                  setActiveProgram(null);
                  setSelectedClass(null);
                  setSelectedFormat(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to All Programs
              </button>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {activeProgram} — Class Level Financial Breakdown
              </h2>
              <p className="text-xs text-slate-500">
                Total Net: ₹ {activeProgramMetrics.net.toLocaleString()} • Collected: ₹ {activeProgramMetrics.collected.toLocaleString()} • Pending: ₹ {activeProgramMetrics.pending.toLocaleString()} across {activeProgramMetrics.count} students
              </p>
            </div>

            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/60 self-start sm:self-auto shadow-2xs font-mono">
              {activeProgramMetrics.collectionRate}% Realized Overall
            </span>
          </div>

          {/* 3 Executive Summary Cards for this Program */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Program Net Fees</span>
              <div className="flex items-baseline">
                <span className="text-sm font-semibold text-slate-400 mr-1">₹</span>
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 font-feature-settings-['tnum']">
                  <AnimatedNumber value={activeProgramMetrics.net} />
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Total contractual commitment</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Deposited</span>
              <div className="flex items-baseline">
                <span className="text-sm font-semibold text-emerald-600/70 mr-1">₹</span>
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-600 font-feature-settings-['tnum']">
                  <AnimatedNumber value={activeProgramMetrics.collected} />
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold">{activeProgramMetrics.collectionRate}% realization rate</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outstanding Pending</span>
              <div className="flex items-baseline">
                <span className="text-sm font-semibold text-slate-400 mr-1">₹</span>
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 font-feature-settings-['tnum']">
                  <AnimatedNumber value={activeProgramMetrics.pending} />
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Due across {activeProgramMetrics.count} active ledgers</p>
            </div>
          </div>

          {/* Class Cards Grid — Elevated Design */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Select Class Level
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {CLASS_LEVELS.map((cls) => {
                const cLedgers = programLedgers.filter((l) => l.class_level?.includes(cls));
                const metrics = calcMetrics(cLedgers);

                return (
                  <div
                    key={cls}
                    onClick={() => {
                      setSelectedClass(cls);
                      setSelectedStream(null);
                      setSelectedFormat(null);
                    }}
                    className="relative bg-white border border-slate-200/80 hover:border-violet-300 rounded-xl p-3.5 space-y-2.5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-8 h-8 rounded-lg font-bold font-mono text-xs bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                          {cls}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-slate-950 transition-colors truncate">
                            Class {cls}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate">
                            {metrics.count} active student{metrics.count === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>

                      <div className="w-6.5 h-6.5 rounded-full bg-slate-50 border border-slate-200/70 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 text-slate-400 flex items-center justify-center transition-all duration-200 shadow-2xs shrink-0">
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                    {/* Net Fees Hero Amount */}
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                        Total Net Fees
                      </span>
                      <div className="flex items-baseline">
                        <span className="text-xs font-semibold text-slate-400 mr-1">₹</span>
                        <span className="text-lg sm:text-xl font-extrabold text-slate-950 tracking-tight font-feature-settings-['tnum']">
                          <AnimatedNumber value={metrics.net} />
                        </span>
                      </div>
                    </div>

                    {/* Two-Column Split (Collected vs Pending) */}
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-lg p-1.5 space-y-0.5">
                        <div className="flex items-center justify-between text-[8.5px]">
                          <span className="font-bold text-emerald-800 uppercase tracking-wider">Collected</span>
                          <span className="font-bold text-emerald-700 font-mono">{metrics.collectionRate}%</span>
                        </div>
                        <div className="text-xs sm:text-[13px] font-bold text-emerald-950 font-feature-settings-['tnum'] truncate">
                          ₹ <AnimatedNumber value={metrics.collected} />
                        </div>
                      </div>
                      <div className="bg-slate-50/90 border border-slate-200/70 rounded-lg p-1.5 space-y-0.5">
                        <div className="flex items-center justify-between text-[8.5px]">
                          <span className="font-bold text-slate-600 uppercase tracking-wider">Pending</span>
                          <span className="font-bold text-slate-500 font-mono">{metrics.count > 0 ? 100 - metrics.collectionRate : 0}%</span>
                        </div>
                        <div className="text-xs sm:text-[13px] font-bold text-slate-950 font-feature-settings-['tnum'] truncate">
                          ₹ <AnimatedNumber value={metrics.pending} />
                        </div>
                      </div>
                    </div>

                    {/* Mini Progress Track */}
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, metrics.collectionRate)}%` }}
                      />
                    </div>

                    {/* Streams & Action */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1 font-mono text-[9px]">
                        <span className="px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                          Regular: {cLedgers.filter(isLedgerRegular).length}
                        </span>
                        <span className="px-1.5 py-0.2 rounded font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                          Crash: {cLedgers.filter(isLedgerCrash).length}
                        </span>
                      </div>

                      <span className="text-slate-600 group-hover:text-slate-950 font-semibold flex items-center gap-0.5 transition-colors">
                        Streams
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TIER 3: COURSE STREAM BREAKDOWN (Regular vs Crash Course) */}
      {/* ========================================================================= */}
      {activeProgram && selectedClass && !selectedStream && (
        <div className="space-y-7 animate-in fade-in duration-150">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
            <div className="space-y-1">
              <button
                onClick={() => {
                  setSelectedClass(null);
                  setSelectedStream(null);
                  setSelectedFormat(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Class Levels
              </button>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {activeProgram} — Class {selectedClass} Academic Streams
              </h2>
              <p className="text-xs text-slate-500">
                Class {selectedClass} Total: ₹ {activeClassMetrics.net.toLocaleString()} Net • ₹ {activeClassMetrics.collected.toLocaleString()} Collected across {activeClassMetrics.count} students
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedStream("Regular");
                setSelectedFormat("All");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              View Combined Class {selectedClass} Ledger ({activeClassMetrics.count})
            </button>
          </div>

          {/* 3 Executive Summary Cards for this Class */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class {selectedClass} Net Fees</span>
              <div className="flex items-baseline">
                <span className="text-sm font-semibold text-slate-400 mr-1">₹</span>
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 font-feature-settings-['tnum']">
                  <AnimatedNumber value={activeClassMetrics.net} />
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Total contractual commitment</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Deposited</span>
              <div className="flex items-baseline">
                <span className="text-sm font-semibold text-emerald-600/70 mr-1">₹</span>
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-600 font-feature-settings-['tnum']">
                  <AnimatedNumber value={activeClassMetrics.collected} />
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold">{activeClassMetrics.collectionRate}% realization rate</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outstanding Pending</span>
              <div className="flex items-baseline">
                <span className="text-sm font-semibold text-slate-400 mr-1">₹</span>
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 font-feature-settings-['tnum']">
                  <AnimatedNumber value={activeClassMetrics.pending} />
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Due across {activeClassMetrics.count} active ledgers</p>
            </div>
          </div>

          {/* Stream Cards Grid */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Select Course Stream
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stream 1: Regular Course */}
              {(() => {
                const regLedgers = classLedgers.filter(isLedgerRegular);
                const regMetrics = calcMetrics(regLedgers);
                return (
                  <div
                    onClick={() => {
                      setSelectedStream("Regular");
                      setSelectedFormat(null);
                    }}
                    className="relative bg-white border border-slate-200/80 hover:border-violet-300 rounded-xl p-4 space-y-3 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                          <BookOpen className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                              Regular Course
                            </h4>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-violet-50 text-violet-700 border border-violet-200/60 font-mono">
                              Full Year
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {regMetrics.count} enrolled student{regMetrics.count === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>

                      <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/70 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 text-slate-400 flex items-center justify-center transition-all duration-200 shadow-2xs shrink-0">
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      Full academic curriculum with personalized 1:1, 1:3 group, and micro batch delivery formats.
                    </p>

                    {/* Net Fees Hero Amount */}
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                        Total Net Fees
                      </span>
                      <div className="flex items-baseline">
                        <span className="text-xs font-semibold text-slate-400 mr-1">₹</span>
                        <span className="text-lg sm:text-xl font-extrabold text-slate-950 tracking-tight font-feature-settings-['tnum']">
                          <AnimatedNumber value={regMetrics.net} />
                        </span>
                      </div>
                    </div>

                    {/* Two-Column Split (Collected vs Pending) */}
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-lg p-2 space-y-0.5">
                        <div className="flex items-center justify-between text-[8.5px]">
                          <span className="font-bold text-emerald-800 uppercase tracking-wider">Collected</span>
                          <span className="font-bold text-emerald-700 font-mono">{regMetrics.collectionRate}%</span>
                        </div>
                        <div className="text-xs sm:text-[13px] font-bold text-emerald-950 font-feature-settings-['tnum'] truncate">
                          ₹ <AnimatedNumber value={regMetrics.collected} />
                        </div>
                      </div>
                      <div className="bg-slate-50/90 border border-slate-200/70 rounded-lg p-2 space-y-0.5">
                        <div className="flex items-center justify-between text-[8.5px]">
                          <span className="font-bold text-slate-600 uppercase tracking-wider">Pending</span>
                          <span className="font-bold text-slate-500 font-mono">{regMetrics.count > 0 ? 100 - regMetrics.collectionRate : 0}%</span>
                        </div>
                        <div className="text-xs sm:text-[13px] font-bold text-slate-950 font-feature-settings-['tnum'] truncate">
                          ₹ <AnimatedNumber value={regMetrics.pending} />
                        </div>
                      </div>
                    </div>

                    {/* Mini Progress Track */}
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, regMetrics.collectionRate)}%` }}
                      />
                    </div>

                    {/* Footer Indicator */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1 font-mono text-[9px] text-slate-600">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200/60 font-semibold">
                          1:1: {regLedgers.filter(l => l.delivery_mode?.includes("1:1")).length}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200/60 font-semibold">
                          1:3: {regLedgers.filter(l => l.delivery_mode?.includes("1:3")).length}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200/60 font-semibold">
                          Micro: {regLedgers.filter(l => l.delivery_mode?.toLowerCase().includes("micro")).length}
                        </span>
                      </div>
                      <span className="text-slate-700 group-hover:text-slate-950 font-bold flex items-center gap-0.5 transition-colors">
                        Explore Formats
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Stream 2: Crash Course */}
              {(() => {
                const crashLedgers = classLedgers.filter(isLedgerCrash);
                const crashMetrics = calcMetrics(crashLedgers);
                return (
                  <div
                    onClick={() => {
                      setSelectedStream("Crash Course");
                      setSelectedFormat(null);
                    }}
                    className="relative bg-white border border-slate-200/80 hover:border-amber-300 rounded-xl p-4 space-y-3 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs shrink-0">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                              Crash Course
                            </h4>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200/60 font-mono">
                              Fast Track
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {crashMetrics.count} enrolled student{crashMetrics.count === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>

                      <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/70 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 text-slate-400 flex items-center justify-center transition-all duration-200 shadow-2xs shrink-0">
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      Exam sprint batches, fast-track revision cohorts, and test-prep intensive programs.
                    </p>

                    {/* Net Fees Hero Amount */}
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                        Total Net Fees
                      </span>
                      <div className="flex items-baseline">
                        <span className="text-xs font-semibold text-slate-400 mr-1">₹</span>
                        <span className="text-lg sm:text-xl font-extrabold text-slate-950 tracking-tight font-feature-settings-['tnum']">
                          <AnimatedNumber value={crashMetrics.net} />
                        </span>
                      </div>
                    </div>

                    {/* Two-Column Split (Collected vs Pending) */}
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-lg p-2 space-y-0.5">
                        <div className="flex items-center justify-between text-[8.5px]">
                          <span className="font-bold text-emerald-800 uppercase tracking-wider">Collected</span>
                          <span className="font-bold text-emerald-700 font-mono">{crashMetrics.collectionRate}%</span>
                        </div>
                        <div className="text-xs sm:text-[13px] font-bold text-emerald-950 font-feature-settings-['tnum'] truncate">
                          ₹ <AnimatedNumber value={crashMetrics.collected} />
                        </div>
                      </div>
                      <div className="bg-slate-50/90 border border-slate-200/70 rounded-lg p-2 space-y-0.5">
                        <div className="flex items-center justify-between text-[8.5px]">
                          <span className="font-bold text-slate-600 uppercase tracking-wider">Pending</span>
                          <span className="font-bold text-slate-500 font-mono">{crashMetrics.count > 0 ? 100 - crashMetrics.collectionRate : 0}%</span>
                        </div>
                        <div className="text-xs sm:text-[13px] font-bold text-slate-950 font-feature-settings-['tnum'] truncate">
                          ₹ <AnimatedNumber value={crashMetrics.pending} />
                        </div>
                      </div>
                    </div>

                    {/* Mini Progress Track */}
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, crashMetrics.collectionRate)}%` }}
                      />
                    </div>

                    {/* Footer Indicator */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1 font-mono text-[9px] text-slate-600">
                        <span className="px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200/60 font-semibold text-amber-800">
                          Crash Batches (1, 2, 3...)
                        </span>
                      </div>
                      <span className="text-slate-700 group-hover:text-slate-950 font-bold flex items-center gap-0.5 transition-colors">
                        Explore Batches
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TIER 4: DELIVERY FORMAT-WISE OR CRASH BATCH-WISE FINANCIAL BREAKDOWN */}
      {/* ========================================================================= */}
      {activeProgram && selectedClass && selectedStream && !selectedFormat && (
        <div className="space-y-7 animate-in fade-in duration-150">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
            <div className="space-y-1">
              <button
                onClick={() => {
                  setSelectedStream(null);
                  setSelectedFormat(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Course Streams
              </button>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {activeProgram} — Class {selectedClass} • {selectedStream}
              </h2>
              <p className="text-xs text-slate-500">
                {selectedStream} Total: ₹ {activeStreamMetrics.net.toLocaleString()} Net • ₹ {activeStreamMetrics.collected.toLocaleString()} Collected across {activeStreamMetrics.count} students
              </p>
            </div>

            <button
              onClick={() => setSelectedFormat("All")}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              View Combined {selectedStream} Ledger ({activeStreamMetrics.count})
            </button>
          </div>

          {/* Section Heading */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isCrash ? "Select Crash Course Batch" : isStateBoard ? "Select State Batch Cohort" : "Select Delivery Format (Regular)"}
            </h3>

            {/* Delivery Format / Batch Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {formatOptions.map((fmt) => {
                const fLedgers = streamLedgers.filter((l) => isLedgerInFormat(l, fmt.id));
                const metrics = calcMetrics(fLedgers);

                // Distinct avatar icon based on format
                const getFormatAvatar = () => {
                  if (isCrash) {
                    return {
                      icon: <Sparkles className="w-4 h-4 text-white" />,
                      bg: "bg-gradient-to-br from-amber-500 to-orange-600 shadow-xs shadow-amber-500/20"
                    };
                  }
                  if (fmt.id.includes("1:1")) {
                    return {
                      icon: <User className="w-4 h-4 text-white" />,
                      bg: "bg-gradient-to-br from-violet-600 to-purple-600 shadow-xs shadow-violet-500/20"
                    };
                  }
                  if (fmt.id.includes("1:3")) {
                    return {
                      icon: <Users className="w-4 h-4 text-white" />,
                      bg: "bg-gradient-to-br from-indigo-600 to-sky-600 shadow-xs shadow-indigo-500/20"
                    };
                  }
                  return {
                    icon: <School className="w-4 h-4 text-white" />,
                    bg: "bg-gradient-to-br from-emerald-600 to-teal-600 shadow-xs shadow-emerald-500/20"
                  };
                };

                const avatar = getFormatAvatar();

                return (
                  <div
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt.id)}
                    className="relative bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl p-3.5 space-y-2.5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${avatar.bg}`}>
                          {avatar.icon}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs sm:text-[13px] text-slate-900 group-hover:text-slate-950 transition-colors truncate">
                            {fmt.label}
                          </h3>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                            {fmt.id}
                          </span>
                        </div>
                      </div>

                      <div className="w-6.5 h-6.5 rounded-full bg-slate-50 border border-slate-200/70 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 text-slate-400 flex items-center justify-center transition-all duration-200 shadow-2xs shrink-0">
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {fmt.desc}
                    </p>

                    {/* Net Fees Hero Amount */}
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                        Total Net Fees
                      </span>
                      <div className="flex items-baseline">
                        <span className="text-xs font-semibold text-slate-400 mr-1">₹</span>
                        <span className="text-lg sm:text-xl font-extrabold text-slate-950 tracking-tight font-feature-settings-['tnum']">
                          <AnimatedNumber value={metrics.net} />
                        </span>
                      </div>
                    </div>

                    {/* Two-Column Split (Collected vs Pending) */}
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <div className="bg-emerald-50/70 border border-emerald-100/90 rounded-lg p-1.5 space-y-0.5">
                        <div className="flex items-center justify-between text-[8.5px]">
                          <span className="font-bold text-emerald-800 uppercase tracking-wider">Collected</span>
                          <span className="font-bold text-emerald-700 font-mono">{metrics.collectionRate}%</span>
                        </div>
                        <div className="text-xs sm:text-[13px] font-bold text-emerald-950 font-feature-settings-['tnum'] truncate">
                          ₹ <AnimatedNumber value={metrics.collected} />
                        </div>
                      </div>
                      <div className="bg-slate-50/90 border border-slate-200/70 rounded-lg p-1.5 space-y-0.5">
                        <div className="flex items-center justify-between text-[8.5px]">
                          <span className="font-bold text-slate-600 uppercase tracking-wider">Pending</span>
                          <span className="font-bold text-slate-500 font-mono">{metrics.count > 0 ? 100 - metrics.collectionRate : 0}%</span>
                        </div>
                        <div className="text-xs sm:text-[13px] font-bold text-slate-900 font-feature-settings-['tnum'] truncate">
                          ₹ <AnimatedNumber value={metrics.pending} />
                        </div>
                      </div>
                    </div>

                    {/* Mini Progress Track */}
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, metrics.collectionRate)}%` }}
                      />
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/60 font-mono">
                        {metrics.count} student{metrics.count === 1 ? "" : "s"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-700 group-hover:text-slate-950 flex items-center gap-0.5 transition-colors">
                        Open Roster
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Action Banner */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <span className="text-xs font-medium text-slate-600">
              Need to see all students in Class {selectedClass} ({selectedStream}) regardless of format or batch?
            </span>
            <button
              onClick={() => setSelectedFormat("All")}
              className="text-xs font-bold text-slate-900 hover:text-black cursor-pointer underline underline-offset-2 self-start sm:self-auto"
            >
              Open Combined Class {selectedClass} {selectedStream} Ledger ({activeStreamMetrics.count} students) →
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TIER 5: STUDENT FEE LEDGER ROSTER */}
      {/* ========================================================================= */}
      {activeProgram && selectedClass && selectedStream && selectedFormat && (
        <div className="space-y-7 animate-in fade-in duration-150">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
            <div className="space-y-1">
              <button
                onClick={() => setSelectedFormat(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to {isCrash ? "Crash Batches" : "Delivery Formats"}
              </button>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {activeProgram} — Class {selectedClass} • {selectedStream} ({selectedFormat === "All" ? `All ${selectedStream} Formats` : selectedFormat})
              </h2>
              <p className="text-xs text-slate-500">
                Total Net: ₹ {activeCohortMetrics.net.toLocaleString()} • Collected: ₹ {activeCohortMetrics.collected.toLocaleString()} • Pending: ₹ {activeCohortMetrics.pending.toLocaleString()} across {rosterLedgers.length} students
              </p>
            </div>

            <button
              onClick={exportToCSV}
              disabled={rosterLedgers.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors self-start sm:self-auto cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export Roster CSV
            </button>
          </div>

          {/* Student Ledgers Table Container */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            {/* Table Header Filter Bar */}
            <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Fee Ledgers
                </span>
                <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md border border-slate-200/60">
                  {rosterLedgers.length}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter student or batch..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200/80 rounded-lg focus:outline-slate-900"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200/80 rounded-lg text-slate-700 focus:outline-slate-900 font-medium"
                >
                  <option value="All">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Partly Paid">Partly Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>

            {rosterLedgers.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <GraduationCap className="w-9 h-9 text-slate-300 mx-auto" />
                <div className="text-sm font-semibold text-slate-800">
                  No fee ledgers found in {selectedFormat === "All" ? `Class ${selectedClass} (${selectedStream})` : selectedFormat}
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Admit your first student into {activeProgram} Class {selectedClass} ({selectedStream} • {selectedFormat}).
                </p>
                <Link
                  href={`/students/new?program=${encodeURIComponent(activeProgram)}&class=${selectedClass}&stream=${encodeURIComponent(selectedStream || 'Regular')}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Admit Student
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 text-slate-600 font-semibold border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4">Student & ID</th>
                      <th className="py-3 px-4">Format / Batch</th>
                      <th className="py-3 px-4 text-right">Gross Fee</th>
                      <th className="py-3 px-4 text-right">Discount</th>
                      <th className="py-3 px-4 text-right">Net Payable</th>
                      <th className="py-3 px-4 text-right">Collected</th>
                      <th className="py-3 px-4 text-right">Pending</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rosterLedgers.map((l) => (
                      <tr
                        key={l.name}
                        onClick={() => window.location.href = `/students/${l.student}`}
                        className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 hover:underline">
                            {l.student_name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">{l.student}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                            {l.delivery_mode || l.batch_name || selectedFormat}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          ₹ {Number(l.gross_fee || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500">
                          {Number(l.discount_amount || 0) > 0 ? `₹ ${Number(l.discount_amount).toLocaleString()}` : "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">
                          ₹ {Number(l.net_payable || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                          ₹ {Number(l.total_collected || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">
                          {Number(l.pending_balance || 0) === 0 ? (
                            <span className="text-emerald-600 font-bold">—</span>
                          ) : (
                            `₹ ${Number(l.pending_balance || 0).toLocaleString()}`
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              l.fee_status === "Paid"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : l.fee_status === "Partly Paid"
                                ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                : l.fee_status === "Overdue"
                                ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                                : "bg-amber-50 text-amber-700 border border-amber-200/60"
                            }`}
                          >
                            {l.fee_status || "Pending"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/students/${l.student}`}
                            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-950 font-semibold text-xs"
                          >
                            Ledger & Invoices
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

export default function FeesPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto py-16 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Loading fees & collections ledger...</p>
      </div>
    }>
      <FeesPageContent />
    </Suspense>
  );
}
