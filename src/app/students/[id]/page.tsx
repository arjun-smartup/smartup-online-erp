"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Globe2, 
  Calendar, 
  CreditCard, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Download,
  Receipt,
  GraduationCap,
  ExternalLink,
  RefreshCw,
  Building2,
  Plus,
  Send,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Tag,
  ShieldCheck,
  Hash,
  Pencil,
  X,
  Check
} from "lucide-react";

export default function StudentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const studentId = resolvedParams.id;

  const [student, setStudent] = useState<any>(null);
  const [feeLedger, setFeeLedger] = useState<any>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Student Details Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    student_name: "",
    guardian_name: "",
    guardian_phone: "",
    guardian_email: "",
    country: "India",
    billing_currency: "INR",
    admission_date: "",
    status: "Active",
    class_level: "10th",
    delivery_mode: "1:1 Tutoring",
    course_type: "Regular",
    batch_name: "",
  });

  const openEditModal = () => {
    if (!student) return;
    setEditFormData({
      student_name: student.student_name || "",
      guardian_name: student.guardian_name || "",
      guardian_phone: student.guardian_phone || "",
      guardian_email: student.guardian_email || "",
      country: student.country || "India",
      billing_currency: student.billing_currency || feeLedger?.currency || "INR",
      admission_date: student.admission_date ? student.admission_date.split("T")[0] : "",
      status: student.status || "Active",
      class_level: student.class_level || "10th",
      delivery_mode: student.delivery_mode || "1:1 Tutoring",
      course_type: student.course_type || "Regular",
      batch_name: student.batch_name || "",
    });
    setEditSuccessMsg(null);
    setEditErrorMsg(null);
    setShowEditModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEdit(true);
    setEditErrorMsg(null);

    try {
      const res = await fetch(`/api/students/${encodeURIComponent(studentId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update student profile");
      }

      setEditSuccessMsg("Student details saved successfully!");
      setStudent((prev: any) => ({
        ...prev,
        ...editFormData,
      }));

      setTimeout(() => {
        setShowEditModal(false);
        setEditSuccessMsg(null);
        loadData();
      }, 1000);
    } catch (err: any) {
      setEditErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Accordion for Payment History
  const [showPaymentHistory, setShowPaymentHistory] = useState(true);

  // Modal State for Generating Monthly Invoice
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [monthName, setMonthName] = useState(
    () => new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })
  );
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [invoiceDueDate, setInvoiceDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [subjectHours, setSubjectHours] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [invoiceSuccess, setInvoiceSuccess] = useState<string | null>(null);

  // Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);

  // Payment Recording Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");
  const [paymentRefNo, setPaymentRefNo] = useState("");
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  const openPaymentModal = (invoice: any) => {
    setPaymentTargetInvoice(invoice);
    setPaymentAmount(Number(invoice.outstanding_amount) || Number(invoice.grand_total) || 0);
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentMode("Bank Transfer");
    setPaymentRefNo("");
    setPaymentSuccessMsg(null);
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTargetInvoice) return;
    setIsRecordingPayment(true);
    setPaymentSuccessMsg(null);

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          customer: student.customer,
          invoice_name: paymentTargetInvoice.name,
          paid_amount: paymentAmount,
          payment_date: paymentDate,
          mode_of_payment: paymentMode,
          reference_no: paymentRefNo,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record payment");

      setPaymentSuccessMsg(`Payment of ${currencyLabel} ${paymentAmount.toLocaleString()} posted! (Entry: ${data.payment_entry})`);
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentSuccessMsg(null);
        loadData();
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Failed to record payment entry");
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${encodeURIComponent(studentId)}`);
      if (res.ok) {
        const json = await res.json();
        setStudent(json.student);
        setFeeLedger(json.feeLedger);
        setReceipts(json.receipts || []);
        setInvoices(json.salesInvoices || []);

        // Initialize modal subject hours from fee ledger
        if (json.feeLedger?.subject_allocations?.length > 0) {
          setSubjectHours(
            json.feeLedger.subject_allocations.map((s: any) => ({
              subject: s.subject,
              hours: s.monthly_hours,
              rate: s.hourly_rate,
            }))
          );
        } else {
          setSubjectHours([
            { subject: "Mathematics", hours: 6, rate: 850 },
            { subject: "Physics", hours: 6, rate: 850 },
          ]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  const handleCreateMonthlyInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setInvoiceSuccess(null);

    try {
      const res = await fetch("/api/invoices/create-monthly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          customer: student.customer,
          month_name: monthName,
          posting_date: invoiceDate,
          due_date: invoiceDueDate,
          subject_hours_breakdown: subjectHours,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create invoice");

      setInvoiceSuccess(`Invoice ${data.invoice_name} for ${currencyLabel} ${data.grand_total.toLocaleString()} generated & posted!`);
      setTimeout(() => {
        setShowInvoiceModal(false);
        setInvoiceSuccess(null);
        loadData();
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Failed to create monthly invoice");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSubjectHourRow = (index: number, field: string, val: any) => {
    const updated = [...subjectHours];
    (updated[index] as any)[field] = val;
    setSubjectHours(updated);
  };

  const addSubjectHourRow = () => {
    setSubjectHours([...subjectHours, { subject: "Chemistry", hours: 6, rate: 850 }]);
  };

  const removeSubjectHourRow = (index: number) => {
    setSubjectHours(subjectHours.filter((_, i) => i !== index));
  };

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Loading student profile & ledger...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Student Not Found</h2>
        <Link
          href="/students"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Students Directory
        </Link>
      </div>
    );
  }

  const overallTotal = Number(feeLedger?.gross_fee) || 0;
  const overallCollected = Number(feeLedger?.total_collected) || 0;
  const overallOutstanding = Number(feeLedger?.pending_balance) || 0;
  const discountAmount = Number(feeLedger?.discount_amount) || 0;
  const collectedPercent = overallTotal > 0 ? Math.round((overallCollected / overallTotal) * 100) : 0;

  // Dynamic currency label (QAR, INR, etc.)
  const currencyLabel = feeLedger?.currency || student?.billing_currency || "INR";

  // Dynamic billing months dropdown (next 12 months from today)
  const billingMonths = (() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = -2; i <= 9; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push(d.toLocaleString("en-IN", { month: "long", year: "numeric" }));
    }
    return months;
  })();

  const programDisplayName = student.resolved_program_name || student.program || "CBSE GCC";

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1.5">
          <Link
            href="/students"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Students Directory
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{student.student_name}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {student.status || "Active"}
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400">
            ID: {student.name} • Customer: {student.customer} • Batch: {feeLedger?.batch || "CBSE Online"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-edit-student-profile"
            onClick={openEditModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-slate-500" />
            Edit Profile
          </button>

          <button
            onClick={() => setShowInvoiceModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Generate Monthly Invoice
          </button>

          <button
            onClick={loadData}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. FIRST: STUDENT DETAILS (ENTERED PROFILE & DEMOGRAPHICS) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Student Details</h2>
              <p className="text-[11px] text-slate-500">Personal information and entered demographic profile</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-edit-student-details"
              onClick={openEditModal}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100/80 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
              <Pencil className="w-3 h-3" />
              Edit Details
            </button>
            <span className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
              DocType: SmartUp Student
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Student Full Name</span>
            <p className="text-sm font-semibold text-slate-900">{student.student_name || "—"}</p>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Guardian / Parent Name</span>
            <p className="text-sm font-semibold text-slate-900">{student.guardian_name || "—"}</p>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Guardian Phone / WhatsApp</span>
            <p className="text-sm font-mono font-semibold text-slate-900">{student.guardian_phone || "—"}</p>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Guardian Email</span>
            <p className="text-sm font-mono font-semibold text-slate-900 truncate" title={student.guardian_email || ""}>
              {student.guardian_email || "—"}
            </p>
          </div>


          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Country / Region</span>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Globe2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{student.country || "Qatar"}</span>
            </div>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Admission Date</span>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatDate(student.admission_date)}</span>
            </div>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Billing Currency</span>
            <p className="text-sm font-bold text-slate-900">{currencyLabel}</p>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Student Frappe ID</span>
            <p className="text-sm font-mono font-medium text-slate-800">{student.name}</p>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-500">ERPNext Customer Code</span>
            <p className="text-sm font-mono font-medium text-slate-800">{student.customer || "—"}</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THEN: ACADEMIC DETAILS & COMMITTED SUBJECT ALLOCATION */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Academic Details</h2>
              <p className="text-[11px] text-slate-500">Program enrollment, batch placement, and subject commitments</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            {student.delivery_mode || "1:1 Tutoring"}
          </span>
        </div>

        {/* Academic Placement Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Program</span>
            <p className="text-xs font-bold text-slate-900">{programDisplayName}</p>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Class Level</span>
            <p className="text-xs font-bold text-slate-900">{student.class_level || "Class 10"}</p>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Course / Delivery Mode</span>
            <p className="text-xs font-bold text-slate-900">{student.delivery_mode || "1:1 Tutoring"}</p>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Academic Year</span>
            <p className="text-xs font-bold text-slate-900">AY {feeLedger?.academic_year || "2026-2027"}</p>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 space-y-1 sm:col-span-2">
            <span className="text-[11px] font-medium text-slate-500">Enrolled Batch</span>
            <p className="text-xs font-bold text-slate-900 truncate">
              {feeLedger?.batch || (student.enrolled_batches?.[0]?.batch) || "CBSE GCC - Class 10 - 1:1 Tutoring"}
            </p>
          </div>
        </div>

        {/* Excel 1:1 Subject Hourly Breakdown Reference Table */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Committed Subject Hours & Rates (From Excel Sheet 11)
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
              Total Monthly Commitment: <span className="text-emerald-700">{currencyLabel} {feeLedger?.subject_allocations?.reduce((a: number, b: any) => a + (Number(b.monthly_subtotal) || b.monthly_hours * b.hourly_rate), 0)?.toLocaleString()}</span> / month
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4">Classes Per Month</th>
                  <th className="py-2.5 px-4">Payment Per Session (Rate/Hr)</th>
                  <th className="py-2.5 px-4 text-right">Monthly Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feeLedger?.subject_allocations && feeLedger.subject_allocations.length > 0 ? (
                  feeLedger.subject_allocations.map((s: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{s.subject}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{s.monthly_hours} classes</td>
                      <td className="py-3 px-4 text-slate-700">{currencyLabel} {s.hourly_rate} / hr</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {currencyLabel} {(s.monthly_hours * s.hourly_rate).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No custom subject allocations configured.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. LAST: FEE & PAYMENT DETAILS (MATCHING THE REFERENCE UI EXACTLY) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Fee & Payments</h2>
              <p className="text-[11px] text-slate-500">Contract agreement, monthly billing schedules, and ledger</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Generate Monthly Invoice
            </button>
            <span className="text-xs text-slate-500 font-mono bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
              Customer: {student.customer}
            </span>
          </div>
        </div>

        {/* Reference Box: Order Details Header Box */}
        <div className="bg-[#fafbfc] border border-slate-200/80 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-bold text-slate-900 font-mono text-sm">
                {student.name} - Contract
              </span>
              {student.delivery_mode && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                  {student.delivery_mode}
                </span>
              )}
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-700">
                10 Months Duration
              </span>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">
                {currencyLabel} {overallTotal.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-emerald-600">
              Paid: {currencyLabel} {overallCollected.toLocaleString()}
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-rose-600">
              Outstanding: {currencyLabel} {overallOutstanding.toLocaleString()}
            </span>
          </div>





          {/* Progress bar matching reference */}
          <div className="space-y-1 pt-1">
            <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#10b981] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, collectedPercent)}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {collectedPercent}% collected
            </div>
          </div>
        </div>

        {/* Invoices List Table Matching Reference UI */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Generated Monthly Invoices ({invoices.length})
            </h3>
            <span className="text-[11px] text-slate-400">Posts to General Ledger</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No monthly invoices generated yet. Click &quot;Generate Monthly Invoice&quot; above.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => {
                    const isOverdue = inv.status === "Overdue" || (Number(inv.outstanding_amount) > 0 && new Date(inv.due_date || inv.posting_date) < new Date());
                    return (
                      <tr key={inv.name} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                          {inv.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            {isOverdue && (
                              <Clock className="w-3.5 h-3.5 text-rose-600" />
                            )}
                            <span className={isOverdue ? "text-rose-600 font-semibold" : "text-slate-600 font-medium"}>
                              {formatDate(inv.due_date || inv.posting_date)}
                            </span>
                            {isOverdue && (
                              <span className="text-[10px] font-bold text-rose-600 uppercase ml-1">
                                OVERDUE
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                          {currencyLabel} {Number(inv.grand_total).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold">
                          {Number(inv.outstanding_amount) === 0 ? (
                            <span className="text-emerald-600 font-bold">—</span>
                          ) : (
                            <span className="text-rose-600 font-bold">
                              {currencyLabel} {Number(inv.outstanding_amount).toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === "Paid"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : inv.status === "Partly Paid"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : inv.status === "Overdue" || isOverdue
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {inv.status || (isOverdue ? "Overdue" : "Pending")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {Number(inv.outstanding_amount) > 0 && inv.status !== "Paid" && (
                              <button
                                onClick={() => openPaymentModal(inv)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors"
                                title="Record payment entry in ERPNext"
                              >
                                <CreditCard className="w-3 h-3" />
                                Mark Payment
                              </button>
                            )}

                            <button
                              onClick={() => {
                                const matchRec = receipts.find(r => r.amount_received > 0) || {
                                  name: "SU-REC-2026-00001",
                                  posting_date: inv.posting_date,
                                  amount_received: 5000,
                                  currency: currencyLabel,
                                  mode_of_payment: "Bank Transfer",
                                  transaction_reference: "UTR18274619",
                                };
                                setActiveReceipt(matchRec);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors"
                            >
                              <Receipt className="w-3 h-3" />
                              Receipt
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment History Accordion Matching Reference UI */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => setShowPaymentHistory(!showPaymentHistory)}
            className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              Payment History
              <span className="text-[11px] font-normal text-slate-400">({receipts.length})</span>
            </span>
            {showPaymentHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showPaymentHistory && (
            <div className="mt-3 border border-slate-200 rounded-xl p-4 bg-[#fafbfc] space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                PAYMENT HISTORY
              </span>

              {receipts.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No payment entries recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {receipts.map((rec) => (
                    <div
                      key={rec.name}
                      className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs hover:border-slate-300 transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{formatDate(rec.posting_date)}</p>
                        <p className="text-[11px] font-mono text-slate-400">
                          {rec.name} • {rec.transaction_reference || "Direct Bank Credit"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-900">
                          {rec.currency || currencyLabel} {Number(rec.amount_received).toLocaleString()}
                        </span>

                        <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          {rec.mode_of_payment || "Cash"}
                        </span>

                        <button
                          onClick={() => setActiveReceipt(rec)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                          title="View Receipt"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: GENERATE MONTHLY INVOICE */}
      {/* ========================================================================= */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Generate Monthly Invoice</h3>
                <p className="text-xs text-slate-500">Creates official ERPNext Sales Invoice for {student.student_name}</p>
              </div>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {invoiceSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {invoiceSuccess}
              </div>
            )}

            <form onSubmit={handleCreateMonthlyInvoice} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Month</label>
                  <select
                    value={monthName}
                    onChange={(e) => setMonthName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                  >
                    {billingMonths.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={invoiceDueDate}
                    onChange={(e) => setInvoiceDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                  />
                </div>
              </div>

              {/* Subject Hours Inputs */}
              <div className="space-y-2 pt-2">
                <label className="block font-semibold text-slate-700">Subject Hours & Hourly Rate</label>
                <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  {subjectHours.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Subject Name"
                        value={row.subject}
                        onChange={(e) => updateSubjectHourRow(idx, "subject", e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-slate-300 rounded bg-white text-xs"
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="Hrs"
                          value={row.hours}
                          onChange={(e) => updateSubjectHourRow(idx, "hours", Number(e.target.value))}
                          className="w-16 px-2 py-1.5 border border-slate-300 rounded bg-white text-xs text-center"
                        />
                        <span className="text-slate-400">classes @</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 font-semibold">{currencyLabel}</span>
                        <input
                          type="number"
                          placeholder="Rate"
                          value={row.rate}
                          onChange={(e) => updateSubjectHourRow(idx, "rate", Number(e.target.value))}
                          className="w-20 px-2 py-1.5 border border-slate-300 rounded bg-white text-xs text-center"
                        />
                      </div>
                      <div className="w-24 text-right font-bold text-slate-900">
                        {currencyLabel} {(row.hours * row.rate).toLocaleString()}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSubjectHourRow(idx)}
                        disabled={subjectHours.length <= 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-20 p-1"
                        title="Remove Subject"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={addSubjectHourRow}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Another Subject
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-slate-900 px-1 pt-1">
                  <span>Total Invoice Amount:</span>
                  <span className="text-sm text-emerald-600">
                    {currencyLabel} {subjectHours.reduce((acc, curr) => acc + (curr.hours * curr.rate), 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-900 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold flex items-center gap-2"
                >
                  {isGenerating ? "Creating Invoice..." : "Create & Post Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW PAYMENT RECEIPT */}
      {/* ========================================================================= */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Official Fee Receipt</h3>
                  <p className="text-[11px] font-mono text-slate-500">{activeReceipt.name}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveReceipt(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Student Name</span>
                <span className="font-semibold text-slate-900">{student.student_name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Receipt Date</span>
                <span className="font-medium text-slate-900">{formatDate(activeReceipt.posting_date)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Payment Mode</span>
                <span className="font-medium text-slate-900">{activeReceipt.mode_of_payment || "Bank Transfer"}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Transaction Reference / UTR</span>
                <span className="font-mono text-slate-800">{activeReceipt.transaction_reference || "—"}</span>
              </div>
              <div className="flex justify-between items-center py-1 pt-2">
                <span className="font-bold text-slate-900">Amount Received</span>
                <span className="text-base font-bold text-emerald-600">
                  {activeReceipt.currency || currencyLabel} {Number(activeReceipt.amount_received).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MARK PAYMENT / RECORD PAYMENT ENTRY */}
      {/* ========================================================================= */}
      {showPaymentModal && paymentTargetInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Record Payment</h3>
                  <p className="text-xs text-slate-500 font-mono">Invoice: {paymentTargetInvoice.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {paymentSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {paymentSuccessMsg}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Customer / Student</span>
                  <span className="font-semibold text-slate-900">{student.customer}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Invoice Grand Total</span>
                  <span className="font-semibold text-slate-900">
                    {currencyLabel} {Number(paymentTargetInvoice.grand_total).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Current Outstanding</span>
                  <span className="font-bold text-rose-600">
                    {currencyLabel} {Number(paymentTargetInvoice.outstanding_amount).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Amount Received ({currencyLabel}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={Number(paymentTargetInvoice.outstanding_amount) || Number(paymentTargetInvoice.grand_total)}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm font-bold text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Razorpay">Razorpay / Online</option>
                    <option value="Wire Transfer">Wire Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transaction Reference / UTR Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR18274619 or Receipt #"
                  value={paymentRefNo}
                  onChange={(e) => setPaymentRefNo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-900 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecordingPayment || paymentAmount <= 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  {isRecordingPayment ? "Posting to General Ledger..." : "Post Payment Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT STUDENT PROFILE MODAL */}
      {/* ========================================================================= */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Student Profile</h3>
                  <p className="text-xs text-slate-500">
                    Update personal, guardian contact, and academic details for {student?.student_name}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{editSuccessMsg}</span>
              </div>
            )}

            {editErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{editErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="space-y-4">
              {/* Section 1: Personal & Contact Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal & Contact Info</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Student Full Name *</label>
                    <input
                      id="input-student-name"
                      type="text"
                      required
                      value={editFormData.student_name}
                      onChange={(e) => setEditFormData({ ...editFormData, student_name: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-900 focus:outline-blue-600 focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian / Parent Name</label>
                    <input
                      id="input-guardian-name"
                      type="text"
                      placeholder="e.g. Thomas Mathew"
                      value={editFormData.guardian_name}
                      onChange={(e) => setEditFormData({ ...editFormData, guardian_name: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-900 focus:outline-blue-600 focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Phone / WhatsApp</label>
                    <input
                      id="input-guardian-phone"
                      type="text"
                      placeholder="e.g. +965 98765432"
                      value={editFormData.guardian_phone}
                      onChange={(e) => setEditFormData({ ...editFormData, guardian_phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono font-medium text-slate-900 focus:outline-blue-600 focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Email</label>
                    <input
                      id="input-guardian-email"
                      type="email"
                      placeholder="e.g. parent@example.com"
                      value={editFormData.guardian_email}
                      onChange={(e) => setEditFormData({ ...editFormData, guardian_email: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-900 focus:outline-blue-600 focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Location, Billing & Status */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Location & Billing</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Country / Region</label>
                    <select
                      value={editFormData.country}
                      onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-blue-600"
                    >
                      <option value="India">India</option>
                      <option value="Kuwait">Kuwait</option>
                      <option value="United Arab Emirates">United Arab Emirates</option>
                      <option value="Qatar">Qatar</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="Oman">Oman</option>
                      <option value="Bahrain">Bahrain</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Currency</label>
                    <select
                      value={editFormData.billing_currency}
                      onChange={(e) => setEditFormData({ ...editFormData, billing_currency: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold text-slate-900 focus:outline-blue-600"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="KWD">KWD (KD)</option>
                      <option value="AED">AED (AED)</option>
                      <option value="QAR">QAR (QR)</option>
                      <option value="SAR">SAR (SR)</option>
                      <option value="OMR">OMR (RO)</option>
                      <option value="BHD">BHD (BD)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Date</label>
                    <input
                      type="date"
                      value={editFormData.admission_date}
                      onChange={(e) => setEditFormData({ ...editFormData, admission_date: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-900 focus:outline-blue-600"
                    >
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Academic Placement */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Placement</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Class / Grade Level</label>
                    <select
                      value={editFormData.class_level}
                      onChange={(e) => setEditFormData({ ...editFormData, class_level: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-blue-600"
                    >
                      <option value="8th">8th (Class 8)</option>
                      <option value="9th">9th (Class 9)</option>
                      <option value="10th">10th (Class 10)</option>
                      <option value="+1">+1 (Class 11)</option>
                      <option value="+2">+2 (Class 12)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Format</label>
                    <select
                      value={editFormData.delivery_mode}
                      onChange={(e) => setEditFormData({ ...editFormData, delivery_mode: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-blue-600"
                    >
                      <option value="1:1 Tutoring">1:1 Tutoring</option>
                      <option value="1:3 Group">1:3 Group</option>
                      <option value="Micro Batch">Micro Batch</option>
                      <option value="Batch Cohort">Batch Cohort</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Course Type</label>
                    <select
                      value={editFormData.course_type}
                      onChange={(e) => setEditFormData({ ...editFormData, course_type: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-blue-600"
                    >
                      <option value="Regular">Regular</option>
                      <option value="Crash Course">Crash Course</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSavingEdit}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-student-changes"
                  type="submit"
                  disabled={isSavingEdit || !editFormData.student_name.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {isSavingEdit ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving to Frappe Cloud...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

