/**
 * SmartUp Online ERP — Provisioning Script for Frappe Cloud
 * Creates the complete Custom DocType suite on smartupedu.frappe.cloud
 */

const https = require('https');

const HOST = 'smartupedu.frappe.cloud';
const AUTH_HEADER = 'token 39f71c6530cd462:064f8d6fb2fb0bc';

function apiRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: HOST,
      path: path,
      method: method,
      headers: {
        'Authorization': AUTH_HEADER,
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: responseBody });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

const docTypes = [
  // 1. Child Table: SmartUp Subject Allocation
  {
    doctype: 'DocType',
    name: 'SmartUp Subject Allocation',
    module: 'Custom',
    custom: 1,
    istable: 1,
    editable_grid: 1,
    fields: [
      { fieldname: 'subject', label: 'Subject', fieldtype: 'Data', in_list_view: 1, reqd: 1 },
      { fieldname: 'monthly_hours', label: 'Monthly Hours', fieldtype: 'Float', in_list_view: 1, reqd: 1 },
      { fieldname: 'hourly_rate', label: 'Hourly Rate', fieldtype: 'Currency', in_list_view: 1, reqd: 1 },
      { fieldname: 'monthly_subtotal', label: 'Monthly Subtotal', fieldtype: 'Currency', in_list_view: 1, read_only: 1 }
    ]
  },

  // 2. Child Table: SmartUp Instalment Schedule
  {
    doctype: 'DocType',
    name: 'SmartUp Instalment Schedule',
    module: 'Custom',
    custom: 1,
    istable: 1,
    editable_grid: 1,
    fields: [
      { fieldname: 'instalment_number', label: 'Instalment #', fieldtype: 'Int', in_list_view: 1, reqd: 1 },
      { fieldname: 'due_date', label: 'Due Date', fieldtype: 'Date', in_list_view: 1, reqd: 1 },
      { fieldname: 'amount_due', label: 'Amount Due', fieldtype: 'Currency', in_list_view: 1, reqd: 1 },
      { fieldname: 'amount_paid', label: 'Amount Paid', fieldtype: 'Currency', in_list_view: 1, default: '0' },
      { fieldname: 'outstanding_balance', label: 'Outstanding Balance', fieldtype: 'Currency', in_list_view: 1, read_only: 1 },
      { fieldname: 'status', label: 'Status', fieldtype: 'Select', options: 'Pending\nPart Paid\nPaid\nOverdue\nWaived', in_list_view: 1, default: 'Pending' },
      { fieldname: 'overdue_days', label: 'Overdue Days', fieldtype: 'Int', in_list_view: 0, default: '0' }
    ]
  },

  // 3. Child Table: SmartUp Batch Enrollment (inside Student)
  {
    doctype: 'DocType',
    name: 'SmartUp Batch Enrollment',
    module: 'Custom',
    custom: 1,
    istable: 1,
    editable_grid: 1,
    fields: [
      { fieldname: 'batch', label: 'Batch', fieldtype: 'Link', options: 'SmartUp Batch', in_list_view: 1, reqd: 1 },
      { fieldname: 'enrolled_date', label: 'Enrolled Date', fieldtype: 'Date', in_list_view: 1 },
      { fieldname: 'status', label: 'Status', fieldtype: 'Select', options: 'Active\nCompleted\nDropped', in_list_view: 1, default: 'Active' }
    ]
  },

  // 4. SmartUp Batch
  {
    doctype: 'DocType',
    name: 'SmartUp Batch',
    module: 'Custom',
    custom: 1,
    autoname: 'field:batch_name',
    track_changes: 1,
    fields: [
      { fieldname: 'batch_name', label: 'Batch Name', fieldtype: 'Data', reqd: 1, unique: 1 },
      { fieldname: 'program', label: 'Program', fieldtype: 'Link', options: 'SmartUp Program', reqd: 1, in_list_view: 1 },
      { fieldname: 'class_level', label: 'Class / Grade', fieldtype: 'Select', options: 'Class 8\nClass 9\nClass 10\nClass 11\nClass 12', reqd: 1, in_list_view: 1 },
      { fieldname: 'course_type', label: 'Course Type', fieldtype: 'Select', options: '1:1 Tutoring\n1:3 Group\nMicro Batch\nRegular\nCrash Course', reqd: 1, in_list_view: 1 },
      { fieldname: 'delivery_mode', label: 'Delivery Mode', fieldtype: 'Select', options: 'Online Live\nOffline Physical Centre\nHybrid', default: 'Online Live' },
      { fieldname: 'centre', label: 'Centre / Branch', fieldtype: 'Data', default: 'Online' },
      { fieldname: 'is_active', label: 'Is Active', fieldtype: 'Check', default: '1' }
    ],
    permissions: [{ role: 'System Manager', read: 1, write: 1, create: 1, delete: 1 }]
  },

  // 5. SmartUp Student
  {
    doctype: 'DocType',
    name: 'SmartUp Student',
    module: 'Custom',
    custom: 1,
    track_changes: 1,
    fields: [
      { fieldname: 'student_name', label: 'Student Name', fieldtype: 'Data', reqd: 1, in_list_view: 1 },
      { fieldname: 'guardian_name', label: 'Guardian Name', fieldtype: 'Data', in_list_view: 1 },
      { fieldname: 'guardian_phone', label: 'Guardian Phone', fieldtype: 'Data', in_list_view: 1 },
      { fieldname: 'guardian_email', label: 'Guardian Email', fieldtype: 'Data' },
      { fieldname: 'country', label: 'Country / Region', fieldtype: 'Link', options: 'Country', default: 'India' },
      { fieldname: 'billing_currency', label: 'Billing Currency', fieldtype: 'Link', options: 'Currency', default: 'INR' },
      { fieldname: 'admission_date', label: 'Admission Date', fieldtype: 'Date' },
      { fieldname: 'status', label: 'Status', fieldtype: 'Select', options: 'Active\nSuspended\nCompleted\nCancelled', default: 'Active', in_list_view: 1 },
      { fieldname: 'customer', label: 'Linked ERPNext Customer', fieldtype: 'Link', options: 'Customer' },
      { fieldname: 'enrolled_batches', label: 'Enrolled Batches', fieldtype: 'Table', options: 'SmartUp Batch Enrollment' }
    ],
    permissions: [{ role: 'System Manager', read: 1, write: 1, create: 1, delete: 1 }]
  },

  // 6. SmartUp Fee Ledger
  {
    doctype: 'DocType',
    name: 'SmartUp Fee Ledger',
    module: 'Custom',
    custom: 1,
    track_changes: 1,
    fields: [
      { fieldname: 'student', label: 'Student', fieldtype: 'Link', options: 'SmartUp Student', reqd: 1, in_list_view: 1 },
      { fieldname: 'batch', label: 'Batch', fieldtype: 'Link', options: 'SmartUp Batch', reqd: 1, in_list_view: 1 },
      { fieldname: 'academic_year', label: 'Academic Year', fieldtype: 'Data', default: '2026-2027' },
      { fieldname: 'billing_mode', label: 'Billing Mode', fieldtype: 'Select', options: 'Hourly Sessions (1:1 / 1:3)\nFixed Instalments (Micro / Regular)', default: 'Fixed Instalments (Micro / Regular)', in_list_view: 1 },
      { fieldname: 'currency', label: 'Currency', fieldtype: 'Link', options: 'Currency', default: 'INR' },
      { fieldname: 'gross_fee', label: 'Gross Fee', fieldtype: 'Currency', reqd: 1 },
      { fieldname: 'discount_amount', label: 'Discount Amount', fieldtype: 'Currency', default: '0' },
      { fieldname: 'net_payable', label: 'Net Payable', fieldtype: 'Currency', read_only: 1, in_list_view: 1 },
      { fieldname: 'total_collected', label: 'Total Collected', fieldtype: 'Currency', read_only: 1, in_list_view: 1, default: '0' },
      { fieldname: 'pending_balance', label: 'Pending Balance', fieldtype: 'Currency', read_only: 1, in_list_view: 1 },
      { fieldname: 'due_till_date', label: 'Due Till Date', fieldtype: 'Currency', read_only: 1 },
      { fieldname: 'overdue_amount', label: 'Overdue Amount', fieldtype: 'Currency', read_only: 1 },
      { fieldname: 'advance_credit_amount', label: 'Advance / Credit Balance', fieldtype: 'Currency', read_only: 1, default: '0' },
      { fieldname: 'fee_status', label: 'Fee Status', fieldtype: 'Select', options: 'Paid\nPart Paid\nDue Soon\nOverdue\nCredit', default: 'Due Soon', in_list_view: 1 },
      { fieldname: 'subject_allocations', label: 'Subject Allocations (1:1 / 1:3)', fieldtype: 'Table', options: 'SmartUp Subject Allocation' },
      { fieldname: 'instalments', label: 'Instalment Schedule', fieldtype: 'Table', options: 'SmartUp Instalment Schedule' }
    ],
    permissions: [{ role: 'System Manager', read: 1, write: 1, create: 1, delete: 1 }]
  },

  // 7. SmartUp Fee Receipt
  {
    doctype: 'DocType',
    name: 'SmartUp Fee Receipt',
    module: 'Custom',
    custom: 1,
    autoname: 'naming_series:',
    track_changes: 1,
    fields: [
      { fieldname: 'naming_series', label: 'Naming Series', fieldtype: 'Select', options: 'SU-REC-.YYYY.-.#####', reqd: 1, default: 'SU-REC-.YYYY.-.#####' },
      { fieldname: 'student', label: 'Student', fieldtype: 'Link', options: 'SmartUp Student', reqd: 1, in_list_view: 1 },
      { fieldname: 'fee_ledger', label: 'Fee Ledger', fieldtype: 'Link', options: 'SmartUp Fee Ledger', reqd: 1 },
      { fieldname: 'posting_date', label: 'Posting Date', fieldtype: 'Date', reqd: 1, in_list_view: 1 },
      { fieldname: 'amount_received', label: 'Amount Received', fieldtype: 'Currency', reqd: 1, in_list_view: 1 },
      { fieldname: 'currency', label: 'Currency', fieldtype: 'Link', options: 'Currency', default: 'INR' },
      { fieldname: 'mode_of_payment', label: 'Payment Mode', fieldtype: 'Select', options: 'Bank Transfer\nUPI\nStripe\nCash\nCheque\nCard', default: 'Bank Transfer', in_list_view: 1 },
      { fieldname: 'transaction_reference', label: 'Transaction Ref / UTR', fieldtype: 'Data', unique: 1 },
      { fieldname: 'payment_status', label: 'Payment Status', fieldtype: 'Select', options: 'Successful\nPending Verification\nFailed\nReversed', default: 'Successful' },
      { fieldname: 'collected_by', label: 'Collected By', fieldtype: 'Link', options: 'User' },
      { fieldname: 'remarks', label: 'Remarks', fieldtype: 'Small Text' }
    ],
    permissions: [{ role: 'System Manager', read: 1, write: 1, create: 1, delete: 1 }]
  },

  // 8. SmartUp Faculty
  {
    doctype: 'DocType',
    name: 'SmartUp Faculty',
    module: 'Custom',
    custom: 1,
    track_changes: 1,
    fields: [
      { fieldname: 'faculty_name', label: 'Faculty Name', fieldtype: 'Data', reqd: 1, in_list_view: 1 },
      { fieldname: 'faculty_type', label: 'Type', fieldtype: 'Select', options: 'Full Time\nContractor\nHourly Tutor', default: 'Hourly Tutor', in_list_view: 1 },
      { fieldname: 'email', label: 'Email', fieldtype: 'Data' },
      { fieldname: 'phone', label: 'Phone', fieldtype: 'Data' },
      { fieldname: 'primary_subjects', label: 'Primary Subjects', fieldtype: 'Small Text', in_list_view: 1 },
      { fieldname: 'hourly_pay_rate', label: 'Hourly Pay Rate', fieldtype: 'Currency', default: '0' },
      { fieldname: 'status', label: 'Status', fieldtype: 'Select', options: 'Active\nOn Leave\nInactive', default: 'Active', in_list_view: 1 }
    ],
    permissions: [{ role: 'System Manager', read: 1, write: 1, create: 1, delete: 1 }]
  },

  // 9. SmartUp Live Session
  {
    doctype: 'DocType',
    name: 'SmartUp Live Session',
    module: 'Custom',
    custom: 1,
    track_changes: 1,
    fields: [
      { fieldname: 'session_title', label: 'Session Title', fieldtype: 'Data', reqd: 1, in_list_view: 1 },
      { fieldname: 'batch', label: 'Batch', fieldtype: 'Link', options: 'SmartUp Batch', reqd: 1, in_list_view: 1 },
      { fieldname: 'faculty', label: 'Faculty', fieldtype: 'Link', options: 'SmartUp Faculty', reqd: 1, in_list_view: 1 },
      { fieldname: 'subject', label: 'Subject', fieldtype: 'Data', in_list_view: 1 },
      { fieldname: 'session_datetime', label: 'Session Date & Time', fieldtype: 'Datetime', reqd: 1, in_list_view: 1 },
      { fieldname: 'duration_minutes', label: 'Duration (Minutes)', fieldtype: 'Int', default: '60' },
      { fieldname: 'meeting_url', label: 'Meeting URL', fieldtype: 'Data' },
      { fieldname: 'recording_url', label: 'Recording URL', fieldtype: 'Data' },
      { fieldname: 'status', label: 'Status', fieldtype: 'Select', options: 'Scheduled\nIn Progress\nCompleted\nCancelled', default: 'Scheduled', in_list_view: 1 }
    ],
    permissions: [{ role: 'System Manager', read: 1, write: 1, create: 1, delete: 1 }]
  },

  // 10. SmartUp Portion Tracker
  {
    doctype: 'DocType',
    name: 'SmartUp Portion Tracker',
    module: 'Custom',
    custom: 1,
    track_changes: 1,
    fields: [
      { fieldname: 'batch', label: 'Batch', fieldtype: 'Link', options: 'SmartUp Batch', reqd: 1, in_list_view: 1 },
      { fieldname: 'subject', label: 'Subject', fieldtype: 'Data', reqd: 1, in_list_view: 1 },
      { fieldname: 'chapter_name', label: 'Chapter / Unit', fieldtype: 'Data', reqd: 1, in_list_view: 1 },
      { fieldname: 'total_estimated_hours', label: 'Estimated Hours', fieldtype: 'Float', default: '10' },
      { fieldname: 'completed_hours', label: 'Completed Hours', fieldtype: 'Float', default: '0' },
      { fieldname: 'completion_percentage', label: 'Completion %', fieldtype: 'Percent', default: '0', in_list_view: 1 },
      { fieldname: 'status', label: 'Status', fieldtype: 'Select', options: 'Not Started\nIn Progress\nCompleted\nRevision', default: 'Not Started', in_list_view: 1 }
    ],
    permissions: [{ role: 'System Manager', read: 1, write: 1, create: 1, delete: 1 }]
  }
];

async function main() {
  console.log(`Starting DocType provisioning on ${HOST}...`);
  for (const dt of docTypes) {
    process.stdout.write(`Provisioning "${dt.name}"... `);
    try {
      // Check if exists
      const checkRes = await apiRequest(`/api/resource/DocType/${encodeURIComponent(dt.name)}`, 'GET');
      if (checkRes.status === 200) {
        console.log(`[ALREADY EXISTS]`);
        continue;
      }
      
      const createRes = await apiRequest('/api/resource/DocType', 'POST', dt);
      if (createRes.status === 200) {
        console.log(`[SUCCESS]`);
      } else {
        console.log(`[FAILED] Code: ${createRes.status}`);
        console.error(JSON.stringify(createRes.body || createRes.raw));
      }
    } catch (err) {
      console.log(`[ERROR] ${err.message}`);
    }
  }
  console.log('Provisioning run completed.');
}

main();
