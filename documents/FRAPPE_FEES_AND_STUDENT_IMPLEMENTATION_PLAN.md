# SmartUp Education ERP — Fees Module & Student Data Frappe Implementation Plan

**Document Version:** 1.0  
**Date:** October 16, 2026  
**Status:** Architectural Specification & Implementation Blueprint (Draft for Approval)  
**Target Environment:** Frappe Cloud (`https://smartupedu.frappe.cloud`) & Next.js 16 Frontend (`smartup-online-erp`)  
**Strict Policy Note:** *Design & planning phase only. No database modifications or deletions are executed until explicit user confirmation.*

---

## 1. Executive Summary & Context

SmartUp Education requires a centralised, drill-down **Fees Management Module** to manage all academic fees, payments, dues, instalments, and financial reporting across physical and online educational programs.

This implementation plan synthesises and addresses two critical resources:
1. **Directors' Scope of Work (`Smart_Up_ERP_Fees_Module_Developer_Scope.pdf`)**:
   - Multi-tier drill-down hierarchy: `Organisation` → `Segment` → `Class` → `Course/Batch Type` → `Student List & Fee Ledger`.
   - Real-time KPI summaries: Total Students, Total Fees (Net Payable), Total Collected, Pending Balance, Due Till Date, and Overdue Count.
   - Financial workflows: Full/part/instalment collections, unique receipt generation, advance/credit handling, immutable financial audit trail (no hard deletes), reminder policies, and multi-currency reporting (INR and GCC currencies).
2. **Manual Excel Student Dataset (`1 TO 1,3 & MICRO - STUDENTS DATA-2026-27.xlsx`)**:
   - Contains live 2026-27 academic year data across three core delivery formats:
     - **1:1 (One-to-One Private Tutoring)**: Subject-wise monthly hours, hourly rates (₹750 - ₹1,000/hr), advance fees, monthly fees, expected revenue till date, collected amounts, and dues across GCC regions (Qatar, Kuwait, Oman, Sharjah, Riyadh, Saudi Arabia).
     - **1:3 (Small Group Batches)**: Hourly rates (₹400 - ₹600/hr), monthly hours committed, annual contract amounts, monthly fees, and payment tracking.
     - **Micro Batches**: Fixed package pricing (₹14,000 - ₹28,000), 5-instalment and 10-instalment payment plans, expected collections till October, collected sums, and outstanding balances.
   - Audit findings: 34 named student records, 80+ numbered placeholder/seat allocation entries, multi-row subject allocations, and Excel serial date stamps (46139–46297 representing April–October 2026).

---

## 2. Frappe Backend Audit & Architectural Strategy

### 2.1 Current State of `smartupedu.frappe.cloud`
A read-only API inspection of the live Frappe Cloud site reveals:
- **Core ERPNext is Active**: Company `SMART UP` is configured; `Accounts` module (`Sales Invoice`, `Payment Entry`, `Customer`, `Company`) is operational.
- **Education Module is NOT yet installed/enabled**: DocTypes `Student`, `Program`, `Course`, `Fee Structure`, `Fee Schedule`, and `Fees` return `404 Not Found`.

### 2.2 Dual-Track Implementation Decision

| Option | Architecture | Pros | Cons | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Option A**<br>*Standard Frappe Education App* | Install `frappe/education` app from Frappe Cloud Marketplace. | Uses standard Frappe doctypes (`Student`, `Program Enrollment`, `Fee Structure`, `Fees`). | Rigid fee collection model; lacks native 1:1 subject-hour billing, multi-currency GCC drilldown, and custom hierarchy without heavy overrides. | **Partial / Base**: Excellent for core `Student` & `Program Enrollment`. |
| **Option B**<br>*Custom ERPNext Financial Flow* | Use ERPNext `Customer`, `Sales Invoice`, and `Payment Entry` directly. | Native double-entry general ledger, multi-currency support, payment reconciliation. | Not student-friendly; lacks academic drill-down, instalment schedules, and class/batch hierarchy. | **Backend Ledger Integration**: Invoices generated behind the scenes. |
| **Option C (Recommended)**<br>**SmartUp Hybrid Education & Fees Architecture** | **Deploy a bespoke `smartup_fees` custom app** (or custom DocTypes in Frappe Desk) linked directly to standard ERPNext Accounts (`Customer`, `Sales Invoice`, `Payment Entry`). | **100% exact alignment with Directors' Scope**: Native drilldown hierarchy, dynamic 1:1 hourly and Micro instalment models, automated receipt numbering, instant KPI roll-ups, and immutable audit logs. | Requires initial DocType schema creation and server scripts. | **STRONGLY RECOMMENDED** |

---

## 3. Directors' Hierarchy & Calculation Business Rules

### 3.1 Five-Level Drill-Down Hierarchy

```
[Level 0] Fees Overview (All Products / All Centres)
   │  └── Metrics: Total Students, Total Fees, Collected, Pending, Due Till Date, Overdue Count
   │
   ├── [Level 1] Segment: State
   │      ├── [Level 2] Class: 8, 9, 10, 11, 12
   │      │      ├── [Level 3] Course Type: Regular / Crash
   │      │      │      └── [Level 4] Batches: Batch A, Batch B... → Student List & Ledger
   │
   ├── [Level 1] Segment: CBSE Kerala
   │      ├── [Level 2] Class: 8, 9, 10, 11, 12
   │      │      └── [Level 3] Course Type: 1:1 / 1:3 / Micro Batch → Student List & Ledger
   │
   ├── [Level 1] Segment: CBSE GCC
   │      ├── [Level 2] Class: 8, 9, 10, 11, 12
   │      │      └── [Level 3] Course Type: 1:1 / 1:3 / Micro Batch (Multi-Currency) → Student List & Ledger
   │
   └── [Level 1] Segment: CBSE GCC Offline
          ├── [Level 2] Class: 8, 9, 10, 11, 12
          │      └── [Level 3] Configurable Course/Batch Types → Student List & Ledger
```

### 3.2 Formal Mathematical KPI Definitions

Every level in the hierarchy (Level 0 through Level 4) must strictly compute and reconcile the following metrics:

1. **Total Students ($S_{active}$)**:
   $$\text{Total Students} = \text{Count of distinct active enrolments matching filter}$$
   *Rule: Cancelled/withdrawn students are excluded from the active count but retained in historical ledger.*

2. **Total Fees ($F_{net}$)**:
   $$F_{net} = \sum (\text{Gross Fee} - \text{Approved Discounts/Scholarships} + \text{Approved Additional Charges})$$

3. **Total Collected ($C_{net}$)**:
   $$C_{net} = \sum (\text{Successful Posted Payments} - \text{Approved Refunds/Reversals})$$
   *Rule: Pending or failed payment gateway attempts are strictly excluded.*

4. **Pending Balance ($B_{pending}$)**:
   $$B_{pending} = \max(0, F_{net} - C_{net})$$
   *Rule: If $C_{net} > F_{net}$, the excess is classified and displayed separately as `Student Advance/Credit`.*

5. **Due Till Date ($D_{as\_of}$)**:
   $$D_{as\_of} = \sum_{due\_date \le as\_of} (\text{Instalment Amount Due}) - \sum (\text{Payments Allocated to these Instalments})$$
   *Rule: Future instalments ($due\_date > as\_of$) are excluded from Due Till Date.*

6. **Overdue Students ($N_{overdue}$) & Overdue Amount ($A_{overdue}$)**:
   $$A_{overdue} = \sum_{due\_date < (as\_of - grace\_period)} (\text{Unpaid Instalment Balance})$$
   *Rule: Categorised into standard ageing buckets: 0–7 days, 8–15 days, 16–30 days, and >30 days.*

7. **Multi-Currency Reconciliation**:
   - Currency totals are maintained per ISO currency (`INR`, `AED`, `SAR`, `QAR`, `KWD`, `OMR`).
   - Dashboard rollup converts using explicitly configured system exchange rates for consolidated reporting, never silently mixing numeric amounts.

---

## 4. Deep Audit of Excel Student Data (`2026-27.xlsx`)

The file `1 TO 1,3 & MICRO - STUDENTS DATA-2026-27.xlsx` contains 4 worksheets representing the 2026-27 operational dataset:

### 4.1 Sheet 1: `11` (1:1 One-to-One Private Tutoring)
- **Nature of Service**: High-touch, private 1-on-1 coaching customized by subject hours and hourly rate.
- **Data Model Discovered**:
  - `Col A`: Serial Number (1 to 46+).
  - `Col B`: Student Name (e.g., *Rehan Mehrin*, *Shahid Muhammed*, *Arsha Maria Abhilash*).
  - `Col C`: GCC Country / Centre (e.g., *Qatar*, *Kuwait*, *Oman*, *Sharjah*, *Riyadh*, *Saudi Arabia*).
  - `Col D`: Committed Months or Contract Duration (e.g., 6, 8, 12, 18 months).
  - `Col E`: Grade / Class (8, 9, 10, 11, 12).
  - `Col F`: Admission / Start Date (Excel serial date, e.g., `46141` = 29-Apr-2026).
  - `Col H`: Hours allocated per month per subject (multiple rows per student, e.g., Math: 6 hrs, Physics: 6 hrs, Chemistry: 8 hrs $\rightarrow$ 20 hrs/month).
  - `Col I`: Hourly Rate (e.g., ₹750, ₹800, ₹850, ₹900, ₹1,000/hr).
  - `Col J`: Total Contract / Annual Fee.
  - `Col K`: Advance Fee paid at admission.
  - `Col L`: Fee Paid / Receipts.
  - `Col O`: **Monthly Fee Calculation**: Formula `=SUM(H2:H4*I2)`.
  - `Col P`: **Expected Fee Till Date**: Formula `=Monthly Fee * Months Elapsed`.
  - `Col Q`: **Total Collected**: Formula `=SUM(L)`.
  - `Col S`: **Balance Due Till Date**: Formula `=P - Q`.

### 4.2 Sheet 2: `13` (1:3 Small Group Batches)
- **Nature of Service**: Small group tutoring (up to 3 students per batch).
- **Data Model Discovered**:
  - `Col B`: Student Name (e.g., *Nova Ann Biji*, *Midhulesh*, *Brayden Anil*, *Raihan Muhammed A S*, *IZAAN SHAFEEK*, *Shyzal Mohammed*).
  - `Col C`: Grade / Class (8, 9, 10, 11, 12).
  - `Col D`: Start Date (Excel serial date, e.g., `46220` = 17-Jul-2026).
  - `Col F`: Group Hourly Rate (₹400, ₹425, ₹500, ₹550, ₹600/hr).
  - `Col G`: Monthly Hours (10, 12, 18 hrs).
  - `Col H`: Total Annual Fee (e.g., ₹66,000, ₹81,600).
  - `Col J`: Collected Amount.
  - `Col M`: Monthly Fee (`Col F * Col G`, e.g., ₹6,600/mo).
  - `Col N`: Expected Fee Till Date (e.g., ₹19,800).
  - `Col O`: Total Paid.
  - `Col Q`: Pending Balance (`=N - O`).

### 4.3 Sheet 3: `Micro` (Micro Batches)
- **Nature of Service**: Structured cohort learning with fixed syllabus and defined instalment milestones.
- **Data Model Discovered**:
  - `Col B`: Student Name (e.g., *Aamina*, *Aadhya Binoi*, *Nathania Jibin*, *Gouri Nanda D. S*, *Aadhil Awam*, *Muhammed Sinan*, *Alvina Paulachan*, *Isna Iqbal*).
  - `Col C`: Grade / Class (8, 9, 10, 11, 12).
  - `Col D`: Enrollment Date (Excel serial date, e.g., `46139` = 27-Apr-2026).
  - `Col F`: Fixed Course Fee (₹14,000, ₹15,000, ₹20,000, ₹22,500, ₹24,000, ₹28,000).
  - `Col G`: Collected Fee Till Date.
  - `Col I`: 5-Instalment Plan Formula `=SUM(F/5)` (e.g., ₹4,800 or ₹5,600 per instalment).
  - `Col J`: 10-Instalment Plan Formula `=SUM(F/10)` (e.g., ₹2,400 or ₹2,800 per month).
  - `Col K`: **Expected Income Till October**: Formula `=SUM(J*6)` (6 months elapsed).
  - `Col L`: Total Expected Fee for Year `=SUM(I*5)`.
  - `Col M`: Total Collected Till Date `=SUM(G)`.
  - `Col O`: **Pending Due Till Date**: Formula `=SUM(L - M)`.

### 4.4 Data Cleaning & Pre-Migration Rules
1. **Student Name Deduplication & Reconciliation**: 34 records have populated student names; 80+ rows represent unallocated seat quotas or pending admission leads. *Rule: Only validated admissions with verified names and contact records will be imported as active Students. Unassigned rows will be saved to an admission pipeline / lead staging table.*
2. **Date Normalisation**: Excel dates are serial integers. System converter:
   $$\text{Date} = \text{new Date}((serial - 25569) \times 86400 \times 1000)$$
3. **Multi-Row Subject Aggregation**: 1:1 private tutoring records spanning multiple rows for different subject hours must be aggregated into child table `SmartUp Student Subject Allocation`.
4. **Currency Mapping**: Students with GCC locations (Qatar, Kuwait, Oman, UAE/Sharjah, Saudi Arabia) must have their home currency set accordingly, with INR exchange rates pinned at contract date.

---

## 5. Frappe DocType & Schema Design

To fulfill both the Directors' Scope and the Excel operational structures without hacking standard ERPNext tables, we define the following clean DocType suite in Frappe.

```
┌────────────────────────────────────────────────────────┐
│                   SmartUp Program                      │
│ (State / CBSE Kerala / CBSE GCC / CBSE GCC Offline)    │
└──────────────────────────┬─────────────────────────────┘
                           │ 1:N
┌──────────────────────────▼─────────────────────────────┐
│                    SmartUp Batch                       │
│ (Class: 8-12 | Course Type: 1:1, 1:3, Micro, Regular)  │
└──────────────────────────┬─────────────────────────────┘
                           │ 1:N
┌──────────────────────────▼─────────────────────────────┐
│                  SmartUp Student                       │
│ (Name, Guardian, Contact, Country, Currency, Customer) │
└─────────┬────────────────────────────────────┬─────────┘
          │ 1:1                                │ 1:N
┌─────────▼──────────────────────────┐  ┌──────▼──────────────────────────┐
│        SmartUp Fee Ledger          │  │     SmartUp Fee Receipt         │
│ - Gross Assigned Fee               │  │ - Unique Receipt #              │
│ - Approved Discount / Scholarship  │  │ - Payment Date & Mode           │
│ - Net Payable                      │  │ - Transaction Reference #       │
│ - Net Collected                    │  │ - Amount & Currency             │
│ - Total Pending Balance            │  │ - Collector / Counsellor        │
│ - Due Till Date                    │  │ - Allocations to Instalments    │
│ - Overdue Amount & Overdue Days    │  └─────────────────────────────────┘
│ - Advance / Student Credit         │
│                                    │
│ [Child: Instalment Schedule]       │
│   • Instalment # (1..N)            │
│   • Due Date                       │
│   • Amount Due                     │
│   • Amount Paid                    │
│   • Balance                        │
│   • Status (Paid/Part/Overdue)     │
│                                    │
│ [Child: Subject Allocation (1:1)]  │
│   • Subject Name                   │
│   • Monthly Hours                  │
│   • Hourly Rate                    │
│   • Monthly Subtotal               │
└────────────────────────────────────┘
```

### 5.1 DocType Specifications

#### 1. `SmartUp Program`
- `program_name` (Data, Unique): "State", "CBSE Kerala", "CBSE GCC", "CBSE GCC Offline".
- `academic_year` (Link: `Academic Year`): "2026-2027".
- `default_currency` (Link: `Currency`): "INR", "AED", "SAR", "QAR", "KWD", "OMR".
- `is_active` (Check): 1.

#### 2. `SmartUp Batch`
- `batch_name` (Data): "CBSE Kerala - Class 10 - Micro Batch A".
- `program` (Link: `SmartUp Program`).
- `class_level` (Select): "Class 8", "Class 9", "Class 10", "Class 11", "Class 12".
- `course_type` (Select): "1:1 Tutoring", "1:3 Group", "Micro Batch", "Regular", "Crash Course".
- `delivery_mode` (Select): "Online", "Offline Physical Centre", "Hybrid".
- `centre` (Link: `Cost Center` / `Branch`): "Online", "Kadavanthara", "Edappally", etc.

#### 3. `SmartUp Student` (or Core `Student` with Custom Fields)
- `student_name` (Data): Full name.
- `first_name`, `last_name` (Data).
- `guardian_name`, `guardian_phone`, `guardian_email` (Data).
- `country` (Link: `Country`): India, Qatar, Kuwait, UAE, Oman, Saudi Arabia.
- `billing_currency` (Link: `Currency`): "INR", "AED", "SAR", "QAR", "KWD".
- `admission_date` (Date).
- `customer` (Link: `Customer`): Auto-linked ERPNext customer for GL accounting.
- `status` (Select): "Active", "Completed", "Cancelled", "Suspended".

#### 4. `SmartUp Fee Ledger` (Parent Document per Student Enrolment)
- `student` (Link: `SmartUp Student`).
- `batch` (Link: `SmartUp Batch`).
- `academic_year` (Link: `Academic Year`): "2026-2027".
- `billing_mode` (Select): "Hourly / Monthly Sessions (1:1 / 1:3)" vs "Fixed Package / Instalments (Micro / Regular)".
- **Financial Summary Cards**:
  - `gross_fee` (Currency)
  - `discount_amount` (Currency)
  - `discount_reason` (Small Text)
  - `net_payable` (Currency, Read Only)
  - `total_collected` (Currency, Read Only)
  - `pending_balance` (Currency, Read Only)
  - `due_till_date` (Currency, Read Only)
  - `overdue_amount` (Currency, Read Only)
  - `advance_credit_amount` (Currency, Read Only)
  - `oldest_overdue_days` (Int, Read Only)
  - `fee_status` (Select): "Paid", "Part Paid", "Due Soon", "Overdue", "Credit", "Waived", "Cancelled".
- **Child Table: `SmartUp Instalment Schedule` (`instalments`)**:
  - `instalment_number` (Int): 1, 2, 3...
  - `due_date` (Date).
  - `amount_due` (Currency).
  - `amount_paid` (Currency).
  - `outstanding_balance` (Currency).
  - `status` (Select): "Pending", "Part Paid", "Paid", "Overdue", "Waived".
  - `overdue_days` (Int).
- **Child Table: `SmartUp Subject Allocation` (`subject_allocations`)** (For 1:1 and 1:3):
  - `subject` (Data): "Mathematics", "Physics", "Chemistry", "Biology".
  - `monthly_hours` (Float): e.g., 6.0, 8.0.
  - `hourly_rate` (Currency): e.g., 850.00.
  - `monthly_subtotal` (Currency, Generated: `monthly_hours * hourly_rate`).

#### 5. `SmartUp Fee Receipt` (Financial Transaction Entry)
- `naming_series`: `SU-REC-.YYYY.-.#####` (e.g., `SU-REC-2026-00042`).
- `student` (Link: `SmartUp Student`).
- `fee_ledger` (Link: `SmartUp Fee Ledger`).
- `posting_date` (Date) & `posting_time` (Time).
- `amount_received` (Currency).
- `currency` (Link: `Currency`).
- `mode_of_payment` (Link: `Mode of Payment`): "Cash", "UPI", "Bank Transfer", "Credit/Debit Card", "Razorpay Online", "CoFee Gateway".
- `transaction_reference` (Data): Unique UTR / transaction ID. *Validation: Rejects duplicate references.*
- `payment_status` (Select): "Successful", "Pending Gateway Verification", "Failed", "Reversed".
- `collected_by` (Link: `User`): Counsellor / Finance Collector.
- `remarks` (Small Text).
- **Child Table: `SmartUp Receipt Allocation`**:
  - `instalment_row_id` (Data).
  - `allocated_amount` (Currency).
- *Automated Trigger*: On submission, immediately updates `SmartUp Fee Ledger` and posts ERPNext `Payment Entry` if GL posting is enabled.

#### 6. `SmartUp Fee Adjustment` (Audited Reversals, Waivers & Refunds)
- `naming_series`: `SU-ADJ-.YYYY.-.#####`.
- `student` (Link: `SmartUp Student`).
- `fee_ledger` (Link: `SmartUp Fee Ledger`).
- `original_receipt` (Link: `SmartUp Fee Receipt`, Optional).
- `adjustment_type` (Select): "Fee Waiver", "Post-Admission Discount", "Payment Reversal", "Refund".
- `amount` (Currency).
- `reason` (Text, Mandatory).
- `approved_by` (Link: `User`, Role: "Finance Admin" or "Super Admin").
- `status` (Select): "Draft", "Approved", "Rejected".
- *Strict Policy*: Financial transactions are **never deleted**. All corrections exist as linked adjustment records.

---

## 6. Excel-to-Frappe Field Mapping Matrix

| Excel Column (`2026-27.xlsx`) | Meaning in Manual Process | Target Frappe DocType | Target Field Name | Transform / Conversion Rule |
| :--- | :--- | :--- | :--- | :--- |
| **Sheet Name** (`11`, `13`, `Micro`) | Delivery Model / Batch Type | `SmartUp Batch` | `course_type` | `11` $\rightarrow$ "1:1 Tutoring"<br>`13` $\rightarrow$ "1:3 Group"<br>`Micro` $\rightarrow$ "Micro Batch" |
| **Col A** (`No.`) | Serial Number | Staging / External ID | `excel_serial_no` | Reference tracking for audit trail |
| **Col B** | Student Name | `SmartUp Student` | `student_name` | String trim; split into first/last name |
| **Col C** (`Country` in 1:1) | Region / Country | `SmartUp Student` | `country`, `billing_currency` | "Qatar" $\rightarrow$ Qatar (QAR)<br>"Kuwait" $\rightarrow$ Kuwait (KWD)<br>"sharjah"/"Riyadh" $\rightarrow$ UAE (AED) / KSA (SAR) |
| **Col C / Col E** | Current Class / Grade | `SmartUp Batch` | `class_level` | "8" $\rightarrow$ "Class 8", "11" $\rightarrow$ "Class 11", etc. |
| **Col D / Col F** | Start / Admission Date | `SmartUp Student` & `Ledger` | `admission_date` | Serial to Date: `(serial - 25569) * 86400 * 1000` |
| **Col H** (Sheet 1:1) | Monthly Subject Hours | `SmartUp Subject Allocation` | `monthly_hours` | Multi-row subject split (e.g. 6 hrs, 8 hrs) |
| **Col I** (Sheet 1:1) / **Col F** (1:3) | Hourly Rate | `SmartUp Subject Allocation` | `hourly_rate` | Direct numeric (₹750, ₹850, ₹550, etc.) |
| **Col J** (1:1) / **Col H** (1:3) / **Col F** (Micro) | Total Course / Annual Fee | `SmartUp Fee Ledger` | `gross_fee`, `net_payable` | Initial total commitment |
| **Col K** (1:1) | Advance Fee | `SmartUp Fee Receipt` | `amount_received` | Created as `Instalment 0` or Advance Receipt |
| **Col L** (1:1) / **Col J** (1:3) / **Col G** (Micro) | Fee Paid Till Date | `SmartUp Fee Receipt` | `amount_received` | Generates historical payment record linked to receipt |
| **Col O** (1:1) / **Col M** (1:3) | Monthly Billing Rate | `SmartUp Fee Ledger` | `monthly_billing_rate` | Recomputed: `SUM(hours * rate)` |
| **Col P** (1:1) / **Col N** (1:3) / **Col K** (Micro) | Expected Fee Till October | Calculated Metric | `due_till_date` | Reconciles to sum of instalments due $\le$ Oct 31, 2026 |
| **Col S** (1:1) / **Col Q** (1:3) / **Col O** (Micro) | Balance Due Till Date | Calculated Metric | `pending_balance` | Reconciles to `due_till_date - net_collected` |

---

## 7. Next.js Frontend Architecture & User Experience

The Next.js frontend (`smartup-online-erp`) will integrate with Frappe Cloud via the server-side proxy `/api/proxy/[...path]`. The frontend will deliver a fast, responsive, and minimalist light-theme user interface following the Directors' UI mockup (Appendix A).

### 7.1 Page Route Hierarchy

```
src/app/fees/
  ├── page.tsx                     # Level 0: Global Fees Overview Dashboard
  │                                # Summary KPI Cards, Trend Charts, Product Breakdown,
  │                                # Recent Collections Table, Top Overdue Students Table
  │
  ├── [segment]/
  │     ├── page.tsx               # Level 1: Segment Dashboard (e.g., State, CBSE Kerala, CBSE GCC)
  │     │                          # Segment KPIs, Class distribution cards (Class 8-12)
  │     │
  │     └── [class]/
  │           ├── page.tsx         # Level 2: Class Dashboard (e.g., CBSE Kerala > Class 10)
  │           │                    # Course type switcher: 1:1 Tutoring, 1:3 Group, Micro Batch
  │           │
  │           └── [batch]/
  │                 └── page.tsx   # Level 3 & 4: Paginated, Searchable Student List
  │                                # Columns: Student ID, Name, Fee Plan, Collected, Pending,
  │                                # Due Till Date, Next Due Date, Overdue Days/Status, Actions
  │
  ├── student/[studentId]/
  │     └── page.tsx               # Detailed Student Fee Ledger
  │                                # Profile summary, Fee heads, Instalment schedule table,
  │                                # Transaction history, Print/Download receipt action
  │
  ├── collect/
  │     └── page.tsx               # Fee Collection Entry Screen / Modal
  │                                # Quick-search student, payment mode, UTR ref, allocations
  │
  ├── dues/
  │     └── page.tsx               # Dues & Ageing Monitoring Console
  │                                # Ageing buckets (0-7, 8-15, 16-30, >30), reminder triggers
  │
  └── reports/
        └── page.tsx               # Printable/Exportable Reports Console
                                   # Daily collection closing, segment report, pending report
```

### 7.2 UI Components & Aesthetics
- **Breadcrumb Navigation**: Persistent breadcrumbs (`Fees Overview > CBSE Kerala > Class 10 > Micro Batch A`) with 1-click jump back to any parent level.
- **Top Control HUD**: Date Range Picker, As-Of Date filter, Academic Year (`2026-2027`), Centre / Division switcher, and Currency toggler (`INR` / `AED` / `SAR` / `QAR`).
- **Interactive Visualisations**:
  - Monthly Collection Bar Chart (Stacked by Segment: Kerala vs GCC vs Online).
  - Target vs Collected Radial Gauge (Percentage achieved).
  - Centre-wise / Branch-wise horizontal progress bars.
  - Due Ageing horizontal breakdown bars (0–7d, 8–15d, 16–30d, >30d).
- **Responsive Tables**: Paginated, server-side filtered, debounced search (by student name, guardian mobile, or receipt number).
- **Zero Hard Deletes**: The UI disables any delete action and routes all corrections through an "Audited Adjustment" modal.

---

## 8. Role-Based Access Control (RBAC) & Security

| Role | Dashboard & KPIs | View Student Ledgers | Post Collections | Edit Fee Plans | Approve Adjustments / Refunds | Export Reports |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | Full (All Segments) | Yes | Yes | Yes | Yes | Yes |
| **Finance Admin** | Full (All Segments) | Yes | Yes | Setup only | Yes | Yes |
| **Centre / Branch Manager** | Assigned Centres only | Assigned Centres | Read-only / Permissioned | No | No | Assigned Centres |
| **Fee Collector / Counsellor**| Assigned Students | Search & View | Yes (Issue Receipts) | No | No | Daily Closing only |
| **Academic / Operations** | Read-only Summary | Read-only Fee Status | No | No | No | No |
| **Management Viewer** | Read-only (All Segments) | View Only | No | No | No | Yes |

---

## 9. Phased Execution Roadmap

```
PHASE 1: Frappe DocType & Backend Provisioning
  ├── Step 1.1: Initialize Custom App / DocTypes in Frappe Desk
  ├── Step 1.2: Configure ERPNext Accounts integration (Customer, Payment Entry, Modes)
  ├── Step 1.3: Deploy server-side calculation & validation hooks
  └── Step 1.4: Establish RBAC roles and permissions

PHASE 2: Data Cleaning & Pilot Migration (Excel 2026-27)
  ├── Step 2.1: Run pre-migration validation & sanitization script
  ├── Step 2.2: Seed master data (Programs, Batches, Academic Year 2026-27)
  ├── Step 2.3: Ingest 34 verified student records and create Fee Ledgers
  ├── Step 2.4: Ingest historical receipts and reconcile balances with Excel formulas
  └── Step 2.5: Quarantine unnamed placeholder entries into admission pipeline

PHASE 3: Next.js Frontend Development
  ├── Step 3.1: Build API route handlers and aggregation endpoints
  ├── Step 3.2: Implement Level 0 Fees Overview Dashboard & KPI Cards
  ├── Step 3.3: Implement Level 1-3 Drilldown Navigation & Breadcrumbs
  ├── Step 3.4: Implement Level 4 Student List & Detailed Student Fee Ledger
  └── Step 3.5: Build Fee Collection Modal with Receipt Generation & Duplicate Checking

PHASE 4: Dues, Reminders, Audits & Reporting
  ├── Step 4.1: Build Due Monitoring Console with Ageing Buckets (0-7, 8-15, 16-30, >30)
  ├── Step 4.2: Build Audited Adjustments / Waivers / Reversal Workflow
  ├── Step 4.3: Implement Daily Collection Closing & Excel/PDF Exporting
  └── Step 4.4: Integrate WhatsApp/SMS reminder template engine

PHASE 5: UAT, Verification & Handover
  ├── Step 5.1: Execute Directors' Acceptance Checklist (Section 7.2)
  ├── Step 5.2: Verification of mathematical rollups across all levels
  ├── Step 5.3: Security & Protected Data Policy audit
  └── Step 5.4: Formal handover and user guides for Finance, Counsellors, and Admin
```

---

## 10. Directors' Acceptance Criteria (UAT Checklist)

- [ ] **KPI Cards**: Fees Overview loads immediately showing Total Students, Total Fees, Total Collected, Pending, and Due Till Date.
- [ ] **State Drill-Down**: Clicking `State` opens classes 8–12; selecting a class reveals `Regular` / `Crash`; selecting `Regular` opens batches `A/B/C`; selecting a batch displays student table.
- [ ] **CBSE Drill-Down**: Clicking `CBSE Kerala` opens classes 8–12; selecting a class reveals `1:1`, `1:3`, and `Micro Batch`; selecting course type opens matching student list.
- [ ] **Reconciliation Check**: At every level, parent KPI cards exactly equal the sum of child rows under matching filters.
- [ ] **Live Collection**: Submitting a payment creates a unique receipt (`SU-REC-...`), immediately credits the student ledger, decrements pending dues, and increments dashboard collection totals.
- [ ] **Duplicate Guard**: Re-submitting an existing UTR / transaction reference produces an immediate validation error.
- [ ] **Immutable History**: No delete button exists for posted transactions. Adjustments require an explicit reason and manager approval.
- [ ] **Multi-Currency Clarity**: GCC currencies (`AED`, `SAR`, `QAR`, `KWD`) display separately or with explicitly labelled exchange conversion rates.
- [ ] **Exportability**: All tables support instant Excel/CSV download and print-ready PDF summaries.

---

*End of Implementation Plan. Implementation will proceed strictly upon explicit user command.*
