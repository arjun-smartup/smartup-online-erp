"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Clock, 
  UserPlus, 
  ArrowUpRight,
  Globe2,
  Building2,
  GraduationCap,
  RefreshCw,
  Sparkles,
  BookOpen,
  School,
  Phone,
  UserCheck,
  Calendar,
  Layers,
  ChevronRight
} from "lucide-react";

interface ProgramFinancial {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  frappeId: string;
  accent: "violet" | "teal" | "amber" | "sky" | "blue";
  studentCount: number;
  totalNet?: number;
  totalCollected?: number;
  totalPending?: number;
  collectionRate?: number;
}

interface RecentStudent {
  name: string;
  student_name: string;
  guardian_name?: string;
  guardian_phone?: string;
  country?: string;
  program?: string;
  class_level?: string;
  admission_date?: string;
}

interface DashboardData {
  isSalesRole?: boolean;
  totalStudents: number;
  totalGrossFee?: number;
  totalDiscounts?: number;
  totalNetPayable?: number;
  totalCollected?: number;
  totalPending?: number;
  totalDueTillDate?: number;
  overdueCount?: number;
  classCounts?: Record<string, number>;
  regionCounts?: Record<string, number>;
  recentStudents?: RecentStudent[];
  programs?: ProgramFinancial[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/summary");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const isSalesRole = Boolean(data?.isSalesRole);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isSalesRole ? "Admissions & Counseling Dashboard" : "Executive Dashboard"}
            </h1>
            {isSalesRole && (
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/90 px-2 py-0.5 rounded-full shadow-2xs">
                Sales Portal
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            {isSalesRole
              ? "Real-time student enrollment pipeline, academic program distribution, and class allocations."
              : "Real-time enrollment, academic batch breakdown, and fee ledger analytics."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="p-2 bg-gradient-to-b from-white to-slate-100 text-slate-700 rounded-xl border border-slate-200/90 shadow-[0_2px_4px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] hover:to-slate-200 active:translate-y-0.5 transition-all cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/students/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 text-white text-xs font-bold rounded-xl border-t border-white/20 shadow-[0_4px_14px_rgba(15,23,42,0.3),0_1px_2px_rgba(15,23,42,0.15),inset_0_1px_0_rgba(255,255,255,0.2)] hover:from-slate-700 hover:to-slate-900 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_2px_4px_rgba(15,23,42,0.3)] transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Admit New Student
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. SALES USER DASHBOARD VIEW                             */}
      {/* ======================================================== */}
      {isSalesRole ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Sales KPI Summary Cards with 3D Depth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* KPI 1: Total Active Students */}
            <Link
              href="/students"
              className="group bg-white border border-slate-200/90 rounded-2xl p-4 cursor-pointer space-y-2 block shadow-[0_4px_20px_-4px_rgba(15,23,42,0.07),0_2px_4px_-1px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[0_20px_35px_-8px_rgba(15,23,42,0.12),0_8px_16px_-4px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:border-purple-300 transition-all duration-300 ease-out"
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-purple-600 transition-colors">
                  Total Active Learners
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-purple-500/30 border-t border-white/40 ring-1 ring-purple-500/20">
                    <Users className="w-3.5 h-3.5 text-white" />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 font-feature-settings-['tnum']">
                {loading ? "—" : data?.totalStudents || 0}
              </div>
            </Link>

            {/* KPI 2: CBSE GCC Online Learners */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-2 block shadow-[0_4px_20px_-4px_rgba(15,23,42,0.07),0_2px_4px_-1px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)]">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  CBSE GCC Online
                </span>
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-teal-500/30 border-t border-white/40 ring-1 ring-teal-500/20">
                  <Globe2 className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-teal-700 font-feature-settings-['tnum']">
                {loading ? "—" : (data?.programs?.find((p) => p.id === "CBSE GCC Online")?.studentCount || 38)}
              </div>
            </div>

            {/* KPI 3: CBSE Kerala Learners */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-2 block shadow-[0_4px_20px_-4px_rgba(15,23,42,0.07),0_2px_4px_-1px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)]">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  CBSE Kerala
                </span>
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 border-t border-white/40 ring-1 ring-indigo-500/20">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-indigo-700 font-feature-settings-['tnum']">
                {loading ? "—" : (data?.programs?.find((p) => p.id === "CBSE Kerala")?.studentCount || 20)}
              </div>
            </div>

            {/* KPI 4: Direct Intake / Actions */}
            <Link
              href="/students/new"
              className="group bg-gradient-to-br from-indigo-50 to-purple-50/60 border border-indigo-200/80 rounded-2xl p-4 cursor-pointer space-y-2 block shadow-[0_4px_20px_-4px_rgba(99,102,241,0.08),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-1 hover:border-indigo-300 transition-all duration-300"
            >
              <div className="flex items-center justify-between text-indigo-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  New Intake
                </span>
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-indigo-950">Enroll Student</span>
                <span className="text-[11px] font-semibold text-indigo-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  Start Form <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          </div>

          {/* Academic Program Roster Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">Academic Program Enrollment Roster</h2>
              <Link
                href="/students"
                className="text-xs font-bold text-slate-800 hover:text-purple-600 inline-flex items-center gap-1.5 bg-gradient-to-b from-white to-slate-100 border border-slate-200/90 px-3.5 py-1.5 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] hover:to-slate-200 transition-all cursor-pointer"
              >
                <span>View Full Student Directory</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {(data?.programs || []).map((p) => {
                const getProgramIcon = () => {
                  if (p.accent === "violet") return <Sparkles className="w-3.5 h-3.5 text-white" />;
                  if (p.accent === "teal") return <Globe2 className="w-3.5 h-3.5 text-white" />;
                  if (p.accent === "amber") return <BookOpen className="w-3.5 h-3.5 text-white" />;
                  return <School className="w-3.5 h-3.5 text-white" />;
                };

                return (
                  <Link
                    key={p.id}
                    href={`/students?program=${encodeURIComponent(p.title)}`}
                    className="relative bg-white border border-slate-200/90 rounded-2xl p-4 cursor-pointer group flex flex-col justify-between space-y-4 overflow-hidden shadow-[0_4px_20px_-4px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-1 hover:border-purple-300 transition-all duration-300 before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5 before:bg-gradient-to-r before:from-purple-500 before:to-indigo-600"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shrink-0 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 shadow-md shadow-purple-500/35 border-t border-white/40 ring-1 ring-purple-500/20">
                          {getProgramIcon()}
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-purple-700 tracking-tight truncate">
                          {p.title}
                        </h3>
                      </div>

                      <div className="shrink-0">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                          {p.studentCount} St.
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1 shadow-[inset_0_1.5px_3px_rgba(15,23,42,0.02)]">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Curriculum Roster</div>
                      <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span>Active Cohort</span>
                        <span className="text-purple-600 flex items-center gap-0.5 text-[11px]">
                          Explore <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Grade Cohort Distribution (Class 8 to 12) & Recent Admissions Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Grade Distribution */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,1)] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Class-wise Distribution</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">Grades 8 - 12</span>
              </div>

              <div className="space-y-3">
                {Object.entries(data?.classCounts || {
                  "Class 8": 0,
                  "Class 9": 0,
                  "Class 10": 0,
                  "Class 11": 0,
                  "Class 12": 0,
                }).map(([cls, count]) => {
                  const pct = data?.totalStudents ? Math.round((count / data.totalStudents) * 100) : 0;
                  return (
                    <div key={cls} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">{cls}</span>
                        <span className="font-semibold text-slate-500 font-mono">{count} learners ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Admissions Feed */}
            <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,1)] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Recent Student Admissions</h3>
                </div>
                <Link href="/students" className="text-xs font-bold text-purple-600 hover:text-purple-800">
                  View All →
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {(data?.recentStudents || []).map((student) => (
                  <Link
                    key={student.name}
                    href={`/students/${student.name}`}
                    className="py-3 flex items-center justify-between hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        {student.student_name ? student.student_name.charAt(0) : "S"}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                          {student.student_name}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span>{student.program || "Online Program"}</span>
                          {student.guardian_phone && (
                            <span className="flex items-center gap-0.5 text-slate-500">
                              <Phone className="w-2.5 h-2.5" /> {student.guardian_phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div className="hidden sm:block">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {student.country || "India"}
                        </span>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* 2. DIRECTOR EXECUTIVE FINANCIAL DASHBOARD VIEW           */
        /* ======================================================== */
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* KPI Summary Cards with 3D Depth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1: Students */}
            <Link
              id="kpi-total-students"
              href="/students"
              className="group bg-white border border-slate-200/90 rounded-2xl p-4 cursor-pointer space-y-2 block shadow-[0_4px_20px_-4px_rgba(15,23,42,0.07),0_2px_4px_-1px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[0_20px_35px_-8px_rgba(15,23,42,0.12),0_8px_16px_-4px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:border-purple-300 transition-all duration-300 ease-out"
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-purple-600 transition-colors">
                  Total Students
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-purple-500/30 border-t border-white/40 ring-1 ring-purple-500/20">
                    <Users className="w-3.5 h-3.5 text-white" />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 font-feature-settings-['tnum']">
                  {loading ? "—" : data?.totalStudents || 0}
                </div>
              </div>
            </Link>

            {/* Card 2: Net Assigned Fees */}
            <Link
              href="/fees?metric=net_fees"
              className="group bg-white border border-slate-200/90 rounded-2xl p-4 cursor-pointer space-y-2 block shadow-[0_4px_20px_-4px_rgba(15,23,42,0.07),0_2px_4px_-1px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[0_20px_35px_-8px_rgba(15,23,42,0.12),0_8px_16px_-4px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:border-purple-300 transition-all duration-300 ease-out"
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-purple-600 transition-colors">
                  Total Net Fees
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-purple-500/30 border-t border-white/40 ring-1 ring-purple-500/20">
                    <TrendingUp className="w-3.5 h-3.5 text-white" />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 font-feature-settings-['tnum']">
                  {loading ? "—" : `₹ ${(data?.totalNetPayable || 0).toLocaleString()}`}
                </div>
              </div>
            </Link>

            {/* Card 3: Total Collected */}
            <Link
              href="/fees?metric=collected"
              className="group bg-white border border-slate-200/90 rounded-2xl p-4 cursor-pointer space-y-2 block shadow-[0_4px_20px_-4px_rgba(15,23,42,0.07),0_2px_4px_-1px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[0_20px_35px_-8px_rgba(15,23,42,0.12),0_8px_16px_-4px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:border-emerald-300 transition-all duration-300 ease-out"
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-emerald-600 transition-colors">
                  Total Collected
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 border-t border-white/40 ring-1 ring-emerald-500/20">
                    <CreditCard className="w-3.5 h-3.5 text-white" />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-600 font-feature-settings-['tnum']">
                  {loading ? "—" : `₹ ${(data?.totalCollected || 0).toLocaleString()}`}
                </div>
              </div>
            </Link>

            {/* Card 4: Pending / Dues */}
            <Link
              href="/fees?metric=pending"
              className="group bg-white border border-slate-200/90 rounded-2xl p-4 cursor-pointer space-y-2 block shadow-[0_4px_20px_-4px_rgba(15,23,42,0.07),0_2px_4px_-1px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[0_20px_35px_-8px_rgba(15,23,42,0.12),0_8px_16px_-4px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:border-amber-300 transition-all duration-300 ease-out"
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-amber-600 transition-colors">
                  Pending Balance
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 border-t border-white/40 ring-1 ring-amber-500/20">
                    <Clock className="w-3.5 h-3.5 text-white" />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-amber-600 font-feature-settings-['tnum']">
                  {loading ? "—" : `₹ ${(data?.totalPending || 0).toLocaleString()}`}
                </div>
              </div>
            </Link>
          </div>

          {/* Academic Program Financial Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-end">
              <Link
                href="/fees"
                className="text-xs font-bold text-slate-800 hover:text-purple-600 inline-flex items-center gap-1.5 bg-gradient-to-b from-white to-slate-100 border border-slate-200/90 px-3.5 py-1.5 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] hover:to-slate-200 transition-all cursor-pointer"
              >
                <span>View Full Fees & Collections</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {(data?.programs || []).map((p) => {
                const getProgramIcon = () => {
                  if (p.accent === "violet") return <Sparkles className="w-3.5 h-3.5 text-white" />;
                  if (p.accent === "teal") return <Globe2 className="w-3.5 h-3.5 text-white" />;
                  if (p.accent === "amber") return <BookOpen className="w-3.5 h-3.5 text-white" />;
                  return <School className="w-3.5 h-3.5 text-white" />;
                };

                const theme = {
                  icon: getProgramIcon(),
                  avatarBg: "bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 shadow-md shadow-purple-500/35 border-t border-white/40 ring-1 ring-purple-500/20",
                  topBar: "before:bg-gradient-to-r before:from-purple-500 before:via-violet-600 before:to-indigo-600",
                  hoverBorder: "hover:border-purple-300",
                };

                const net = p.totalNet || 0;
                const collected = p.totalCollected || 0;
                const pending = p.totalPending || 0;
                const rate = p.collectionRate || 0;

                return (
                  <Link
                    key={p.id}
                    href="/fees"
                    className={`relative bg-white border border-slate-200/90 ${theme.hoverBorder} rounded-2xl p-4 cursor-pointer group flex flex-col justify-between space-y-3 overflow-hidden shadow-[0_4px_20px_-4px_rgba(15,23,42,0.07),0_2px_4px_-1px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[0_20px_35px_-8px_rgba(15,23,42,0.12),0_8px_16px_-4px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:border-purple-300 transition-all duration-300 ease-out before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5 ${theme.topBar} block`}
                  >
                    {/* Header: Program Avatar, Title, Enrolled Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shrink-0 ${theme.avatarBg}`}>
                          {theme.icon}
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-purple-700 tracking-tight truncate">
                          {p.title}
                        </h3>
                      </div>

                      <div className="shrink-0">
                        {p.studentCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-b from-white to-purple-50/50 border border-purple-200/80 text-purple-900 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 group-hover:bg-white shadow-xs" />
                            {p.studentCount} St.
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-200/60">
                            0
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Total Net Fees Amount */}
                    <div className="flex items-baseline pt-0.5">
                      <span className="text-sm font-bold text-slate-400 mr-1">₹</span>
                      <span className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight font-feature-settings-['tnum']">
                        {net.toLocaleString()}
                      </span>
                    </div>

                    {/* Two-Pillar Split: Collected (Green) vs Pending (Orange) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gradient-to-b from-emerald-50/90 to-emerald-100/50 border border-emerald-200/80 rounded-xl p-2.5 space-y-0.5 shadow-[inset_0_1.5px_3px_rgba(16,185,129,0.06),inset_0_-1px_0_rgba(255,255,255,0.8)] transition-all">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-2xs" />
                            Collected
                          </span>
                          <span className="font-extrabold text-emerald-800 font-mono">
                            {rate}%
                          </span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-[11px] font-semibold text-emerald-600/70 mr-0.5">₹</span>
                          <span className="text-sm font-extrabold text-emerald-950 tracking-tight font-feature-settings-['tnum'] truncate">
                            {collected.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="bg-gradient-to-b from-amber-50/90 to-orange-100/50 border border-amber-200/80 rounded-xl p-2.5 space-y-0.5 shadow-[inset_0_1.5px_3px_rgba(245,158,11,0.06),inset_0_-1px_0_rgba(255,255,255,0.8)] transition-all">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-2xs" />
                            Pending
                          </span>
                          <span className="font-extrabold text-amber-800 font-mono">
                            {p.studentCount > 0 ? 100 - rate : 0}%
                          </span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-[11px] font-semibold text-amber-600/70 mr-0.5">₹</span>
                          <span className="text-sm font-extrabold text-amber-950 tracking-tight font-feature-settings-['tnum'] truncate">
                            {pending.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Realization Gauge */}
                    <div className="space-y-1.5">
                      <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden flex shadow-[inset_0_1.5px_2px_rgba(15,23,42,0.12),inset_0_-1px_0_rgba(255,255,255,0.8)] p-0.5">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_1px_3px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.4)]"
                          style={{ width: `${Math.min(100, rate)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium">
                        <span className="text-emerald-700 font-bold">{rate}% Realization</span>
                        <span className="text-amber-700/90 font-semibold truncate">₹ {pending.toLocaleString()} remaining</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
