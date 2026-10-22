export type OnlineDivision =
  | "SmartUp Online Kerala"
  | "SmartUp GCC Online"
  | "SmartUp Crash Course"
  | "SmartUp Foundation";

export type TimezoneZone = "IST (UTC+5:30)" | "GST (UTC+4:00)" | "AST (UTC+3:00)";

export interface Student {
  name: string; // Frappe ID
  first_name: string;
  last_name?: string;
  student_email_id?: string;
  student_mobile_number?: string;
  division?: OnlineDivision;
  program?: string;
  batch?: string;
  timezone?: string;
  admission_date?: string;
  status: "Active" | "Inactive" | "Suspended" | "Pending KYC";
  fee_status?: "Paid" | "Partially Paid" | "Overdue";
  total_outstanding?: number;
}

export interface OnlineBatch {
  name: string;
  batch_name: string;
  division: OnlineDivision;
  program: string;
  academic_year: string;
  instructor_name?: string;
  meeting_platform: "Zoom" | "Google Meet" | "LiveKit" | "Microsoft Teams";
  meeting_link?: string;
  start_date?: string;
  end_date?: string;
  active_students_count: number;
  status: "Active" | "Upcoming" | "Completed";
  timezone: string;
}

export interface LiveClassSession {
  id: string;
  title: string;
  batch_id: string;
  batch_name: string;
  division: OnlineDivision;
  instructor_name: string;
  start_time: string; // ISO string or time format
  end_time: string;
  date: string;
  meeting_platform: "Zoom" | "Google Meet" | "LiveKit";
  meeting_link: string;
  status: "Live Now" | "Upcoming" | "Completed" | "Cancelled";
  recording_url?: string;
  attendance_marked?: boolean;
}

export interface FeeInvoice {
  name: string;
  student: string;
  student_name: string;
  division: OnlineDivision;
  grand_total: number;
  outstanding_amount: number;
  status: "Paid" | "Unpaid" | "Partially Paid" | "Overdue";
  due_date: string;
  currency: "INR" | "AED" | "SAR";
}

export interface AssessmentRecord {
  id: string;
  title: string;
  program: string;
  batch_name: string;
  due_date: string;
  total_marks: number;
  submitted_count: number;
  total_students: number;
  status: "Open" | "Grading" | "Completed";
}

export interface ExecutiveStats {
  totalStudents: number;
  activeBatches: number;
  liveClassesToday: number;
  totalCollectionsMonth: number;
  pendingDues: number;
  avgAttendanceRate: number;
  gccEnrollmentsRatio: number;
}
