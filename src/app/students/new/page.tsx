"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  UserPlus, 
  BookOpen, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Layers,
  ChevronDown
} from "lucide-react";

export default function NewStudentPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto py-16 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-gray-500">Loading admission form...</p>
      </div>
    }>
      <NewStudentForm />
    </Suspense>
  );
}

function NewStudentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Cascading Hierarchy State
  const [program, setProgram] = useState("CBSE Kerala");
  const [classLevel, setClassLevel] = useState("10th");
  const [courseStream, setCourseStream] = useState<"Regular" | "Crash Course">("Regular");
  // For CBSE Regular: 1:1, 1:3, or Micro
  const [deliveryModel, setDeliveryModel] = useState<"1:1" | "1:3" | "Micro">("1:1");
  // State Board Batches (only used when State Board)
  const [stateBatch, setStateBatch] = useState("Batch A");
  // Crash Course Batches
  const [crashBatch, setCrashBatch] = useState("Crash Batch 1");

  const [admissionDate, setAdmissionDate] = useState("");

  const isStateBoard = program === "State Board" || program === "State";
  const isCrash = courseStream === "Crash Course";
  const isCbseRegular = !isStateBoard && !isCrash;

  // Pre-populate from query params if clicked from directory
  useEffect(() => {
    const qProgram = searchParams.get("program");
    const qClass = searchParams.get("class");
    const qStream = searchParams.get("stream");
    const qModel = searchParams.get("model");
    const qBatch = searchParams.get("batch");

    if (qProgram) setProgram(qProgram);
    if (qClass) setClassLevel(qClass);
    if (qStream === "Crash Course" || qStream === "Regular") setCourseStream(qStream as any);
    if (qModel === "1:1" || qModel === "1:3" || qModel === "Micro") setDeliveryModel(qModel as any);
    if (qBatch) {
      if (isCrash) setCrashBatch(qBatch);
      else setStateBatch(qBatch);
    }
  }, [searchParams, isCrash]);

  useEffect(() => {
    setAdmissionDate(new Date().toISOString().split("T")[0]);
  }, []);

  // Section 2: Student Identity
  const [studentName, setStudentName] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [country, setCountry] = useState("India");
  const currency = "INR"; // Fixed to INR per user requirement

  // Section 3: Fee Model
  // For 1:1 & 1:3 Tutoring: No fixed base rate or hours committed at admission. All billing is done at month-end based on classes conducted.
  const isPerClassPostBilled = isCbseRegular && (deliveryModel === "1:1" || deliveryModel === "1:3");

  // Fixed Package Fees (for Micro Batch, State Batch, and Crash Courses)
  const [packageFee, setPackageFee] = useState(24000);
  const [instalmentPlan, setInstalmentPlan] = useState<"Full" | "5-Pay" | "10-Pay">("5-Pay");

  // Section 4: Admission Advance / Security Deposit (Optional)
  const [collectAdvance, setCollectAdvance] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState(5000);
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");
  const [transactionRef, setTransactionRef] = useState("");

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Format currency consistently between SSR and Client
  const formatINR = (val: number) => {
    if (!mounted) return val.toString();
    return val.toLocaleString("en-IN");
  };

  // Auto adjust defaults when program changes
  const handleProgramChange = (p: string) => {
    setProgram(p);
    if (p === "CBSE GCC Online" || p === "CBSE GCC Offline") {
      setCountry("Qatar");
    } else {
      setCountry("India");
    }
  };

  // Generate Instalment Schedule preview for Micro / State / Crash
  const generateInstalments = () => {
    const count = instalmentPlan === "Full" ? 1 : instalmentPlan === "5-Pay" ? 5 : 10;
    const perInstalment = Math.round(packageFee / count);
    const list = [];
    const baseDate = new Date(admissionDate || new Date());

    for (let i = 1; i <= count; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + (i - 1));
      list.push({
        instalment_number: i,
        due_date: d.toISOString().split("T")[0],
        amount_due: i === count ? packageFee - perInstalment * (count - 1) : perInstalment,
      });
    }
    return list;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setStatusMessage({ type: "error", text: "Please enter the student's full name." });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    // Formulate final delivery mode & batch name
    const finalDeliveryMode = isCrash 
      ? "Crash Course" 
      : isStateBoard 
        ? "Batch Cohort" 
        : deliveryModel === "1:1" 
          ? "1:1 Tutoring" 
          : deliveryModel === "1:3" 
            ? "1:3 Group" 
            : "Micro Batch";

    const finalBatchName = isStateBoard 
      ? stateBatch 
      : isCrash 
        ? crashBatch 
        : `${deliveryModel} Tutoring`;

    const payload = {
      student_name: studentName,
      guardian_name: guardianName,
      guardian_phone: guardianPhone,
      guardian_email: guardianEmail,
      country,
      billing_currency: currency,
      admission_date: admissionDate,
      program,
      class_level: classLevel,
      course_type: courseStream,
      delivery_mode: finalDeliveryMode,
      batch_name: finalBatchName,
      billing_mode: isPerClassPostBilled ? "Monthly Post-Billing (Per Class Conducted)" : "Fixed Instalments (Package)",
      contract_duration_months: 10,
      subject_allocations: [],
      package_fee: isPerClassPostBilled ? 0 : packageFee,
      instalment_plan: instalmentPlan,
      instalments: !isPerClassPostBilled ? generateInstalments() : [],
      discount_amount: 0,
      discount_reason: "",
      collect_advance: collectAdvance,
      advance_amount: advanceAmount,
      payment_mode: paymentMode,
      transaction_reference: transactionRef || `UTR-${Date.now().toString().slice(-8)}`,
    };

    try {
      const res = await fetch("/api/students/enrol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.details || "Failed to enrol student in Frappe");
      }

      setStatusMessage({
        type: "success",
        text: `Student ${studentName} successfully registered! ID: ${json.student_id}. Redirecting...`,
      });

      setTimeout(() => {
        router.push(`/students/${json.student_id}`);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: "error",
        text: err.message || "An unexpected error occurred during enrolment.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="space-y-1">
          <Link
            href="/students"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Students Directory
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">New Student Admission</h1>
          <p className="text-sm text-gray-500">
            Register student profile and academic categorization. {isPerClassPostBilled ? "Billing is generated monthly after classes are conducted." : "Package fee schedule configured below."}
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Main Input Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Interactive Cascading Dropdowns */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h2 className="text-base font-semibold text-gray-900">1. Academic Categorization</h2>
              </div>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Cascading Dropdowns
              </span>
            </div>

            <div className="flex flex-col space-y-3.5 max-w-xl">
              {/* Step 1: Program Dropdown */}
              <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold inline-flex items-center justify-center">1</span>
                  Segment / Program <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={program}
                    onChange={(e) => handleProgramChange(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 text-xs font-semibold bg-white hover:bg-slate-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-colors shadow-sm"
                  >
                    <option value="CBSE Kerala">CBSE Kerala</option>
                    <option value="State Board">State Board</option>
                    <option value="CBSE GCC Online">CBSE GCC Online</option>
                    <option value="CBSE GCC Offline">CBSE GCC Offline</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Connector line */}
              <div className="flex justify-start pl-6 -my-1 text-slate-300">
                <div className="w-0.5 h-3 bg-slate-200" />
              </div>

              {/* Step 2: Class Dropdown */}
              <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold inline-flex items-center justify-center">2</span>
                  Class Level <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 text-xs font-semibold bg-white hover:bg-slate-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-colors shadow-sm"
                  >
                    <option value="8th">8th Standard</option>
                    <option value="9th">9th Standard</option>
                    <option value="10th">10th Standard</option>
                    <option value="+1">+1 (11th Standard)</option>
                    <option value="+2">+2 (12th Standard)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Connector line */}
              <div className="flex justify-start pl-6 -my-1 text-slate-300">
                <div className="w-0.5 h-3 bg-slate-200" />
              </div>

              {/* Step 3: Course Stream Dropdown */}
              <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold inline-flex items-center justify-center">3</span>
                  Course Stream <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={courseStream}
                    onChange={(e) => setCourseStream(e.target.value as any)}
                    className="w-full appearance-none px-3.5 py-2.5 text-xs font-semibold bg-white hover:bg-slate-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-colors shadow-sm"
                  >
                    <option value="Regular">Regular Course (Full Academic Year)</option>
                    <option value="Crash Course">Crash Course (Fast Track Revision)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Connector line */}
              <div className="flex justify-start pl-6 -my-1 text-slate-300">
                <div className="w-0.5 h-3 bg-slate-200" />
              </div>

              {/* Step 4: Conditional Formats */}
              {isCbseRegular ? (
                /* CBSE Regular: 1:1, 1:3, Micro (NO Batches like A, B, C) */
                <div className="bg-purple-50/60 p-3 rounded-lg border border-purple-200">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold inline-flex items-center justify-center">4</span>
                    Delivery Format (CBSE) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={deliveryModel}
                      onChange={(e) => setDeliveryModel(e.target.value as any)}
                      className="w-full appearance-none px-3.5 py-2.5 text-xs font-semibold bg-white hover:bg-purple-50 border border-purple-300 rounded-lg text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer transition-colors shadow-sm"
                    >
                      <option value="1:1">1:1 Individual Tutoring (Private Post-Billed)</option>
                      <option value="1:3">1:3 Small Group Tutoring (Post-Billed)</option>
                      <option value="Micro">Micro Batch (Fixed Instalment Schedule)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-purple-700 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              ) : isStateBoard && !isCrash ? (
                /* State Board Regular: Batches like A, B, C ONLY */
                <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold inline-flex items-center justify-center">4</span>
                    State Batch Cohort <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={stateBatch}
                      onChange={(e) => setStateBatch(e.target.value)}
                      className="w-full appearance-none px-3.5 py-2.5 text-xs font-semibold bg-white hover:bg-blue-50 border border-blue-300 rounded-lg text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors shadow-sm"
                    >
                      <option value="Batch A">Batch A</option>
                      <option value="Batch B">Batch B</option>
                      <option value="Batch C">Batch C</option>
                      <option value="Batch D">Batch D</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-blue-700 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              ) : (
                /* Crash Course Batch */
                <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold inline-flex items-center justify-center">4</span>
                    Crash Batch <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={crashBatch}
                      onChange={(e) => setCrashBatch(e.target.value)}
                      className="w-full appearance-none px-3.5 py-2.5 text-xs font-semibold bg-white hover:bg-amber-50 border border-amber-300 rounded-lg text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer transition-colors shadow-sm"
                    >
                      <option value="Crash Batch 1">Crash Batch 1</option>
                      <option value="Crash Batch 2">Crash Batch 2</option>
                      <option value="Crash Batch 3">Crash Batch 3</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-amber-700 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Path info banner */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">Pathway:</span>
                <span>{program}</span>
                <span>›</span>
                <span>{classLevel}</span>
                <span>›</span>
                <span>{courseStream}</span>
                <span>›</span>
                <span className="font-bold text-emerald-700">
                  {isCbseRegular ? deliveryModel : isStateBoard && !isCrash ? stateBatch : crashBatch}
                </span>
              </div>
            </div>

            {/* Admission Date */}
            <div className="pt-2 border-t border-gray-100">
              <div className="w-full sm:w-1/2">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Admission Date</label>
                <input
                  type="date"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

          </div>

          {/* Card 2: Student Identity */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-semibold text-gray-900">2. Student Profile & Guardian Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Student Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rehan Mehrin"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Guardian Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mohammed Mehrin"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Guardian Phone (WhatsApp)</label>
                <input
                  type="text"
                  placeholder="e.g. +974 5512 3456"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Guardian Email</label>
                <input
                  type="email"
                  placeholder="guardian@example.com"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Residence Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="India">India (Kerala)</option>
                  <option value="Qatar">Qatar</option>
                  <option value="Kuwait">Kuwait</option>
                  <option value="UAE">UAE</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="Oman">Oman</option>
                  <option value="Bahrain">Bahrain</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 3: Fee Model Explanation or Fixed Package Setup */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <h2 className="text-base font-semibold text-gray-900">
                  3. {isPerClassPostBilled ? "Monthly Post-Billing Workflow (INR ₹)" : "Fee Plan & Instalments (INR ₹)"}
                </h2>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                INR (₹) Only
              </span>
            </div>

            {isPerClassPostBilled ? (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>No Fixed Contract Required at Admission</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  For <strong>{deliveryModel} Tutoring</strong>, no fixed hours or rates are locked during admission. 
                  Billing occurs at the end of each month (e.g. September 30 or October 1) based on the 
                  <strong> actual conducted classes</strong>.
                </p>
                <div className="text-[11px] text-slate-600 bg-white p-3 rounded-lg border border-emerald-100">
                  💡 <strong>How It Works:</strong> At the end of each month, open the student's profile, click <strong>"Generate Monthly Invoice"</strong>, enter the subjects, conducted class hours (e.g. 12 classes), and per-hour rate to post the official ERPNext invoice.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Total Package Fee (₹ INR)</label>
                    <input
                      type="number"
                      value={packageFee}
                      onChange={(e) => setPackageFee(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Instalment Plan</label>
                    <select
                      value={instalmentPlan}
                      onChange={(e) => setInstalmentPlan(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Full">Full One-time Payment</option>
                      <option value="5-Pay">5 Equal Monthly Instalments</option>
                      <option value="10-Pay">10 Equal Monthly Instalments</option>
                    </select>
                  </div>
                </div>

                {/* Instalment Schedule Preview */}
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 text-xs">
                  <div className="bg-gray-100 px-3 py-2 font-semibold text-gray-700 flex justify-between">
                    <span>Instalment Schedule Preview</span>
                    <span>Total: ₹{formatINR(packageFee)}</span>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {generateInstalments().map((inst) => (
                      <div key={inst.instalment_number} className="px-3 py-1.5 flex justify-between text-gray-600">
                        <span>Instalment #{inst.instalment_number} (Due {inst.due_date})</span>
                        <span className="font-medium text-gray-900">₹{formatINR(inst.amount_due)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 4: Optional Initial Deposit / Registration Fee */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-semibold text-gray-900">4. Initial Advance / Admission Fee (Optional)</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="collectAdvance"
                  checked={collectAdvance}
                  onChange={(e) => setCollectAdvance(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <label htmlFor="collectAdvance" className="text-xs font-medium text-gray-800">
                  Record initial advance or registration fee payment right now
                </label>
              </div>

              {collectAdvance && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Amount Collected (₹)</label>
                    <input
                      type="number"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Payment Mode</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="Bank Transfer">Bank Transfer / NEFT</option>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Ref / UTR Number</label>
                    <input
                      type="text"
                      placeholder="e.g. UTR-9823412"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right 1 Column: Admission Summary Card */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-6 space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-3">
              Admission Summary
            </h3>

            {/* Categorization Badge Block */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">Selected Academic Pathway</div>
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {program} › Class {classLevel}
              </div>
              <div className="text-slate-600 pl-3.5">
                Stream: <strong className="text-slate-800">{courseStream}</strong>
              </div>
              <div className="text-slate-600 pl-3.5">
                {isCbseRegular ? (
                  <>Format: <strong className="text-purple-700 font-bold">{deliveryModel}</strong></>
                ) : isStateBoard && !isCrash ? (
                  <>Cohort: <strong className="text-blue-700 font-bold">{stateBatch}</strong></>
                ) : (
                  <>Batch: <strong className="text-amber-700 font-bold">{crashBatch}</strong></>
                )}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Billing Currency</span>
                <span className="font-semibold text-gray-900">INR (₹)</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Billing Model</span>
                <span className="font-semibold text-emerald-700">
                  {isPerClassPostBilled ? "Post-Billed Monthly" : "Fixed Package"}
                </span>
              </div>

              {!isPerClassPostBilled && (
                <div className="flex justify-between text-gray-600">
                  <span>Package Fee</span>
                  <span className="font-semibold text-gray-900">₹{formatINR(packageFee)}</span>
                </div>
              )}

              {collectAdvance && (
                <div className="flex justify-between text-xs text-gray-600 pt-2 border-t border-gray-100">
                  <span>Advance Collected Now</span>
                  <span className="font-semibold text-emerald-700">₹{formatINR(advanceAmount)}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Registering Student...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Complete Admission
                </>
              )}
            </button>

            <p className="text-[11px] text-gray-400 text-center">
              Student profile is created immediately. Monthly billing is initiated when classes are completed.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
