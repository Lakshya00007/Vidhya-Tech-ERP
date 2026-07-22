# Vidhya School ERP Desktop v1.2 Manual QA

Use an isolated development profile for QA:

```sh
rm -rf /tmp/vidhya-erp-v1.2-qa
env -u ELECTRON_RUN_AS_NODE \
VIDHYA_ERP_TEST_USER_DATA_DIR=/tmp/vidhya-erp-v1.2-qa \
VIDHYA_LICENSE_SERVER_URL=https://erp-management-indol.vercel.app \
npm run desktop
```

Do not run destructive restore tests against the real production userData path.

## Existing Regression Workflows

- [ ] Pass / [ ] Fail
  Setup: Open the isolated profile and sign in as Owner.
  Steps: Create a student, employee, fee head, fee receipt, attendance row and salary payment.
  Expected: Each record saves, reopens from its module, and no existing navigation route shows a placeholder for an implemented module.

- [ ] Pass / [ ] Fail
  Setup: Owner account with `features: ["all"]` full license.
  Steps: Open Students, Fees, Accounts, Payroll, Attendance, Exams, Reports, Messages and Settings.
  Expected: Implemented modules open without PRO badges, upgrade modals or plan-lock messages.

## Exam Schedule

- [ ] Pass / [ ] Fail
  Setup: Create an academic session, exam, subjects, class/section and employee.
  Steps: Open Exams > Exam Schedule, create a draft schedule, add papers, publish, print and export CSV.
  Expected: Schedule saves, entries remain in range, print/CSV match screen data and status changes to Published.

- [ ] Pass / [ ] Fail
  Setup: Existing published schedule with one room and invigilator.
  Steps: Add another overlapping paper for the same class/section, room and invigilator.
  Expected: Conflict messages appear and invalid entries are not saved.

- [ ] Pass / [ ] Fail
  Setup: Published schedule.
  Steps: Edit the schedule, cancel it, then mark another schedule completed.
  Expected: Published edit requires confirmation, cancelled/completed states persist, and cancelled schedules stop appearing in student-facing date sheets.

## Date Sheet

- [ ] Pass / [ ] Fail
  Setup: Published exam schedule with several classes.
  Steps: Open Exams > Date Sheet, filter by class/section, print one class and export all classes.
  Expected: Data comes only from schedule entries, filters work, and print layout includes school header, dates, times, room and signature area.

- [ ] Pass / [ ] Fail
  Setup: Student account linked to a class/section.
  Steps: Open the student date-sheet view or student-accessible route.
  Expected: Student sees only their own class/section published schedule.

## Result Sheet

- [ ] Pass / [ ] Fail
  Setup: Exam marks include one pass, one fail, one absent remark and one missing mark.
  Steps: Open Exams > Result Sheet, review Class Result Sheet, Subject Result Sheet and Exam Summary.
  Expected: Absent remains Absent, missing marks remain Incomplete/Pending, subject fail makes overall Fail, and ranking is deterministic.

- [ ] Pass / [ ] Fail
  Setup: Existing saved report card snapshots.
  Steps: Change marks after viewing Result Sheet, then reopen saved report cards.
  Expected: Result Sheet reflects current marks but existing report-card snapshots are not overwritten.

## Blank Award List

- [ ] Pass / [ ] Fail
  Setup: Active students and exam subject setup.
  Steps: Open Exams > Blank Award List, choose exam/class/section/subject, print and export CSV.
  Expected: Students are ordered correctly, marks cells are blank, maximum marks are correct, and no marks records are created or modified.

## Progress Report

- [ ] Pass / [ ] Fail
  Setup: Student has attendance, exam marks, class tests, report cards and behaviour/skills where available.
  Steps: Open Reports > Student Progress Report, generate individual and class summaries.
  Expected: Only real saved data is shown, missing sections say No data available, indicators are Improving/Stable/Needs Attention/No Data only.

- [ ] Pass / [ ] Fail
  Setup: Two exam results for the same class.
  Steps: Compare previous and current exam percentages in class summary.
  Expected: Percentage change is deterministic and CSV/print match the table.

## Custom Reports

- [ ] Pass / [ ] Fail
  Setup: Owner account.
  Steps: Create a Private report, a Shared report, filters, sorting and CSV export for approved domains.
  Expected: Only approved domains/columns appear, saved definitions reopen, and CSV values starting with `=`, `+`, `-` or `@` are neutralized.

- [ ] Pass / [ ] Fail
  Setup: Teacher, Accountant, Viewer and Student accounts.
  Steps: Try finance, salary, academic and student domains for each role.
  Expected: Role restrictions are enforced; Student cannot access the builder.

## Live Class

- [ ] Pass / [ ] Fail
  Setup: Owner/Admin and linked Teacher account.
  Steps: Create a live class with an HTTPS meeting link, schedule, copy/open link, mark attendance and export CSV.
  Expected: HTTPS link saves, non-HTTPS is rejected, attendance persists and cancelled classes cannot be joined.

- [ ] Pass / [ ] Fail
  Setup: Two linked teachers and a student in the class.
  Steps: Teacher A creates a class, Teacher B tries to modify it, Student opens live classes.
  Expected: Teacher B is blocked, Student sees only applicable non-draft classes, and offline schedules remain readable.

## Store

- [ ] Pass / [ ] Fail
  Setup: Owner/Admin or Accountant.
  Steps: Create category, tax rate and products with SKU/barcode.
  Expected: Duplicate active SKU/barcode is rejected and inactive/deleted products cannot be newly sold.

## Inventory

- [ ] Pass / [ ] Fail
  Setup: Product with zero stock.
  Steps: Add opening stock, add stock adjustment, damage stock and review ledger/low-stock report.
  Expected: Stock_before/stock_after are accurate, negative stock is blocked and ledger matches product stock.

## POS

- [ ] Pass / [ ] Fail
  Setup: Product with stock and tax rate.
  Steps: Complete a sale with exact payment, print receipt and review daily sales/payment summary.
  Expected: Stock deducts exactly once, receipt/order number is unique, revenue reports include completed sale only.

- [ ] Pass / [ ] Fail
  Setup: Completed sale.
  Steps: Reverse the sale with a reason, then try reversing again.
  Expected: Stock is restored once, repeated reversal is blocked and reversed sale is excluded from revenue.

## Backup

- [ ] Pass / [ ] Fail
  Setup: Isolated profile with sample records and at least one managed asset folder under userData.
  Steps: Create backup from Backup & Restore and inspect ZIP contents.
  Expected: ZIP contains `backup/database/school-erp.db`, `backup/manifest.json`, `backup/checksums.json` and included managed asset folders with SHA-256 checksums.

- [ ] Pass / [ ] Fail
  Setup: Create malformed ZIP copies: missing manifest, checksum mismatch, corrupt SQLite, path traversal and symlink entry.
  Steps: Attempt restore for each malformed archive.
  Expected: Restore is rejected before replacement and current database/files remain unchanged.

## Restore

- [ ] Pass / [ ] Fail
  Setup: Valid full backup archive and isolated current profile.
  Steps: Restore archive, restart app, reopen data and managed files.
  Expected: Pre-restore backup remains available, restored database/files load, temporary restore files are cleaned and wrong-school warning appears when applicable.

- [ ] Pass / [ ] Fail
  Setup: Legacy `.db` backup.
  Steps: Restore legacy backup and restart.
  Expected: Legacy restore remains compatible and creates a pre-restore safety backup.

## Permissions

- [ ] Pass / [ ] Fail
  Setup: Owner, Admin, Accountant, Teacher, Viewer and Student accounts.
  Steps: Open direct routes and attempt restricted IPC-backed actions for finance, admin, live class, reports and student portal data.
  Expected: Owner/Admin have intended access; Accountant is limited to finance/payroll/report duties; Teacher cannot access unrestricted finance; Student sees only own data.

## Full License

- [ ] Pass / [ ] Fail
  Setup: Valid license with `features: ["all"]`.
  Steps: Open every implemented navigation route.
  Expected: Implemented routes are allowed subject to role permissions; invalid/suspended/revoked/expired licenses still block according to existing license policy.

## Offline Mode

- [ ] Pass / [ ] Fail
  Setup: Disable internet after local login.
  Steps: Use Students, Fees, Accounts, Exams, Reports, Store/POS and Backup.
  Expected: Offline ERP modules work; internet-required live-class join and WhatsApp/SMS actions show readable errors.

## Communication Gateway

- [ ] Pass / [ ] Fail
  Setup: Existing mock gateway configuration.
  Steps: Open Communication Integrations, test gateway, open WhatsApp and SMS pages.
  Expected: Gateway remains connected, token is not displayed, Mock mode/statuses are readable and no `[object Object]` or secret values appear.

## POS Accounts Integration

- [ ] Pass / [ ] Fail
  Setup: Owner/Admin or Accountant, active Store products with stock, active income and expense account categories.
  Steps: Open School Store & POS -> Account Mapping, map POS cash/UPI/card income and reversal expense, open a cashier session, complete a cash sale, then open Accounts reports.
  Expected: The completed POS sale posts one linked POS Sale income entry with the order number/reference and does not create duplicate entries after refresh/retry.

- [ ] Pass / [ ] Fail
  Setup: Same product and open cashier session.
  Steps: Complete one UPI sale and one split Cash/UPI sale, then inspect Accounts transactions and Store reports.
  Expected: UPI uses the configured income mapping, split payments total exactly to the order payable amount, and account total matches completed non-reversed POS sales.

## POS Hold Resume

- [ ] Pass / [ ] Fail
  Setup: Product with stock and no open sale in cart.
  Steps: Add product to cart, click Hold Sale, open Held Orders, resume the held order and complete it through POS.
  Expected: Holding does not deduct stock, does not post income, restores the cart/customer on resume, and completion deducts stock and posts accounts exactly once.

- [ ] Pass / [ ] Fail
  Setup: Held order.
  Steps: Cancel held order with a reason, then try to resume it.
  Expected: Held order becomes Cancelled, stock/accounting remain unchanged, and cancelled/completed/reversed orders cannot be resumed.

## Cashier Session

- [ ] Pass / [ ] Fail
  Setup: Owner/Admin or Accountant.
  Steps: Open Cashier Sessions, enter opening cash and open a session, then try opening another session for the same user.
  Expected: Current session appears as Open and duplicate open session is blocked.

- [ ] Pass / [ ] Fail
  Setup: Open cashier session and completed cash/UPI/card sales.
  Steps: Review session summary, enter counted cash and close the session.
  Expected: Cash sales affect expected cash, UPI/Card do not increase physical expected cash, counted cash and variance are stored, and closed session rejects new sales.

## Sale Reversal Ledger

- [ ] Pass / [ ] Fail
  Setup: Completed POS sale with account posting.
  Steps: Reverse sale with a reason, inspect stock ledger, Accounts transactions and Store reports, then try reversing again.
  Expected: Stock restoration occurs once, one POS Sale Reversal account entry is created, repeated reversal is blocked, and reversed sale is excluded from revenue reports.

## Live Class WhatsApp Mock Notification

- [ ] Pass / [ ] Fail
  Setup: Communication Gateway connected in Mock mode with WhatsApp active and approved template available; live class scheduled for a class with active students/guardian mobiles.
  Steps: Open Live Class, select the schedule, enable WhatsApp, choose template, preview recipients, confirm Queue Notification.
  Expected: Audience summary and recipient/skipped counts are readable, duplicate phone recipients are skipped, mock WhatsApp job is queued, and no provider credentials or raw device token appear.

## Live Class SMS Mock Notification

- [ ] Pass / [ ] Fail
  Setup: Communication Gateway connected in Mock mode with SMS active and approved SMS template available.
  Steps: Open the same live class, enable SMS, choose template, preview recipients and queue notification.
  Expected: Mock SMS job is queued for only applicable class/section recipients and skipped missing-phone records are counted.

## Live Class Offline Notification

- [ ] Pass / [ ] Fail
  Setup: Live class and template selected, then disable internet/network.
  Steps: Click Queue Notification.
  Expected: UI shows `Internet connection is required for this action.` and does not mark notification as sent.

## Live Class Provider Disabled

- [ ] Pass / [ ] Fail
  Setup: Gateway connected but WhatsApp or SMS provider disabled.
  Steps: Attempt to queue the disabled channel for a live class.
  Expected: Schedule remains saved, a readable integration-not-active/provider-disabled message appears, and no falsely successful job is shown.

## Admission Form - Blank

- [ ] Pass / [ ] Fail
  Setup: Owner/Admin account, School Profile configured, optional Document Templates settings saved.
  Steps: Open Students -> Admission Form, choose Blank Admission Form, set form date, open print preview.
  Expected: A4 form opens with school header, blank child/guardian fields, document checklist, declaration and signatures; no student record or snapshot is created unless Issue / Save Form is clicked.

## Admission Form - Prefilled

- [ ] Pass / [ ] Fail
  Setup: Active student with date of birth, admission date and guardian details.
  Steps: Open Students -> Admission Form, choose Prefilled Admission Form, select the student.
  Expected: Student, class, admission, guardian and address fields populate; missing values remain blank and never show `undefined` or `null`.

## Admission Form With Photos

- [ ] Pass / [ ] Fail
  Setup: Local document/student photo assets available where configured.
  Steps: Preview the prefilled admission form.
  Expected: Available local images render at correct aspect ratio; missing photos show clean photo boxes without broken layout.

## Admission Form PDF Print

- [ ] Pass / [ ] Fail
  Setup: Admission Form preview visible.
  Steps: Click Print / Save PDF and inspect the system print preview.
  Expected: Sidebar/topbar are hidden, text is sharp vector text, A4 margins are clean and fields do not overflow.

## Transfer Certificate Draft

- [ ] Pass / [ ] Fail
  Setup: Active student with guardian and admission details.
  Steps: Open Students -> Transfer Certificates, select student, fill reason/dues/conduct, save draft.
  Expected: Draft is created with unique certificate and serial numbers, appears in the register and remains editable while status is Draft.

## Transfer Certificate Issue

- [ ] Pass / [ ] Fail
  Setup: Saved TC draft.
  Steps: Click Issue and confirm.
  Expected: Status changes to Issued, print preview displays TC identifiers and structured fields, and attempts to edit the issued record are blocked.

## Transfer Certificate Reprint

- [ ] Pass / [ ] Fail
  Setup: Issued TC.
  Steps: Click Reprint from the register.
  Expected: Reprint does not create a new certificate number, displays duplicate/reprint marking, and adds an audit entry only.

## Transfer Certificate Cancel

- [ ] Pass / [ ] Fail
  Setup: Issued TC that must be cancelled.
  Steps: Click Cancel, enter reason and confirm.
  Expected: Certificate status becomes Cancelled, history remains visible, certificate/serial numbers are not reusable, and cancelled print shows cancellation marking.

## Mark Student Transferred

- [ ] Pass / [ ] Fail
  Setup: Issued TC.
  Steps: Click Mark Student Transferred and confirm.
  Expected: Student is marked inactive/transferred through the explicit action only; printing or issuing the TC alone does not silently change student status.

## Fee Receipt Partial Payment

- [ ] Pass / [ ] Fail
  Setup: Student with fee invoice and a partial payment allocation.
  Steps: Open Fees -> Fees Paid Slip, view the partial-payment receipt.
  Expected: Receipt shows original receipt number, allocated invoice/particulars, amount paid in words and remaining balance.

## Fee Receipt Full Payment

- [ ] Pass / [ ] Fail
  Setup: Student invoice paid completely.
  Steps: View and print the final receipt.
  Expected: Receipt shows zero remaining balance and totals match the authoritative payment/allocation data.

## Fee Receipt Reprint

- [ ] Pass / [ ] Fail
  Setup: Existing fee receipt.
  Steps: Reopen receipt, choose A5 or Half-A4 format and print/save PDF.
  Expected: No second payment or Accounts entry is created; original receipt number is reused and print is sharp.

## Reversed Receipt

- [ ] Pass / [ ] Fail
  Setup: Reversed/cancelled fee receipt.
  Steps: Open the reversed receipt preview.
  Expected: Receipt displays `REVERSED / CANCELLED`, does not appear as a valid paid receipt, and reversal reason is visible where available.

## Parent Office Copy Printing

- [ ] Pass / [ ] Fail
  Setup: Existing receipt open in preview.
  Steps: Select Parent + Office Copy and print/save PDF.
  Expected: Two labelled copies appear on one A4 page, sidebar/topbar are hidden and the financial totals match exactly on both copies.

## Add Student Draft

- [ ] Pass / [ ] Fail
  Setup: Login as Owner/Admin with at least one active class and section.
  Steps: Open Students -> Add Student, verify generated application/admission numbers, enter minimum admission and child details, click Save Draft.
  Expected: Draft student saves, remains distinguishable from Active students, guardian/document/office sections keep entered values and no duplicate admission number is generated.

## Complete Student Admission

- [ ] Pass / [ ] Fail
  Setup: Draft admission or a new Add Student form with valid class/section/session.
  Steps: Complete required sections through Review & Save, click Admit Student.
  Expected: Student becomes Active, class/section/session assignment is saved, family/guardian records are linked and the success actions are shown.

## Child Details Admission Entry

- [ ] Pass / [ ] Fail
  Setup: Add Student form open.
  Steps: Enter DOB, admission date, Aadhaar, PEN, caste/category, nationality, religion, blood group, photo path and medical notes.
  Expected: Age is calculated from DOB to admission date, DOB words preview is readable, invalid Aadhaar/PEN values are rejected and missing optional values stay blank.

## Father Details Admission Entry

- [ ] Pass / [ ] Fail
  Setup: Add Student form open on Father Details.
  Steps: Enter father name, qualification, occupation, employer/organization, phone, WhatsApp, email, income, address, photo path and contact flags.
  Expected: A Father guardian record is created or updated, qualification/employer/address remain separate and primary/fee/SMS/pickup flags save correctly.

## Mother Details Admission Entry

- [ ] Pass / [ ] Fail
  Setup: Add Student form open on Mother Details.
  Steps: Enter mother name, qualification, occupation, employer/organization, contact fields, income, address, photo path and emergency-contact flag.
  Expected: A Mother guardian record is created or updated and can be displayed in Student Profile and the prefilled Admission Form.

## Different Guardian

- [ ] Pass / [ ] Fail
  Setup: Add Student form with father and mother details.
  Steps: Enable Guardian is different from parents, enter guardian relationship/contact/address and pickup/emergency flags, then save.
  Expected: Separate guardian is linked only when enabled; disabling the option does not create a blank guardian record.

## Same Guardian Family Detection

- [ ] Pass / [ ] Fail
  Setup: Existing family/guardian has a matching phone or email.
  Steps: Try creating another admission with the same guardian name/contact without selecting the existing family.
  Expected: Save is blocked with a clear duplicate warning; selecting the existing family links to it without duplicating guardians.

## Address And Communication

- [ ] Pass / [ ] Fail
  Setup: Add Student form open on Address & Contact.
  Steps: Fill residential address, locality, city, district, state, PIN, school distance, emergency contact, preferred SMS/WhatsApp number, transport and pickup point.
  Expected: Structured address/contact fields save and prefill the printable Admission Form; same-as-guardian behavior does not overwrite guardian records unexpectedly.

## Documents Checklist

- [ ] Pass / [ ] Fail
  Setup: Add Student form open on Documents Checklist.
  Steps: Mark required/optional documents as Received, Pending or Not Applicable; add notes and received date.
  Expected: Checklist persists after save/edit and appears on the Admission Form without being stored only as visual checkboxes.

## Office Use Admission Entry

- [ ] Pass / [ ] Fail
  Setup: Login as Owner/Admin; real fee receipt exists for the selected student where applicable.
  Steps: Fill approved by/date, select or type the real receipt number, mark Student ID issued, enter officer/principal approval and remarks.
  Expected: Office Use saves only for authorized roles, real receipt is linked to the student, and fake/wrong-student receipt numbers are rejected.

## Real Fee Receipt Linking

- [ ] Pass / [ ] Fail
  Setup: Student has an existing saved fee payment receipt.
  Steps: Edit the student admission, add that receipt in Office Use, save and reopen.
  Expected: Receipt number and payment ID persist; no new payment, invoice allocation or Accounts entry is created by the student form.

## After-Save Print Admission Form

- [ ] Pass / [ ] Fail
  Setup: Complete Student Admission succeeds.
  Steps: On the success panel click Print Admission Form.
  Expected: Prefilled Admission Form opens/prints from the newly saved authoritative data; printing creates no new student, guardian or payment records.

## Edit Student Admission Details

- [ ] Pass / [ ] Fail
  Setup: Existing admitted student with admission details and linked guardians.
  Steps: Open Students -> Edit, change roll number/contact/document status, save.
  Expected: Admission number is not regenerated, existing guardian links update safely and a warning reminds users that issued document snapshots remain historical.

## Existing Student Without Admission Row

- [ ] Pass / [ ] Fail
  Setup: Pre-v1.2 or legacy student with no `student_admission_details` row.
  Steps: Open Edit Student and open Students -> Admission Form -> Prefilled for that student.
  Expected: Student still opens; legacy student/guardian fields are used as fallback and missing admission-only fields remain blank.

## Admission Form Snapshot History

- [ ] Pass / [ ] Fail
  Setup: Prefilled Admission Form for a student.
  Steps: Issue/Save Admission Form Snapshot, then edit the student name or roll number and reopen the snapshot list.
  Expected: Saved snapshot remains unchanged; current prefilled form uses updated data only until a new snapshot is explicitly saved.

## Unsaved Changes Warning

- [ ] Pass / [ ] Fail
  Setup: Add/Edit Student form open with unsaved changes.
  Steps: Try closing the drawer or clicking outside it.
  Expected: User receives a confirmation warning; choosing cancel keeps all entered tab data.

## Admission Role Permissions

- [ ] Pass / [ ] Fail
  Setup: Accounts for Owner/Admin, Teacher, Accountant, Viewer and Student exist.
  Steps: Attempt Add Student, Office Use update and admission save through each role.
  Expected: Owner/Admin can admit and approve; unauthorized roles are blocked in UI and IPC, and Student accounts cannot access Add Student.
