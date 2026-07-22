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
