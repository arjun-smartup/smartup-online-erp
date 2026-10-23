# SmartUp Online ERP Frontend — Architecture & Implementation Plan

## Progress Checklist

- [x] **Step 1: Deep Study & Architectural Blueprint**
  - [x] Analyze `SMARTUP_ONLINE_ERP_IMPLEMENTATION_PLAN.md`
  - [x] Map Online ERP distinctions vs Offline ERP
  - [x] Define module boundaries, Frappe DocTypes, and timezone/currency logic
  - [x] Present comprehensive architectural directory structure to user

- [x] **Step 2: Local Frontend Project Setup**
  - [x] Initialize Next.js (App Router, TypeScript, Tailwind CSS) in `./`
  - [x] Configure `lucide-react`, `clsx`, `tailwind-merge`, and design dependencies
  - [x] Configure typography, color tokens (modern dark aesthetic), glassmorphism styles in `globals.css`
  - [x] Setup `.env.example` and `.env.local`

- [x] **Step 3: Frappe API Proxy & Integration Layer**
  - [x] Build server-side proxy route `/api/proxy/[...path]` with DELETE block protection
  - [x] Build strongly-typed Frappe REST client (`src/lib/api/frappe-client.ts`)
  - [x] Add connection test / health check route `/api/frappe/health`
  - [x] Linked live Frappe Cloud backend: `https://smartupedu.frappe.cloud` with API credentials

- [x] **Step 4: Layout Shell, Navigation & Online Modules**
  - [x] Implement App Shell (Sidebar, Navbar, Timezone HUD for IST/GST/AST, Division switcher)
  - [x] Verify local dev server (`http://localhost:3000`) and test typecheck (`npx tsc --noEmit`)
  - [x] Verified full UI and Frappe connection diagnostics in browser subagent

- [x] **Step 5: Frappe Authentication & Clean Production-Ready Transition**
  - [x] Implement backend auth endpoint `/api/auth/login` targeting `https://smartupedu.frappe.cloud/api/method/login`
  - [x] Implement `/api/auth/logout` and `/api/auth/me` session checking
  - [x] Build a sleek, modern Login Screen (`/login`)
  - [x] Remove all hardcoded and fake student, batch, fee, and live class datasets
  - [x] Build post-login Demo Page showing "Authentication Success" with user details and "Others Under Development" status
  - [x] Tested and verified end-to-end authentication in the browser

- [x] **Step 6: Minimal Light Theme & Clean Content Overhaul**
  - [x] Transition global design tokens and layout to a clean, minimal light theme
  - [x] Strip away extraneous visual clutter, glowing ambient blobs, and distracting widgets
  - [x] Redesign Login Screen with pure whitespace, crisp typography, and clean inputs
  - [x] Redesign Authenticated Demo Page to show clean success state and session metadata
  - [x] Verified full light-theme experience end-to-end in the browser

- [x] **Step 7: Fees Module & Student Data Frappe Implementation**
  - [x] Deep audit of Directors' Scope (`Smart_Up_ERP_Fees_Module_Developer_Scope.pdf`)
  - [x] Deep audit of Excel student manual data (`1 TO 1,3 & MICRO - STUDENTS DATA-2026-27.xlsx`)
  - [x] Evaluated and confirmed Option C (Bespoke SmartUp Suite over standard Education module)
  - [x] Successfully provisioned custom DocTypes directly on `smartupedu.frappe.cloud`:
    - `SmartUp Program` (State, CBSE Kerala, CBSE GCC, CBSE GCC Offline)
    - `SmartUp Batch` (Class 8-12, 1:1, 1:3, Micro, Regular)
    - `SmartUp Batch Enrollment` (Child table)
    - `SmartUp Student` (Profile, Guardian, Country, Currency, ERP Customer link)
    - `SmartUp Fee Ledger` (Parent financial ledger, Net Payable, Dues, Ageing)
    - `SmartUp Subject Allocation` (1:1 & 1:3 subject hours and hourly rate table)
    - `SmartUp Instalment Schedule` (Instalment milestones, due dates, paid tracking)
    - `SmartUp Fee Receipt` (Receipt numbering `SU-REC-...`, payment modes, UTR)
    - `SmartUp Faculty` (Tutor & Mentor tracking)
    - `SmartUp Live Session` (Meeting links, topics, recordings)
    - `SmartUp Portion Tracker` (Chapter syllabus completion tracking)
  - [x] Seeded core Programs (`State`, `CBSE Kerala`, `CBSE GCC`, `CBSE GCC Offline`)
  - [x] **Step 8: Bulk Import 1:1 and 1:3 Students into SmartUp Online ERP**
  - [x] Identify sheets and rules: Sheet '11' (1:1), Sheet '13' (1:3), skip Micro
  - [x] Deeply parse Sheet '11' (1:1): 46 active student records, subject breakdowns, financial metrics
  - [x] Deeply parse Sheet '13' (1:3): 13 active student records, subject breakdowns, financial metrics
  - [x] Catalog and normalize Place/Country/State values for 1:1 (7 Kerala -> CBSE Online; 39 GCC -> GCC Online)
  - [x] Map routing: 1:3 -> CBSE Online (13 students); 1:1 Kerala -> CBSE Online (7 students); 1:1 GCC -> GCC Online (39 students)
  - [x] Define student schema, personal details placeholders/updates, subject allocation structure, and fee ledger structure
  - [x] Generated pre-computed JSON dataset: `structured_import_data.json` (59 total students)
  - [x] Received user approval command "oke do it"
  - [x] Ensured `SmartUp Program`s `CBSE Online` and `GCC Online` exist
  - [x] Ensured all 14 academic batches exist in `SmartUp Batch` across Class 8 to Class 12
  - [x] Executed bulk import: 59 students imported into `SmartUp Student` (20 CBSE Online, 39 GCC Online)
  - [x] Executed bulk fee ledger import: created ledgers with `SmartUp Subject Allocation` child rows
  - [x] Verified 100% of records live on `smartupedu.frappe.cloud` with zero errors
- [x] **Step 9: Student Details Edit & Save Functionality**
  - [x] Audit editable fields on `SmartUp Student` DocType and design editing structure
  - [x] Implement backend `PUT` endpoint in `src/app/api/students/[id]/route.ts` with error handling and field whitelisting
  - [x] Build interactive Edit Student Modal in `src/app/students/[id]/page.tsx`
  - [x] Verify editing and saving student profile details end-to-end via browser subagent and live Frappe Cloud sync

- [x] **Step 10: Premium Minimalist Cards & Directory UI Overhaul**
  - [x] Eliminate cartoonish purple borders, oversized icon containers, and clunky badges
  - [x] Re-architect Class Level cards with sleek 1px neutral borders, monospace tags, and subtle delivery chips
  - [x] Re-engineer Tier 1 Programs, Tier 2 Class Selection, Tier 3 Formats, and Tier 4 Roster table
  - [x] Verified in browser across all 4 drill-down tiers with clean typography and modern SaaS aesthetic

- [x] **Step 11: Interactive Dashboard KPI Cards & Deep Navigation**
  - [x] Converted "Total Students" dashboard KPI card to an interactive link leading directly to `/students`
  - [x] Converted financial KPI cards ("Total Net Fees", "Total Collected", "Pending Balance") to link to `/fees` with metric parameters
  - [x] Added subtle `ArrowUpRight` interaction indicators and hover border states
  - [x] Verified end-to-end navigation via browser subagent

- [x] **Step 12: Multi-Tier Financial Drill-Down Architecture & Implementation**
  - [x] Deeply study drill-down data model (`Program` -> `Class` -> `Delivery Format` -> `Student Fee Ledger`)
  - [x] Eliminate API limits in `/api/fees/summary` (`limit_page_length=1000`, remove restrictive filters, enrich with `class_level` & `delivery_mode`)
  - [x] Verify mathematical consistency across all tiers against live Frappe Cloud (₹3,410,400 net fees, ₹609,805 collected)
  - [x] Implemented interactive 4-tier drilldown UI in `src/app/fees/page.tsx` with premium minimal aesthetic
  - [x] Added dynamic metric switcher (`All Metrics`, `Net Fees`, `Collected`, `Pending`) and deep-linking from Executive Dashboard
- [x] **Step 13: Clean up Fake Student Rehan Mehrin & Purge Test Customers**
  - [x] Safely deleted fake/test student `2v0vnvdltk` & duplicate `1b6to8lcmu`
  - [x] Deleted associated fee ledgers and test fee receipts
  - [x] Deactivated Customer `Rehan Mehrin - 6` (preserving audit GL entries) and purged unused orphan test customers
  - [x] Verified exact remaining active campus: 58 students, ₹3,200,400 net fees, ₹583,805 collected

- [x] **Step 14: Compact Fees Cards & Unified Design System**
  - [x] Removed "COMMITTED CONTRACT FEES (NET)" header label
  - [x] Transformed program cards to a 4-column single-row compact layout on desktop
  - [x] Applied unified executive styling across `/fees` and `/students`

- [x] **Step 15: Replace Dashboard Recent Admissions & Regional Distribution with Program Financial Cards**
  - [x] Enhance `/api/dashboard/summary` to return program-wise financial breakdowns
  - [x] Remove Recent Student Admissions table and Regional Distribution list from `src/app/page.tsx`
  - [x] Add compact 4-column Program Financial Cards displaying Total Net Fees, Collected Fees, Pending Fees, and Realization Rates
  - [x] Verify type checking (`npx tsc --noEmit`)
  - [x] Verify live rendering in the browser with screenshot

- [x] **Step 16: Refine Header KPI Cards Sizing**
  - [x] Slightly reduced header cards padding from `p-5` to `p-4` and vertical spacing to `space-y-2`
  - [x] Reduced icon box to `w-7 h-7` and aligned grid gap to `gap-3.5`
  - [x] Fine-tuned typography (`text-xl sm:text-2xl`) and secondary labels (`text-[10px]`)
  - [x] Verified zero TypeScript errors (`npx tsc --noEmit`) and verified layout balance in browser screenshot


- [x] **Step 17: 3D Premium UI Overhaul**
  - [x] Designed and applied multi-tiered 3D card elevation with specular highlights (`shadow-[0_4px_20px_-4px_rgba(15,23,42,0.07),...,inset_0_1px_0_rgba(255,255,255,1)]`)
  - [x] Created tactile 3D gradient icon tiles with soft color-matched drop shadows and specular top bevels
  - [x] Transformed buttons ("Admit New Student", "Refresh", "View Full Fees") into tactile 3D buttons with press depression (`active:translate-y-0.5`)
  - [x] Transformed Collected & Pending sub-metrics into carved 3D debossed inset wells
  - [x] Engineered 3D progress bar with debossed groove and vibrant glowing realization gauge
  - [x] Upgraded top navbar, search bar with inset well, and sidebar with 3D logo & active pill
  - [x] Verified with `npx tsc --noEmit` and confirmed visual perfection in browser screenshot

- [x] **Step 18: Unified Brand Purple Theme Across All Cards**
  - [x] Replaced multi-color rainbow tiles (blue, green, orange, teal) with the signature SmartUp logo purple (`from-purple-500 via-purple-600 to-indigo-700`)
  - [x] Standardized all 4 KPI header icon tiles and hover states to the logo purple palette
  - [x] Unified all 4 Academic Program top accent bars and avatar tiles to the signature purple brand gradient
  - [x] Verified with `npx tsc --noEmit` and confirmed visual harmony in browser screenshot

- [x] **Step 19: Dedicated Green Collected & Orange Pending Financial Accents**
  - [x] Styled Total Collected header card with 3D emerald icon tile, emerald figure, and emerald subtitle
  - [x] Styled Pending Balance header card with 3D amber/orange icon tile, amber figure, and amber subtitle
  - [x] Updated Academic Program Financials with 3D debossed green wells for Collected and 3D debossed orange wells for Pending
  - [x] Maintained SmartUp Logo Purple for primary brand identity (Students, Net Fees, Program headers, and Avatars)
  - [x] Verified with `npx tsc --noEmit` and confirmed live in browser screenshot

- [x] **Step 20: Remove "SmartUp Online (Kochi & GCC)" from Navbar**
  - [x] Removed the campus badge from the right HUD in `src/components/layout/app-shell.tsx`
  - [x] Cleaned up adjacent borders and alignment in the navbar header
  - [x] Verified zero TypeScript compilation errors (`npx tsc --noEmit`)

- [x] **Step 21: Remove Subtitle & Code Badges (SU KL, SU ST, etc.) from Program Cards**
  - [x] Removed program code badges (`p.code`) and descriptions (`p.subtitle`) from card headers in `src/app/page.tsx`
  - [x] Vertically centered the program icons and title with the student count badge
  - [x] Verified zero TypeScript compilation errors (`npx tsc --noEmit`)
  - [x] Verified in browser with screenshot

- [x] **Step 22: Minimalist Cleanup of Header and Program Cards**
  - [x] Removed secondary subtitle descriptions from all 4 Header KPI cards in `src/app/page.tsx`:
    - "Active enrolled online learners"
    - "Across all student agreements"
    - "Recorded in General Ledger"
    - "Remaining uncollected balance"
  - [x] Removed redundant elements from Program Financial cards in `src/app/page.tsx`:
    - Average fee per student (`~₹46,095/st`)
    - Batch status chips (`Active Batches` / `No Batches`)
    - `Explore Ledger` link and footer container
  - [x] Removed unused `ArrowRight` icon import
  - [x] Verified typecheck (`npx tsc --noEmit`) passed with 0 errors
  - [x] Verified clean executive aesthetic in live browser screenshot
- [x] **Step 23: Remove Section Header from Academic Program Financials**
  - [x] Removed heading (`Academic Program Financials`) and subtitle (`Real-time fee ledger breakdown...`) in `src/app/page.tsx`
  - [x] Preserved right-aligned `View Full Fees & Collections` quick link
  - [x] Verified typecheck (`npx tsc --noEmit`) passed with 0 errors
  - [x] Verified in browser with screenshot

- [x] **Step 24: Reverted Back to Clean 3D Light Theme**
  - [x] Completely removed aurora background and dark glassmorphic styling
  - [x] Restored `src/app/layout.tsx` to Geist fonts and light mode configuration
  - [x] Restored `src/app/globals.css` with 3D tactile card, well, and button tokens
  - [x] Restored `src/app/login/page.tsx`, `app-shell.tsx`, `app-sidebar.tsx`, and `page.tsx`
  - [x] Verified zero TypeScript compilation errors (`npx tsc --noEmit`)
  - [x] Verified both Executive Dashboard and Login Screen live in browser screenshots

- [x] **Step 25: Modern Minimalist Split-Screen Login Page**
  - [x] Built left brand hero panel with logo, "Welcome back" headline, abstract 3D gradient background, and live stats preview card
  - [x] Built right auth card with email icon, password toggle, "Remember me" checkbox, "Forgot password?" link, and 8px border radius "Sign In" button
  - [x] Added "Or continue with" divider and Google & Apple social login buttons
  - [x] Added "Don't have an account? Sign up" bottom prompt
  - [x] Preserved Frappe API Key quick sign-in capability
  - [x] Verified TypeScript compilation (`npx tsc --noEmit`) passed with 0 errors
  - [x] Verified live rendering and authentication in browser with screenshots

- [x] **Step 26: Full-Screen b.well Split-Screen Login Page**
  - [x] Replaced floating centered card with edge-to-edge full viewport split-screen layout in `src/app/login/page.tsx`
  - [x] Implemented full-height left lifestyle photo with periwinkle duotone grading and organic S-curve wave boundary
  - [x] Implemented full-height right white section with vertically centered form rhythm, crisp white autofill inputs, pill "Log in" button, app store badges, and footer links
  - [x] Verified zero TypeScript compilation errors (`npx tsc --noEmit`)
  - [x] Verified full-screen edge-to-edge layout and functional authentication in browser subagent

- [x] **Step 27: Streamlined Minimalist Login Form**
  - [x] Removed "Remember me" checkbox
  - [x] Removed "Don't have an account? Sign up." prompt
  - [x] Removed App Store and Google Play badges
  - [x] Removed "Sign in with configured Frappe API Key" quick login button
  - [x] Removed Terms of Service and Privacy Policy legal disclaimer
  - [x] Removed "Forgot password?" link from login form
  - [x] Verified zero TypeScript errors (`npx tsc --noEmit`) and confirmed clean visual layout in browser subagent

- [x] **Step 28: Mobile Screen Curved Cut & Cohesive Layout**
  - [x] Added mobile-specific horizontal organic curved cut SVG to the bottom of the hero photo
  - [x] Fixed mobile disconnected layout by removing mobile `min-h-screen` and excess spacing on the form
  - [x] Framed the smiling father and child cleanly with `object-[center_25%]`
  - [x] Verified full responsive cohesion on mobile (390x844) and desktop (1536x730) in browser subagent

- [x] **Step 29: Complete Elimination of Subpixel Line under Mobile Image**
  - [x] Changed photo container fallback background from dark navy to pure white
  - [x] Extended SVG path below the baseline (`y=105`) and added 1px negative margin overlap on mobile
  - [x] Confirmed zero line or seam artifacts in live browser screenshots on both mobile and desktop

- [x] **Step 30: Brand Header & Quote Update**
  - [x] Updated logo branding text from `smart.up` to bold `smartup`
  - [x] Updated tagline to quote: `“Make parents proud”`
  - [x] Verified in browser across mobile (390x844) and desktop (1536x730) viewports

- [x] **Step 31: Quote Quotes Removal & Form Card View Enclosure**
  - [x] Removed quotation marks from `Make parents proud`
  - [x] Enclosed Email input, Password input, and Log in button within an elevated card view container (`rounded-[22px] sm:rounded-[26px] p-5 sm:p-7 border border-slate-200/80 shadow`)
  - [x] Preserved responsive cohesion on both desktop (1536x730) and mobile (390x844)
  - [x] Verified zero TypeScript compilation errors (`npx tsc --noEmit`) and inspected screenshots

- [x] **Step 32: Enlarged Card & 3D Glassmorphism UI**
  - [x] Increased card container dimensions from 380px to 480px with generous `p-6 sm:p-9` padding
  - [x] Implemented 3D frosted glassmorphic surface (`bg-white/80 backdrop-blur-2xl border border-white/95 shadow`) with top specular rim highlight
  - [x] Added soft ambient light refraction blooms in the background
  - [x] Upgraded form inputs to 3D inset tactile wells (`rounded-[12px] pl-10 py-3 shadow-[inset_0_2px_4px_rgba(15,23,42,0.025)]`)
  - [x] Enhanced primary CTA button with tactile 3D gradient, top specular edge, and multi-layer elevation shadow
  - [x] Verified zero TypeScript compilation errors (`npx tsc --noEmit`) and visually inspected on desktop and mobile viewports

- [x] **Step 33: Update Login Hero Image & Integrate SmartUp Logo**
  - [x] Copy user assets from Downloads (`Smartup Family Learning Moment.png` & `PSD NOBG-Photoroom.png`) to `public/images/`
  - [x] Update `src/app/login/page.tsx` with the new hero image (`/images/smartup-family-hero.png`)
  - [x] Adjust image overlay/tinting and positioning to let the warm family learning moment shine with the organic wave boundary
  - [x] Add the official SmartUp logo (`/images/smartup-logo.png`) near the "smartup" brand header
  - [x] Verify TypeScript types (`npx tsc --noEmit`)
  - [x] Verify visual presentation across desktop and mobile in browser subagent

- [x] **Step 34: Hero Images Slideshow & Old Image Purge**
  - [x] Copy `hero.png`, `hero 2.png`, and `hero 3.png` from Downloads to `public/images/` as `hero-1.png`, `hero-2.png`, `hero-3.png`
  - [x] Delete all obsolete hero images (`login-hero.jpg`, `login-hero-v2.jpg`, `smartup-family-hero.png`) from `public/images/`
  - [x] Build a smooth auto-advancing slideshow with cross-fade transitions, Ken Burns micro-scaling, and interactive indicators in `src/app/login/page.tsx`
  - [x] Maintain responsive wave borders (desktop S-curve and mobile bottom curve)
  - [x] Verify TypeScript compilation (`npx tsc --noEmit`)
  - [x] Verify smooth transition and visual rendering in browser subagent on desktop & mobile

- [x] **Step 35: Remove White Wave Overlays on Desktop and Mobile**
  - [x] Remove desktop vertical organic wave SVG overlay from `src/app/login/page.tsx`
  - [x] Remove mobile bottom organic curved cut SVG overlay from `src/app/login/page.tsx`
  - [x] Align desktop column layout to a clean 50/50 edge-to-edge split (`md:w-1/2`)
  - [x] Clean up negative margins (`-mt-1`) and align mobile photo banner cleanly
  - [x] Position slideshow indicator pills cleanly at the bottom of the photo
  - [x] Verify TypeScript types (`npx tsc --noEmit`)
  - [x] Verify clean, uncluttered presentation on desktop and mobile in browser subagent

- [x] **Step 36: Restore Seamless Organic Curves with Pure White Background Alignment**
  - [x] Restore desktop vertical S-curve SVG boundary (`path d="M100,0 L100,100 L44,100 C16,82 -2,64 6,42 C14,24 26,10 48,0 Z"`)
  - [x] Restore mobile horizontal organic curved cut SVG boundary
  - [x] Unify right panel background to pure `bg-white` (matching `smartuplearning.online/login`) so the curve blends with 0 seam or color mismatch
  - [x] Position slide indicators on the left side of the hero photo away from the curve
  - [x] Verify TypeScript types (`npx tsc --noEmit`)
  - [x] Verify seamless aesthetic in browser subagent on desktop and mobile

- [x] **Step 37: Remove "Get Support" from Login Page**
  - [x] Remove "Get Support" button and alert handler from login page footer
  - [x] Remove unused `MessageCircle` import from `lucide-react`
  - [x] Center language dropdown in the footer
  - [x] Verify TypeScript compilation (`npx tsc --noEmit`)
  - [x] Verify visual presentation in browser

- [x] **Step 38: Server-Side Edge Middleware & Flash-Free Auth Protection**
  - [x] Create `src/proxy.ts` (Next.js 16 file convention replacing deprecated middleware.ts) with server-side route protection
  - [x] Implement cookie verification for `smartup_session` / `sid`
  - [x] Redirect unauthenticated users immediately from `/` and protected routes (`/students`, `/fees`, etc.) to `/login` with 0 flash (HTTP 307)
  - [x] Redirect authenticated users from `/login` back to `/`
  - [x] Update `src/components/layout/app-shell.tsx` with a render guard for client-side state
  - [x] Verify TypeScript compilation (`npx tsc --noEmit`)
  - [x] Test in browser subagent: verify visiting `http://localhost:3000/` unauthenticated directly loads `/login` without flashing dashboard

- [x] **Step 39: Push to Git & Deploy to Production Server**
  - [x] Stage all modified and new files (Login slideshow, brand logo, clean curves, edge auth proxy)
  - [x] Commit with descriptive message (`feat(ui): login hero slideshow, brand logo integration, and edge auth proxy`)
  - [x] Push to GitHub (`origin/main` at `https://github.com/arjun-smartup/smartup-online-erp.git`)
  - [x] Pull on Hostinger VPS (`/var/www/smartup-online-erp`)
  - [x] Rebuild production Next.js bundle (`npm ci && npm run build`)
  - [x] Gracefully reload PM2 process (`pm2 reload smartup-online-erp`)
  - [x] Verify live domain `https://smartuplearning.online` with 200 OK and active Cloudflare SSL

- [x] **Step 40: Architectural Structure: Link Student Fees with Sales Order, Paid Invoice, Unpaid Invoice & Payment Entry**
  - [x] Deep audit of current system state: inspected student `aak46scsgo` (Rida) and confirmed all 58 students had `customer: null` and lacked Sales Order / Invoices / Payment Entries
  - [x] Analyzed ERPNext Accounts schema: `Customer`, `Sales Order`, `Sales Invoice`, `Payment Entry`, and reconciliation rules
  - [x] Created & linked ERPNext Customer `Rida (aak46scsgo)` to student `aak46scsgo`
  - [x] Created & submitted Sales Order `SAL-ORD-2026-00002` for total contract fee (₹28,800)
  - [x] Created & submitted Paid Sales Invoice `ACC-SINV-2026-00003` for advance amount (₹4,000)
  - [x] Created & submitted Payment Entry `ACC-PAY-2026-00003` and Fee Receipt `SU-REC-2026-00001` (reconciling Paid Invoice to ₹0 outstanding)
  - [x] Created & submitted Unpaid Sales Invoice `ACC-SINV-2026-00004` for remaining balance (₹24,800)
  - [x] Updated `/api/students/enrol` to automate this double-invoice accounting structure on every new admission
  - [x] Updated `/api/payments/create` with leaf payment account `ACADEMIQEDU LEARNING LLP - SU` and `fee_ledger` validation
  - [x] Created universal idempotent sync endpoint `/api/students/sync-accounting`
  - [x] Enhanced `/api/students/[id]` to return linked `salesOrder`, `salesInvoices`, and `receipts`
  - [x] Updated `/students/[id]/page.tsx` with Sales Order badge and functional invoice action buttons (`Receipt`, `Mark Payment`)
  - [x] Verified zero TypeScript compilation errors (`npx tsc --noEmit`)
  - [x] Verified in browser with screenshot: verified 2 invoices (Paid ₹4,000, Unpaid ₹24,800), SO tag, and Payment History displayed
  - [x] Removed `[Receipt]` button from unpaid invoices in `/students/[id]/page.tsx` so that only Paid invoices show `[Receipt]`, and Unpaid invoices show exclusively `[Mark Payment]` (verified in browser screenshot)

- [x] **Step 41: Deep Audit & Mathematical Reconciliation of All Student Fees, Sales Orders & Invoices**
  - [x] Wrote read-only audit script to query 100% of students in Frappe Cloud (`scratch/deep_accounting_audit.js`)
  - [x] Reconciled all 58 students' `SmartUp Fee Ledger` (`gross_fee`, `total_collected`, `pending_balance`) against:
    - ERPNext `Customer` (58 / 58 linked, 0 missed)
    - ERPNext `Sales Order` (58 / 58 matched)
    - ERPNext `Paid Sales Invoice` (₹5,83,805 exact match across 58 students)
    - ERPNext `Payment Entry` (₹5,83,805 exact match across 58 students)
    - ERPNext `Unpaid Sales Invoice` (₹26,50,395 exact match across 58 students)
  - [x] Confirmed 0 student missed and 0 discrepancies remaining (58 / 58 perfect matches)
  - [x] Documented complete student-by-student reconciliation matrix in `STUDENT_FINANCIAL_RECONCILIATION_REPORT.md`
  - [x] Enhanced `/api/students/[id]` to query active Sales Orders ordered by `creation desc` and match ledger `gross_fee`

- [x] **Step 42: Commit & Push Changes to Git Repository**
  - [ ] Stage and commit accounting integration and audit improvements
  - [ ] Push to `origin/main` (`https://github.com/arjun-smartup/smartup-online-erp.git`)






