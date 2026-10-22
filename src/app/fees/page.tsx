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

interface FeeSummary {
  totalGross: number;
  totalDiscount: number;
  totalNet: number;
  totalCollected: number;
  totalPending: number;
  totalDueTillDate: number;
  overdueCount: number;
  studentCount: number;
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
  // Tier 3: selectedFormat (null => Formats view under selectedClass; when set => Student Ledger Table)
  const [activeProgram, setActiveProgram] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
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

  // Format options depending on program type
  const isStateBoard = activeProgram === "State Board";
  const formatOptions = useMemo(() => {
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
  }, [isStateBoard]);

  // Helper to match ledger against format
  const isLedgerInFormat = (l: FeeLedger, formatId: string) => {
    if (isStateBoard) {
      return l.batch_name?.includes(formatId) || (!l.batch_name && formatId === "Batch A");
    }
    return (
      l.delivery_mode?.toLowerCase().includes(formatId.toLowerCase()) ||
      (formatId === "1:1 Tutoring" && (l.delivery_mode?.includes("1:1") || !l.delivery_mode))
    );
  };

  // Filtered ledgers for Tier 4 Table Roster
  const rosterLedgers = useMemo(() => {
    let list = classLedgers;
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
  }, [classLedgers, selectedFormat, search, statusFilter]);

  // Export Roster to CSV
  const exportToCSV = () => {
    if (rosterLedgers.length === 0) return;
    const headers = [
      "Student ID",
      "Student Name",
      "Program",
      "Class Level",
      "Delivery Mode",
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
      `"${l.delivery_mode || ''}"`,
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
    link.setAttribute("download", `SmartUp_Fee_Ledger_${activeProgram || 'All'}_Class_${selectedClass || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Program metrics for Tier 2 Header
  const activeProgramMetrics = useMemo(() => calcMetrics(programLedgers), [programLedgers]);
  const activeClassMetrics = useMemo(() => calcMetrics(classLedgers), [classLedgers]);
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
                  setSelectedFormat(null);
                  setSearch("");
                }}
                className={`hover:text-slate-900 transition-colors cursor-pointer ${
                  !selectedFormat ? "text-slate-900 font-semibold" : "text-slate-500"
                }`}
              >
                Class {selectedClass}
              </button>
            </>
          )}

          {selectedFormat && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span className="text-slate-900 font-semibold px-2 py-0.5 rounded bg-slate-100 border border-slate-200/80">
                {selectedFormat === "All" ? "Combined Class Ledger" : selectedFormat}
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
        <div className="space-y-7 animate-in fade-in duration-150">
          
          {/* Top Aggregate KPI Strip (Interactive Executive Control Bar) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Net Fees */}
            <div 
              onClick={() => setActiveMetric(activeMetric === "net_fees" ? "all" : "net_fees")}
              className={`relative bg-white rounded-2xl p-5 space-y-2.5 transition-all duration-200 cursor-pointer group border overflow-hidden ${
                activeMetric === "net_fees" 
                  ? "border-violet-500/60 ring-4 ring-violet-500/10 shadow-lg shadow-violet-500/5 bg-gradient-to-b from-white via-white to-violet-50/25 before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-violet-500 before:to-indigo-600" 
                  : "border-slate-200/80 hover:border-slate-300 hover:shadow-md shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Net Revenue</span>
                  {activeMetric === "net_fees" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
                  )}
                </div>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  activeMetric === "net_fees" 
                    ? "bg-violet-600 text-white shadow-md shadow-violet-500/20" 
                    : "bg-violet-50 text-violet-600 group-hover:scale-105"
                }`}>
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline">
                <span className="text-lg font-semibold text-slate-400 mr-1.5">₹</span>
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 font-feature-settings-['tnum']">
                  {loading ? "—" : (summary?.totalNet || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-0.5 text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  Across {summary?.studentCount || 0} active agreements
                </span>
                <span className={`text-[10px] font-bold ${activeMetric === "net_fees" ? "text-violet-600" : "text-slate-400 group-hover:text-slate-700"}`}>
                  {activeMetric === "net_fees" ? "Active" : "Filter"}
                </span>
              </div>
            </div>

            {/* KPI 2: Total Collected */}
            <div 
              onClick={() => setActiveMetric(activeMetric === "collected" ? "all" : "collected")}
              className={`relative bg-white rounded-2xl p-5 space-y-2.5 transition-all duration-200 cursor-pointer group border overflow-hidden ${
                activeMetric === "collected" 
                  ? "border-emerald-500/60 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/5 bg-gradient-to-b from-white via-white to-emerald-50/25 before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-emerald-500 before:to-teal-500" 
                  : "border-slate-200/80 hover:border-slate-300 hover:shadow-md shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Collected</span>
                  {activeMetric === "collected" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  )}
                </div>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  activeMetric === "collected" 
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20" 
                    : "bg-emerald-50 text-emerald-600 group-hover:scale-105"
                }`}>
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline">
                <span className="text-lg font-semibold text-emerald-600/70 mr-1.5">₹</span>
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 font-feature-settings-['tnum']">
                  {loading ? "—" : (summary?.totalCollected || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-0.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-mono">
                    {summary?.totalNet ? Math.round(((summary.totalCollected || 0) / summary.totalNet) * 100) : 0}% Realized
                  </span>
                  <span className="text-slate-400 font-medium">In GL</span>
                </div>
                <span className={`text-[10px] font-bold ${activeMetric === "collected" ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-700"}`}>
                  {activeMetric === "collected" ? "Active" : "Filter"}
                </span>
              </div>
            </div>

            {/* KPI 3: Pending Balance */}
            <div 
              onClick={() => setActiveMetric(activeMetric === "pending" ? "all" : "pending")}
              className={`relative bg-white rounded-2xl p-5 space-y-2.5 transition-all duration-200 cursor-pointer group border overflow-hidden ${
                activeMetric === "pending" 
                  ? "border-amber-500/60 ring-4 ring-amber-500/10 shadow-lg shadow-amber-500/5 bg-gradient-to-b from-white via-white to-amber-50/25 before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-amber-400 before:to-orange-500" 
                  : "border-slate-200/80 hover:border-slate-300 hover:shadow-md shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Balance</span>
                  {activeMetric === "pending" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                  )}
                </div>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  activeMetric === "pending" 
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" 
                    : "bg-amber-50 text-amber-600 group-hover:scale-105"
                }`}>
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline">
                <span className="text-lg font-semibold text-slate-400 mr-1.5">₹</span>
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 font-feature-settings-['tnum']">
                  {loading ? "—" : (summary?.totalPending || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-0.5 text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Remaining uncollected dues
                </span>
                <span className={`text-[10px] font-bold ${activeMetric === "pending" ? "text-amber-600" : "text-slate-400 group-hover:text-slate-700"}`}>
                  {activeMetric === "pending" ? "Active" : "Filter"}
                </span>
              </div>
            </div>

            {/* KPI 4: Due Till Date */}
            <div className="relative bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 space-y-2.5 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Due Till Date</span>
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline">
                <span className="text-lg font-semibold text-slate-400 mr-1.5">₹</span>
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 font-feature-settings-['tnum']">
                  {loading ? "—" : (summary?.totalDueTillDate || 0).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium pt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {summary?.overdueCount || 0} overdue accounts
              </p>
            </div>
          </div>

          {/* Program Cards Grid — Elevated Executive Grade */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950 tracking-tight">Program Financial Breakdown</h2>
                <p className="text-xs text-slate-500">Click a program to explore class-wise and format-wise fee ledgers</p>
              </div>
              <span className="text-xs text-slate-600 font-semibold bg-white border border-slate-200/80 px-3 py-1 rounded-xl shadow-2xs">
                {PROGRAMS.length} Operating Programs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {PROGRAMS.map((p) => {
                const pLedgers = ledgers.filter((l) => isLedgerInProgram(l, p));
                const metrics = calcMetrics(pLedgers);

                // Distinct theme styling per program
                const getProgramTheme = () => {
                  if (p.accent === "violet") {
                    return {
                      icon: <Sparkles className="w-3.5 h-3.5 text-white" />,
                      avatarBg: "bg-gradient-to-br from-violet-600 to-indigo-600 shadow-xs shadow-violet-500/25",
                      topBar: "before:bg-gradient-to-r before:from-violet-500 before:via-indigo-500 before:to-purple-600",
                      hoverBorder: "hover:border-violet-300",
                    };
                  }
                  if (p.accent === "teal") {
                    return {
                      icon: <Globe2 className="w-3.5 h-3.5 text-white" />,
                      avatarBg: "bg-gradient-to-br from-teal-500 to-emerald-600 shadow-xs shadow-teal-500/25",
                      topBar: "before:bg-gradient-to-r before:from-teal-500 before:via-emerald-500 before:to-cyan-600",
                      hoverBorder: "hover:border-teal-300",
                    };
                  }
                  if (p.accent === "amber") {
                    return {
                      icon: <BookOpen className="w-3.5 h-3.5 text-white" />,
                      avatarBg: "bg-gradient-to-br from-amber-500 to-orange-500 shadow-xs shadow-amber-500/25",
                      topBar: "before:bg-gradient-to-r before:from-amber-400 before:via-orange-500 before:to-amber-600",
                      hoverBorder: "hover:border-amber-300",
                    };
                  }
                  return {
                    icon: <School className="w-3.5 h-3.5 text-white" />,
                    avatarBg: "bg-gradient-to-br from-sky-500 to-blue-600 shadow-xs shadow-sky-500/25",
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
                    className={`relative bg-white border border-slate-200/80 ${theme.hoverBorder} rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-3 overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 ${theme.topBar}`}
                  >
                    {/* Header: Program Avatar, Title, Enrolled Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shrink-0 ${theme.avatarBg}`}>
                          {theme.icon}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-slate-900 group-hover:text-slate-950 tracking-tight truncate">
                            {p.title}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0">
                              {p.code}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium truncate">{p.subtitle}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 pt-0.5">
                        {metrics.count > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200/70 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {metrics.count} St.
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-200/50">
                            0
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Financial Amount: Clean Bold Typography */}
                    <div className="flex items-baseline justify-between pt-0.5">
                      <div className="flex items-baseline">
                        <span className="text-sm font-semibold text-slate-400 mr-1">₹</span>
                        <span className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight font-feature-settings-['tnum']">
                          {metrics.net.toLocaleString()}
                        </span>
                      </div>
                      {metrics.count > 0 && (
                        <span className="text-[10px] font-medium text-slate-400 font-mono">
                          ~₹{Math.round(metrics.net / metrics.count).toLocaleString()}/st
                        </span>
                      )}
                    </div>

                    {/* Two-Pillar Split: Collected vs Pending */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Collected Pillar */}
                      <div className="bg-emerald-50/70 hover:bg-emerald-50/90 border border-emerald-100/90 rounded-xl p-2 space-y-0.5 transition-colors">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Collected
                          </span>
                          <span className="font-extrabold text-emerald-800 font-mono">
                            {metrics.collectionRate}%
                          </span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-[11px] font-semibold text-emerald-600/70 mr-0.5">₹</span>
                          <span className="text-sm font-extrabold text-emerald-950 tracking-tight font-feature-settings-['tnum'] truncate">
                            {metrics.collected.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Pending Pillar */}
                      <div className="bg-slate-50/90 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl p-2 space-y-0.5 transition-colors">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Pending
                          </span>
                          <span className="font-extrabold text-slate-700 font-mono">
                            {metrics.count > 0 ? 100 - metrics.collectionRate : 0}%
                          </span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-[11px] font-semibold text-slate-400 mr-0.5">₹</span>
                          <span className="text-sm font-extrabold text-slate-950 tracking-tight font-feature-settings-['tnum'] truncate">
                            {metrics.pending.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Realization Gauge */}
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500 shadow-xs shadow-emerald-500/20"
                          style={{ width: `${Math.min(100, metrics.collectionRate)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium">
                        <span className="text-emerald-700 font-semibold">{metrics.collectionRate}% Realization</span>
                        <span className="truncate">₹ {metrics.pending.toLocaleString()} remaining</span>
                      </div>
                    </div>

                    {/* Card Footer: Delivery Chips & Link */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 font-mono text-[9px]">
                        {metrics.count > 0 ? (
                          <>
                            <span className="px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                              1:1: {pLedgers.filter(l => l.delivery_mode?.includes("1:1")).length}
                            </span>
                            <span className="px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                              1:3: {pLedgers.filter(l => l.delivery_mode?.includes("1:3")).length}
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400 italic text-[9px]">No batches</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-slate-600 group-hover:text-slate-950 font-semibold text-[11px] transition-colors">
                        <span>Explore</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Program Net Fees</span>
              <div className="flex items-baseline">
                <span className="text-lg font-semibold text-slate-400 mr-1.5">₹</span>
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 font-feature-settings-['tnum']">
                  {activeProgramMetrics.net.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-400">Total contractual commitment</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Deposited</span>
              <div className="flex items-baseline">
                <span className="text-lg font-semibold text-emerald-600/70 mr-1.5">₹</span>
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 font-feature-settings-['tnum']">
                  {activeProgramMetrics.collected.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-emerald-700 font-semibold">{activeProgramMetrics.collectionRate}% realization rate</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Outstanding Pending</span>
              <div className="flex items-baseline">
                <span className="text-lg font-semibold text-slate-400 mr-1.5">₹</span>
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 font-feature-settings-['tnum']">
                  {activeProgramMetrics.pending.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-400">Due across {activeProgramMetrics.count} active ledgers</p>
            </div>
          </div>

          {/* Class Cards Grid — Elevated Design */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Class Level
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {CLASS_LEVELS.map((cls) => {
                const cLedgers = programLedgers.filter((l) => l.class_level?.includes(cls));
                const metrics = calcMetrics(cLedgers);

                return (
                  <div
                    key={cls}
                    onClick={() => {
                      setSelectedClass(cls);
                      setSelectedFormat(null);
                    }}
                    className="relative bg-white border border-slate-200/80 hover:border-violet-300 rounded-3xl p-5 space-y-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-11 h-11 rounded-2xl font-bold font-mono text-sm bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
                          {cls}
                        </span>
                        <div>
                          <h4 className="text-base font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                            Class {cls}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {metrics.count} active student{metrics.count === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200/70 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 text-slate-400 flex items-center justify-center transition-all duration-200 shadow-2xs">
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                    {/* Net Fees Hero Amount */}
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Total Net Fees
                      </span>
                      <div className="flex items-baseline">
                        <span className="text-base font-semibold text-slate-400 mr-1">₹</span>
                        <span className="text-2xl font-extrabold text-slate-950 tracking-tight font-feature-settings-['tnum']">
                          {metrics.net.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Two-Column Split (Collected vs Pending) */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-xl p-2.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">Collected</span>
                          <span className="text-[10px] font-bold text-emerald-700 font-mono">{metrics.collectionRate}%</span>
                        </div>
                        <div className="text-sm font-extrabold text-emerald-900 font-feature-settings-['tnum']">
                          ₹ {metrics.collected.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-slate-50/90 border border-slate-200/70 rounded-xl p-2.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Pending</span>
                          <span className="text-[10px] font-bold text-slate-500 font-mono">{metrics.count > 0 ? 100 - metrics.collectionRate : 0}%</span>
                        </div>
                        <div className="text-sm font-extrabold text-slate-900 font-feature-settings-['tnum']">
                          ₹ {metrics.pending.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Mini Progress Track */}
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, metrics.collectionRate)}%` }}
                      />
                    </div>

                    {/* Formats & Action */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        <span className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                          1:1: {cLedgers.filter(l => l.delivery_mode?.includes("1:1")).length}
                        </span>
                        <span className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                          1:3: {cLedgers.filter(l => l.delivery_mode?.includes("1:3")).length}
                        </span>
                      </div>

                      <span className="text-slate-600 group-hover:text-slate-950 font-semibold flex items-center gap-1 transition-colors">
                        View Formats
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
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
      {/* TIER 3: DELIVERY FORMAT-WISE FINANCIAL BREAKDOWN */}
      {/* ========================================================================= */}
      {activeProgram && selectedClass && !selectedFormat && (
        <div className="space-y-7 animate-in fade-in duration-150">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
            <div className="space-y-1">
              <button
                onClick={() => {
                  setSelectedClass(null);
                  setSelectedFormat(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Classes
              </button>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {activeProgram} — Class {selectedClass} Delivery Formats
              </h2>
              <p className="text-xs text-slate-500">
                Class {selectedClass} Total: ₹ {activeClassMetrics.net.toLocaleString()} Net • ₹ {activeClassMetrics.collected.toLocaleString()} Collected across {activeClassMetrics.count} students
              </p>
            </div>

            <button
              onClick={() => setSelectedFormat("All")}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              View Combined Class Ledger ({activeClassMetrics.count})
            </button>
          </div>

          {/* Delivery Format Cards — Elevated Design */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {formatOptions.map((fmt) => {
              const fLedgers = classLedgers.filter((l) => isLedgerInFormat(l, fmt.id));
              const metrics = calcMetrics(fLedgers);

              // Distinct avatar icon based on format
              const getFormatAvatar = () => {
                if (fmt.id.includes("1:1")) {
                  return {
                    icon: <User className="w-5 h-5 text-white" />,
                    bg: "bg-gradient-to-br from-violet-600 to-purple-600 shadow-md shadow-violet-500/20"
                  };
                }
                if (fmt.id.includes("1:3")) {
                  return {
                    icon: <Users className="w-5 h-5 text-white" />,
                    bg: "bg-gradient-to-br from-indigo-600 to-sky-600 shadow-md shadow-indigo-500/20"
                  };
                }
                return {
                  icon: <School className="w-5 h-5 text-white" />,
                  bg: "bg-gradient-to-br from-emerald-600 to-teal-600 shadow-md shadow-emerald-500/20"
                };
              };

              const avatar = getFormatAvatar();

              return (
                <div
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className="relative bg-white border border-slate-200/80 hover:border-slate-300 rounded-3xl p-6 space-y-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${avatar.bg}`}>
                        {avatar.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 group-hover:text-slate-950 transition-colors">
                          {fmt.label}
                        </h3>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                          {fmt.id}
                        </span>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200/70 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 text-slate-400 flex items-center justify-center transition-all duration-200 shadow-2xs">
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    {fmt.desc}
                  </p>

                  {/* Net Fees Hero Amount */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Total Net Fees
                    </span>
                    <div className="flex items-baseline">
                      <span className="text-base font-semibold text-slate-400 mr-1">₹</span>
                      <span className="text-2xl font-extrabold text-slate-950 tracking-tight font-feature-settings-['tnum']">
                        {metrics.net.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Two-Column Split (Collected vs Pending) */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-emerald-50/70 border border-emerald-100/90 rounded-xl p-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">Collected</span>
                        <span className="text-[10px] font-bold text-emerald-700 font-mono">{metrics.collectionRate}%</span>
                      </div>
                      <div className="text-sm font-extrabold text-emerald-900 font-feature-settings-['tnum']">
                        ₹ {metrics.collected.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-slate-50/90 border border-slate-200/70 rounded-xl p-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Pending</span>
                        <span className="text-[10px] font-bold text-slate-500 font-mono">{metrics.count > 0 ? 100 - metrics.collectionRate : 0}%</span>
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 font-feature-settings-['tnum']">
                        ₹ {metrics.pending.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Mini Progress Track */}
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, metrics.collectionRate)}%` }}
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 font-mono">
                      {metrics.count} student{metrics.count === 1 ? "" : "s"}
                    </span>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-950 flex items-center gap-1 transition-colors">
                      Open Roster
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Action Banner */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <span className="text-xs font-medium text-slate-600">
              Need to see all students in Class {selectedClass} regardless of delivery mode?
            </span>
            <button
              onClick={() => setSelectedFormat("All")}
              className="text-xs font-bold text-slate-900 hover:text-black cursor-pointer underline underline-offset-2 self-start sm:self-auto"
            >
              Open Combined Class {selectedClass} Ledger ({activeClassMetrics.count} students) →
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TIER 4: STUDENT FEE LEDGER ROSTER */}
      {/* ========================================================================= */}
      {activeProgram && selectedClass && selectedFormat && (
        <div className="space-y-7 animate-in fade-in duration-150">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
            <div className="space-y-1">
              <button
                onClick={() => setSelectedFormat(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Format Cards
              </button>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {activeProgram} — Class {selectedClass} ({selectedFormat === "All" ? "All Formats" : selectedFormat})
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
                  No fee ledgers found in {selectedFormat === "All" ? `Class ${selectedClass}` : selectedFormat}
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Admit your first student into {activeProgram} Class {selectedClass} ({selectedFormat}).
                </p>
                <Link
                  href={`/students/new?program=${encodeURIComponent(activeProgram)}&class=${selectedClass}`}
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
