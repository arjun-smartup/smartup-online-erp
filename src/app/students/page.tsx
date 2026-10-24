"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  UserPlus, 
  Search, 
  GraduationCap, 
  Globe2, 
  RefreshCw, 
  ChevronRight, 
  ArrowLeft,
  Building2,
  Users,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  X,
  Sparkles,
  BookOpen,
  School,
  ArrowRight
} from "lucide-react";

interface StudentItem {
  name: string;
  student_name: string;
  guardian_name?: string;
  guardian_phone?: string;
  country?: string;
  billing_currency?: string;
  status: string;
  admission_date?: string;
  program?: string;
  class_level?: string;
  course_type?: string;
  delivery_mode?: string;
  batch_name?: string;
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

export default function StudentsDirectoryPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [rosterSearch, setRosterSearch] = useState("");

  // Multi-tier Drill-down state:
  // Tier 1: activeProgram (null => Programs view)
  // Tier 2: selectedClass (null => Classes view under activeProgram)
  // Tier 3: selectedStream (null => Course Streams view under selectedClass: Regular vs Crash Course)
  // Tier 4: selectedFormat (null => Formats / Batches view under selectedStream)
  // Tier 5: selectedFormat is set (when set => Students roster table)
  const [activeProgram, setActiveProgram] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<"Regular" | "Crash Course" | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/students/list");
      const json = await res.json();
      setStudents(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Helper to map student to program accurately
  const isStudentInProgram = (s: StudentItem, p: ProgramConfig) => {
    const studentProg = s.program;
    return (
      studentProg === p.id ||
      studentProg === p.frappeId ||
      (p.id === "State Board" && (studentProg === "State" || studentProg === "6ou3e6qktl")) ||
      (p.id === "CBSE GCC Online" && (studentProg === "CBSE GCC" || studentProg === "7oui15udm7" || studentProg === "GCC Online")) ||
      (p.id === "CBSE Kerala" && (studentProg === "CBSE Kerala" || studentProg === "foue41ggaf" || studentProg === "CBSE Online"))
    );
  };

  // Helpers to distinguish Regular vs Crash Course
  const isStudentCrash = (s: StudentItem) => {
    return (
      s.course_type === "Crash Course" ||
      s.delivery_mode === "Crash Course" ||
      Boolean(s.batch_name && s.batch_name.toLowerCase().includes("crash"))
    );
  };

  const isStudentRegular = (s: StudentItem) => !isStudentCrash(s);

  // Compute live actual metrics
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === "Active" || !s.status).length;
  const discontinued = totalStudents - activeStudents;
  const activePercent = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 100;

  // Filter students for active program
  const currentProgramObj = useMemo(() => {
    return PROGRAMS.find((p) => p.id === activeProgram) || null;
  }, [activeProgram]);

  const programStudents = useMemo(() => {
    if (!currentProgramObj) return students;
    return students.filter((s) => isStudentInProgram(s, currentProgramObj));
  }, [students, currentProgramObj]);

  // Filter students for selected class
  const classStudents = useMemo(() => {
    if (!selectedClass) return programStudents;
    return programStudents.filter((s) => s.class_level?.includes(selectedClass));
  }, [programStudents, selectedClass]);

  // Filter students for selected stream (Regular vs Crash Course)
  const streamStudents = useMemo(() => {
    if (!selectedStream) return classStudents;
    if (selectedStream === "Crash Course") {
      return classStudents.filter(isStudentCrash);
    }
    return classStudents.filter(isStudentRegular);
  }, [classStudents, selectedStream]);

  // Format list depending on program type and selected stream
  const isStateBoard = activeProgram === "State Board";
  const isCrash = selectedStream === "Crash Course";

  const formatOptions = useMemo(() => {
    if (isCrash) {
      const defaultBatches = ["Crash Batch 1", "Crash Batch 2", "Crash Batch 3"];
      const customBatches: string[] = [];
      for (const s of streamStudents) {
        if (s.batch_name && !defaultBatches.includes(s.batch_name) && s.batch_name.toLowerCase().includes("crash")) {
          if (!customBatches.includes(s.batch_name)) {
            customBatches.push(s.batch_name);
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
  }, [isCrash, isStateBoard, streamStudents]);

  // Helper to match student against format or batch
  const isStudentInFormat = (s: StudentItem, formatId: string) => {
    if (isCrash) {
      return s.batch_name === formatId || (!s.batch_name && formatId === "Crash Batch 1");
    }
    if (isStateBoard) {
      return s.batch_name?.includes(formatId) || (!s.batch_name && formatId === "Batch A");
    }
    return s.delivery_mode?.toLowerCase().includes(formatId.toLowerCase()) || 
           (formatId === "1:1 Tutoring" && (s.delivery_mode?.includes("1:1") || !s.delivery_mode));
  };

  // Students for the final table roster
  const rosterStudents = useMemo(() => {
    let list = streamStudents;
    if (selectedFormat && selectedFormat !== "All") {
      list = list.filter((s) => isStudentInFormat(s, selectedFormat));
    }
    if (rosterSearch) {
      const q = rosterSearch.toLowerCase();
      list = list.filter((s) =>
        s.student_name?.toLowerCase().includes(q) ||
        s.guardian_name?.toLowerCase().includes(q) ||
        s.guardian_phone?.includes(q) ||
        s.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [streamStudents, selectedFormat, rosterSearch, isCrash, isStateBoard]);

  // Filter program cards by search query
  const filteredPrograms = useMemo(() => {
    if (!search.trim()) return PROGRAMS;
    const q = search.toLowerCase();
    return PROGRAMS.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      
      {/* Sleek Minimal Breadcrumbs & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium flex-wrap">
          <Link href="/" className="hover:text-slate-900 transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          
          <button
            onClick={() => {
              setActiveProgram(null);
              setSelectedClass(null);
              setSelectedStream(null);
              setSelectedFormat(null);
              setRosterSearch("");
            }}
            className={`hover:text-slate-900 transition-colors cursor-pointer ${
              !activeProgram ? "text-slate-900 font-semibold" : "text-slate-500"
            }`}
          >
            Students
          </button>

          {activeProgram && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <button
                onClick={() => {
                  setSelectedClass(null);
                  setSelectedStream(null);
                  setSelectedFormat(null);
                  setRosterSearch("");
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
                  setRosterSearch("");
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
                  setRosterSearch("");
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
                {selectedFormat === "All" ? `All ${selectedStream} Students` : selectedFormat}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadStudents}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href={`/students/new${activeProgram ? `?program=${encodeURIComponent(activeProgram)}` : ""}${selectedClass ? `&class=${selectedClass}` : ""}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Admit Student
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIER 1: PROGRAMS OVERVIEW */}
      {/* ========================================================================= */}
      {!activeProgram && (
        <div className="space-y-7 animate-in fade-in duration-150">
          
          {/* Top KPI Metric Strip (4 Executive Control Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Total Enrolled */}
            <div className="relative bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 space-y-2.5 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Enrolled</span>
                <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 font-feature-settings-['tnum']">
                  {loading ? "—" : totalStudents}
                </span>
                <span className="text-xs text-slate-400 font-medium ml-1.5">students</span>
              </div>
              <div className="flex items-center justify-between pt-0.5 text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {activeStudents} active agreements
                </span>
                <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-mono">
                  {activePercent}%
                </span>
              </div>
            </div>

            {/* KPI 2: 1:1 Tutoring */}
            <div className="relative bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 space-y-2.5 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">1:1 Mentorship</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 font-feature-settings-['tnum']">
                  {loading ? "—" : students.filter((s) => s.delivery_mode?.includes("1:1")).length}
                </span>
                <span className="text-xs text-slate-400 font-medium ml-1.5">students</span>
              </div>
              <div className="flex items-center justify-between pt-0.5 text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Personalized 1-on-1 tutoring
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {totalStudents > 0 ? Math.round((students.filter((s) => s.delivery_mode?.includes("1:1")).length / totalStudents) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* KPI 3: 1:3 Triads */}
            <div className="relative bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 space-y-2.5 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">1:3 Group Triads</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 font-feature-settings-['tnum']">
                  {loading ? "—" : students.filter((s) => s.delivery_mode?.includes("1:3")).length}
                </span>
                <span className="text-xs text-slate-400 font-medium ml-1.5">students</span>
              </div>
              <div className="flex items-center justify-between pt-0.5 text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Micro-group cohorts
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {totalStudents > 0 ? Math.round((students.filter((s) => s.delivery_mode?.includes("1:3")).length / totalStudents) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* KPI 4: Academic Programs */}
            <div className="relative bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 space-y-2.5 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Operating Programs</span>
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <Globe2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 font-feature-settings-['tnum']">
                  {PROGRAMS.length}
                </span>
                <span className="text-xs text-slate-400 font-medium ml-1.5">divisions</span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium pt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                Across 5 class grades (8th–12th)
              </p>
            </div>
          </div>

          {/* Program Cards Grid — Compact 4-Column Layout */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950 tracking-tight">Academic Divisions</h2>
                <p className="text-xs text-slate-500">Select a program to drill down by class level and batches</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter programs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200/80 rounded-xl focus:outline-slate-900 shadow-2xs"
                  />
                </div>
                <span className="text-xs text-slate-600 font-semibold bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-2xs shrink-0">
                  {filteredPrograms.length} Programs
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {filteredPrograms.map((p) => {
                const progStudents = students.filter((s) => isStudentInProgram(s, p));
                const count = progStudents.length;
                const pOneToOne = progStudents.filter((s) => s.delivery_mode?.includes("1:1")).length;
                const pTriad = progStudents.filter((s) => s.delivery_mode?.includes("1:3")).length;
                const oneToOnePct = count > 0 ? Math.round((pOneToOne / count) * 100) : 0;
                const triadPct = count > 0 ? Math.round((pTriad / count) * 100) : 0;
                const campusShare = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;

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
                        {count > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200/70 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {count} St.
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-200/50">
                            0
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Enrolled Students Hero Count */}
                    <div className="flex items-baseline justify-between pt-0.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight font-feature-settings-['tnum']">
                          {count}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">active students</span>
                      </div>
                      {count > 0 && (
                        <span className="text-[10px] font-medium text-slate-400 font-mono">
                          {campusShare}% of campus
                        </span>
                      )}
                    </div>

                    {/* Two-Pillar Split: 1:1 Mode vs 1:3 Triads */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* 1:1 Pillar */}
                      <div className="bg-emerald-50/70 hover:bg-emerald-50/90 border border-emerald-100/90 rounded-xl p-2 space-y-0.5 transition-colors">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            1:1 Mode
                          </span>
                          <span className="font-extrabold text-emerald-800 font-mono">
                            {oneToOnePct}%
                          </span>
                        </div>
                        <div className="text-sm font-extrabold text-emerald-950 tracking-tight font-feature-settings-['tnum'] truncate">
                          {pOneToOne} <span className="text-[10px] font-normal text-emerald-800/80">students</span>
                        </div>
                      </div>

                      {/* 1:3 Pillar */}
                      <div className="bg-slate-50/90 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl p-2 space-y-0.5 transition-colors">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            1:3 Triad
                          </span>
                          <span className="font-extrabold text-slate-700 font-mono">
                            {triadPct}%
                          </span>
                        </div>
                        <div className="text-sm font-extrabold text-slate-950 tracking-tight font-feature-settings-['tnum'] truncate">
                          {pTriad} <span className="text-[10px] font-normal text-slate-500">students</span>
                        </div>
                      </div>
                    </div>

                    {/* Distribution Track */}
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500 shadow-xs shadow-emerald-500/20"
                          style={{ width: `${oneToOnePct}%` }}
                        />
                        <div 
                          className="bg-indigo-500 h-full transition-all duration-500 shadow-xs shadow-indigo-500/20"
                          style={{ width: `${triadPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium">
                        <span className="text-emerald-700 font-semibold">{oneToOnePct}% 1:1 Mentorship</span>
                        <span>{triadPct}% 1:3 Triad</span>
                      </div>
                    </div>

                    {/* Card Footer: Delivery Chips & Link */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 font-mono text-[9px]">
                        {count > 0 ? (
                          <>
                            <span className="px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                              5 Classes
                            </span>
                            <span className="px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                              Active
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
      {/* TIER 2: CLASSES VIEW (When activeProgram is selected, but selectedClass is null) */}
      {/* ========================================================================= */}
      {activeProgram && !selectedClass && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
            <div className="space-y-1">
              <button
                onClick={() => {
                  setActiveProgram(null);
                  setSelectedClass(null);
                  setSelectedFormat(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to All Programs
              </button>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {activeProgram} — Select Class Level
              </h2>
              <p className="text-xs text-slate-500">
                {programStudents.length} enrolled student{programStudents.length === 1 ? "" : "s"}. Select a class below to explore formats and rosters.
              </p>
            </div>

            <Link
              href={`/students/new?program=${encodeURIComponent(activeProgram)}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Admit Student to {activeProgram}
            </Link>
          </div>

          {/* Sleek Executive Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Enrolled</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 font-feature-settings-['tnum']">
                  {programStudents.length}
                </span>
                <span className="text-xs text-slate-400 font-normal">in {activeProgram}</span>
              </div>
              <p className="text-xs text-emerald-600 font-semibold">
                {programStudents.length} Active Records
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Class Grades</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 font-feature-settings-['tnum']">
                  {CLASS_LEVELS.length}
                </span>
                <span className="text-xs text-slate-400 font-normal">levels available</span>
              </div>
              <p className="text-xs text-slate-400">
                Grade 8th through Grade +2 (12th)
              </p>
            </div>
          </div>

          {/* Clean Elevated Class Cards Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Class Level
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CLASS_LEVELS.map((cls) => {
                const cStudents = programStudents.filter((s) => s.class_level?.includes(cls));
                const count = cStudents.length;
                const cOneToOne = cStudents.filter((s) => s.delivery_mode?.includes("1:1")).length;
                const cTriad = cStudents.filter((s) => s.delivery_mode?.includes("1:3")).length;

                return (
                  <div
                    key={cls}
                    onClick={() => {
                      setSelectedClass(cls);
                      setSelectedStream(null);
                      setSelectedFormat(null);
                    }}
                    className="relative bg-white border border-slate-200/80 hover:border-violet-300 rounded-2xl p-4 space-y-3.5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl font-bold font-mono text-sm bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shadow-violet-500/20 shrink-0">
                          {cls}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                            Class {cls}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {count} active student{count === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>

                      <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/70 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 text-slate-400 flex items-center justify-center transition-all duration-200 shadow-2xs shrink-0">
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-xl p-2 space-y-0.5">
                        <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider block">Regular</span>
                        <div className="text-xs sm:text-sm font-extrabold text-emerald-950 font-feature-settings-['tnum']">
                          {cStudents.filter(isStudentRegular).length} students
                        </div>
                      </div>
                      <div className="bg-amber-50/90 border border-amber-200/70 rounded-xl p-2 space-y-0.5">
                        <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider block">Crash Course</span>
                        <div className="text-xs sm:text-sm font-extrabold text-amber-950 font-feature-settings-['tnum']">
                          {cStudents.filter(isStudentCrash).length} students
                        </div>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px] font-medium">Academic Streams</span>
                      <span className="text-slate-600 group-hover:text-slate-950 font-semibold flex items-center gap-1 transition-colors text-xs">
                        View Streams
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
      {/* TIER 3: COURSE STREAM CARDS (When activeProgram & selectedClass are chosen, but selectedStream is null) */}
      {/* ========================================================================= */}
      {activeProgram && selectedClass && !selectedStream && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
            <div className="space-y-1">
              <button
                onClick={() => {
                  setSelectedClass(null);
                  setSelectedStream(null);
                  setSelectedFormat(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Classes
              </button>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {activeProgram} — Class {selectedClass} Academic Streams
              </h2>
              <p className="text-xs text-slate-500">
                {classStudents.length} enrolled student{classStudents.length === 1 ? "" : "s"} in Class {selectedClass}. Select a course stream below.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedStream("Regular");
                setSelectedFormat("All");
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
            >
              Combined Class {selectedClass} Roster ({classStudents.length})
            </button>
          </div>

          {/* Stream Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stream 1: Regular Course */}
            {(() => {
              const regCount = classStudents.filter(isStudentRegular).length;
              return (
                <div
                  onClick={() => {
                    setSelectedStream("Regular");
                    setSelectedFormat(null);
                  }}
                  className="group bg-white border border-slate-200/80 hover:border-violet-300 rounded-2xl p-5 space-y-3.5 transition-all duration-200 hover:shadow-md shadow-xs cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900 group-hover:text-slate-950 transition-colors">
                            Regular Course
                          </h3>
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200/60">
                            Full Year
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Comprehensive curriculum with 1:1, 1:3 group, and micro batch tracks.
                        </p>
                      </div>
                    </div>

                    <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/70 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 text-slate-400 flex items-center justify-center transition-all duration-200 shadow-2xs shrink-0">
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-slate-950 tracking-tight font-feature-settings-['tnum']">{regCount}</span>
                      <span className="text-xs text-slate-500 font-medium">student{regCount === 1 ? "" : "s"}</span>
                    </div>

                    <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-950 flex items-center gap-1 transition-colors">
                      <span>Explore Formats</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Stream 2: Crash Course */}
            {(() => {
              const crashCount = classStudents.filter(isStudentCrash).length;
              return (
                <div
                  onClick={() => {
                    setSelectedStream("Crash Course");
                    setSelectedFormat(null);
                  }}
                  className="group bg-white border border-slate-200/80 hover:border-amber-300 rounded-2xl p-5 space-y-3.5 transition-all duration-200 hover:shadow-md shadow-xs cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900 group-hover:text-slate-950 transition-colors">
                            Crash Course
                          </h3>
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60">
                            Fast Track
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          High-intensity exam sprint batches and fast-track revision modules.
                        </p>
                      </div>
                    </div>

                    <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/70 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 text-slate-400 flex items-center justify-center transition-all duration-200 shadow-2xs shrink-0">
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-slate-950 tracking-tight font-feature-settings-['tnum']">{crashCount}</span>
                      <span className="text-xs text-slate-500 font-medium">student{crashCount === 1 ? "" : "s"}</span>
                    </div>

                    <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-950 flex items-center gap-1 transition-colors">
                      <span>Explore Batches</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TIER 4: DELIVERY FORMAT CARDS OR CRASH BATCHES (When stream is chosen, but selectedFormat is null) */}
      {/* ========================================================================= */}
      {activeProgram && selectedClass && selectedStream && !selectedFormat && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
            <div className="space-y-1">
              <button
                onClick={() => {
                  setSelectedStream(null);
                  setSelectedFormat(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Course Streams
              </button>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {activeProgram} — Class {selectedClass} • {selectedStream}
              </h2>
              <p className="text-xs text-slate-500">
                {streamStudents.length} enrolled student{streamStudents.length === 1 ? "" : "s"}. Click a {isCrash ? "crash batch" : "delivery format"} to open its roster.
              </p>
            </div>

            <Link
              href={`/students/new?program=${encodeURIComponent(activeProgram)}&class=${selectedClass}&stream=${encodeURIComponent(selectedStream)}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Admit Student to {selectedStream}
            </Link>
          </div>

          {/* Delivery Format or Crash Batch Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formatOptions.map((fmt) => {
              const count = streamStudents.filter((s) => isStudentInFormat(s, fmt.id)).length;

              return (
                <div
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className="group bg-white border border-slate-200/80 hover:border-violet-300 rounded-2xl p-4 space-y-3 transition-all duration-200 hover:shadow-md shadow-xs cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold text-slate-900 font-mono bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/60">
                      {fmt.id}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/70 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 text-slate-400 flex items-center justify-center transition-all duration-200 shadow-2xs">
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-slate-950 transition-colors">
                      {fmt.label}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {fmt.desc}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight font-feature-settings-['tnum']">{count}</span>
                      <span className="text-xs text-slate-500 font-medium">student{count === 1 ? "" : "s"}</span>
                    </div>

                    <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-950 flex items-center gap-1 transition-colors">
                      <span>View Roster</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Combined Stream Roster Quick Bar */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">
              View all {streamStudents.length} students enrolled in Class {selectedClass} ({selectedStream})
            </span>
            <button
              onClick={() => setSelectedFormat("All")}
              className="text-xs font-semibold text-slate-900 hover:text-black cursor-pointer underline underline-offset-2"
            >
              Combined {selectedStream} Roster →
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TIER 5: STUDENT ROSTER VIEW (When activeProgram, selectedClass, selectedStream & selectedFormat are chosen) */}
      {/* ========================================================================= */}
      {activeProgram && selectedClass && selectedStream && selectedFormat && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
            <div className="space-y-1">
              <button
                onClick={() => setSelectedFormat(null)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to {isCrash ? "Crash Batches" : "Delivery Formats"}
              </button>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {activeProgram} — Class {selectedClass} • {selectedStream} ({selectedFormat === "All" ? `All ${selectedStream} Formats` : selectedFormat})
              </h2>
              <p className="text-xs text-slate-500">
                {rosterStudents.length} student{rosterStudents.length === 1 ? "" : "s"} listed in this roster
              </p>
            </div>

            <Link
              href={`/students/new?program=${encodeURIComponent(activeProgram)}&class=${selectedClass}&stream=${encodeURIComponent(selectedStream)}&mode=${encodeURIComponent(selectedFormat === "All" ? (isCrash ? "Crash Course" : "1:1 Tutoring") : selectedFormat)}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Admit Student
            </Link>
          </div>

          {/* Student Records List Table */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Roster Table
                </span>
                <span className="text-[11px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200/60">
                  {rosterStudents.length}
                </span>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter name, guardian, phone..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200/80 rounded-lg focus:outline-slate-900"
                />
              </div>
            </div>

            {rosterStudents.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <GraduationCap className="w-9 h-9 text-slate-300 mx-auto" />
                <div className="text-sm font-semibold text-slate-800">
                  No students found in {selectedFormat === "All" ? `Class ${selectedClass}` : selectedFormat}
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Admit your first student into {activeProgram} Class {selectedClass} ({selectedFormat}).
                </p>
                <Link
                  href={`/students/new?program=${encodeURIComponent(activeProgram)}&class=${selectedClass}&mode=${encodeURIComponent(selectedFormat === "All" ? "1:1 Tutoring" : selectedFormat)}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs"
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
                      <th className="py-3 px-4">Student Name & ID</th>
                      <th className="py-3 px-4">Class Level</th>
                      <th className="py-3 px-4">Delivery Mode / Batch</th>
                      <th className="py-3 px-4">Guardian Contact</th>
                      <th className="py-3 px-4">Country</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rosterStudents.map((s) => (
                      <tr
                        key={s.name}
                        onClick={() => window.location.href = `/students/${s.name}`}
                        className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 hover:underline">
                            {s.student_name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">{s.name}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          Class {s.class_level || selectedClass}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                            {s.delivery_mode || s.batch_name || selectedFormat}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-800 font-medium">{s.guardian_name || "—"}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{s.guardian_phone || "—"}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-800 flex items-center gap-1 font-medium">
                            <Globe2 className="w-3.5 h-3.5 text-slate-400" />
                            {s.country || "India"}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            {s.status || "Active"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/students/${s.name}`}
                            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-950 font-semibold text-xs"
                          >
                            Profile & Ledger
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
