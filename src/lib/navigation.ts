import type { IconName } from '../components/Icon'
import type { PageId, PermissionRole } from '../types'

export interface NavigationTarget {
  page: PageId
  view?: string
}

export interface ErpMenuItem {
  id: string
  label: string
  description?: string
  target?: NavigationTarget
  availability?: 'missing' | 'online'
  roles?: PermissionRole[]
}

export interface ErpMenuGroup {
  id: string
  label: string
  icon: IconName
  target?: NavigationTarget
  roles?: PermissionRole[]
  items?: ErpMenuItem[]
}

export interface NavigationEntryDetails {
  id: string
  label: string
  module: string
  target?: NavigationTarget
}

const owners: PermissionRole[] = ['Owner', 'Admin']
const finance: PermissionRole[] = ['Owner', 'Admin', 'Accountant']
const academic: PermissionRole[] = ['Owner', 'Admin', 'Teacher']
const studentSelfService: PermissionRole[] = ['Student']
const employeeSelfService: PermissionRole[] = [
  'Admin',
  'Accountant',
  'Teacher',
  'Viewer',
]
const studentReaders: PermissionRole[] = [
  'Owner',
  'Admin',
  'Accountant',
  'Teacher',
  'Viewer',
]
const reportReaders: PermissionRole[] = [
  'Owner',
  'Admin',
  'Accountant',
  'Teacher',
  'Viewer',
]
const attendanceReaders: PermissionRole[] = [
  'Owner',
  'Admin',
  'Teacher',
  'Accountant',
]
const settingsReaders: PermissionRole[] = [
  'Owner',
  'Admin',
  'Accountant',
  'Teacher',
  'Viewer',
]
const gradingReaders: PermissionRole[] = [
  'Owner',
  'Admin',
  'Accountant',
  'Teacher',
]

export const erpNavigation: ErpMenuGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    target: { page: 'dashboard' },
    roles: studentReaders,
  },
  {
    id: 'student-portal',
    label: 'Student Dashboard',
    icon: 'students',
    target: { page: 'student-portal' },
    roles: studentSelfService,
  },
  {
    id: 'employee-portal',
    label: 'My Workspace',
    icon: 'user',
    target: { page: 'employee-portal' },
    roles: employeeSelfService,
  },
  {
    id: 'general-settings',
    label: 'General Settings',
    icon: 'settings',
    roles: settingsReaders,
    items: [
      { id: 'institute-profile', label: 'Institute Profile', target: { page: 'settings', view: 'profile' }, roles: finance },
      { id: 'academic-sessions', label: 'Academic Sessions', target: { page: 'academic-sessions', view: 'sessions' }, roles: owners },
      { id: 'fees-particulars', label: 'Fees Particulars', target: { page: 'settings', view: 'fee-heads' }, roles: owners },
      { id: 'fees-structure', label: 'Fees Structure', target: { page: 'settings', view: 'fee-structure' }, roles: owners },
      { id: 'discount-type', label: 'Discount Type', target: { page: 'settings', view: 'discount-types' }, roles: finance },
      { id: 'accounts-fees-invoice', label: 'Accounts For Fees Invoice', target: { page: 'settings', view: 'fee-invoice-accounts' }, roles: finance },
      { id: 'rules-regulations', label: 'Rules & Regulations', target: { page: 'settings', view: 'rules' }, roles: settingsReaders },
      { id: 'marks-grading', label: 'Marks Grading', target: { page: 'settings', view: 'marks-grading' }, roles: gradingReaders },
      { id: 'theme-language', label: 'Theme & Language', target: { page: 'settings', view: 'theme-language' }, roles: settingsReaders },
      { id: 'account-settings', label: 'Account Settings', target: { page: 'settings', view: 'account' }, roles: settingsReaders },
      { id: 'communication-integrations', label: 'Communication Integrations', target: { page: 'settings', view: 'communications' }, roles: owners },
      { id: 'users-roles', label: 'Users & Roles', target: { page: 'settings', view: 'users' }, roles: owners },
      { id: 'license', label: 'License', target: { page: 'settings', view: 'license' }, roles: finance },
      { id: 'backup-restore', label: 'Backup & Restore', target: { page: 'settings', view: 'backup' }, roles: owners },
      { id: 'about', label: 'About', target: { page: 'settings', view: 'about' }, roles: settingsReaders },
      { id: 'logout', label: 'Log out' },
    ],
  },
  {
    id: 'classes',
    label: 'Classes',
    icon: 'building',
    roles: owners,
    items: [
      { id: 'all-classes', label: 'All Classes', target: { page: 'settings', view: 'classes' } },
      { id: 'new-class', label: 'New Class', target: { page: 'settings', view: 'classes' } },
    ],
  },
  {
    id: 'subjects',
    label: 'Subjects',
    icon: 'exams',
    roles: academic,
    items: [
      { id: 'classes-with-subjects', label: 'Classes With Subjects', target: { page: 'exams', view: 'subjects' } },
      { id: 'assign-subjects', label: 'Assign Subjects', target: { page: 'exams', view: 'subjects' } },
    ],
  },
  {
    id: 'students',
    label: 'Students',
    icon: 'students',
    roles: studentReaders,
    items: [
      { id: 'all-students', label: 'All Students', target: { page: 'students', view: 'status-all' } },
      { id: 'add-student', label: 'Add New', target: { page: 'students', view: 'add' }, roles: owners },
      { id: 'import-students', label: 'Import Students', target: { page: 'students', view: 'import' }, roles: owners },
      { id: 'manage-families', label: 'Manage Families', target: { page: 'families', view: 'families' }, roles: studentReaders },
      { id: 'student-active-inactive', label: 'Active / Inactive', target: { page: 'students', view: 'status-all' } },
      { id: 'admission-letter', label: 'Admission Letter', target: { page: 'documents', view: 'admission-letter' }, roles: owners },
      { id: 'student-id-cards', label: 'Student ID Cards', target: { page: 'documents', view: 'id-cards' }, roles: owners },
      { id: 'student-basic-list', label: 'Print Basic List', target: { page: 'reports', view: 'students' }, roles: reportReaders },
      { id: 'student-login', label: 'Manage Login', target: { page: 'student-login-management' }, roles: owners },
      { id: 'promote-students', label: 'Promote Students', target: { page: 'academic-sessions', view: 'promote' }, roles: owners },
    ],
  },
  {
    id: 'employees',
    label: 'Employees',
    icon: 'user',
    roles: owners,
    items: [
      { id: 'all-employees', label: 'All Employees', target: { page: 'employees', view: 'all' } },
      { id: 'add-employee', label: 'Add New', target: { page: 'employees', view: 'add' } },
      { id: 'staff-id-cards', label: 'Staff ID Cards', target: { page: 'employees', view: 'id-cards' } },
      { id: 'job-letter', label: 'Job Letter', target: { page: 'employees', view: 'job-letter' } },
      { id: 'employee-login', label: 'Manage Login', target: { page: 'employee-login-management' } },
    ],
  },
  {
    id: 'accounts',
    label: 'Accounts',
    icon: 'wallet',
    roles: finance,
    items: [
      { id: 'chart-of-account', label: 'Chart Of Account', target: { page: 'accounts', view: 'chart' } },
      { id: 'add-income', label: 'Add Income', target: { page: 'accounts', view: 'income' } },
      { id: 'add-expense', label: 'Add Expense', target: { page: 'accounts', view: 'expense' } },
      { id: 'account-statement', label: 'Account Statement', target: { page: 'accounts', view: 'statement' } },
      { id: 'accounts-report-ledger', label: 'Accounts Report', target: { page: 'accounts', view: 'report' } },
    ],
  },
  {
    id: 'fees',
    label: 'Fees',
    icon: 'fees',
    roles: finance,
    items: [
      { id: 'generate-fees-invoice', label: 'Generate Fees Invoice', target: { page: 'fees', view: 'generate-invoice' } },
      { id: 'fee-invoice-list', label: 'Fee Invoice List', target: { page: 'fees', view: 'invoices' } },
      { id: 'collect-fees', label: 'Collect Fees', target: { page: 'fees', view: 'collect' } },
      { id: 'fees-paid-slip', label: 'Fees Paid Slip', target: { page: 'fees', view: 'receipts' } },
      { id: 'student-discounts', label: 'Student Discounts', target: { page: 'fees', view: 'discounts' }, roles: owners },
      { id: 'fees-defaulters', label: 'Fees Defaulters', target: { page: 'reports', view: 'fee-due' } },
      { id: 'carry-forward-dues', label: 'Carry Forward Dues', target: { page: 'academic-sessions', view: 'dues' } },
      { id: 'fees-report', label: 'Fees Report', target: { page: 'reports', view: 'daily' } },
      { id: 'delete-fees', label: 'Fee Reversal & Cancellation', target: { page: 'fees', view: 'reversal' }, roles: owners },
    ],
  },
  {
    id: 'salary',
    label: 'Salary',
    icon: 'wallet',
    roles: finance,
    items: [
      { id: 'pay-salary', label: 'Pay Salary', target: { page: 'salary', view: 'pay' } },
      { id: 'salary-paid-slip', label: 'Salary Paid Slip', target: { page: 'salary', view: 'slips' } },
      { id: 'salary-sheet', label: 'Salary Sheet', target: { page: 'salary', view: 'sheet' } },
      { id: 'salary-report', label: 'Salary Report', target: { page: 'salary', view: 'report' } },
    ],
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: 'attendance',
    roles: attendanceReaders,
    items: [
      { id: 'students-attendance', label: 'Students Attendance', target: { page: 'attendance', view: 'students' }, roles: academic },
      { id: 'employees-attendance', label: 'Employees Attendance', target: { page: 'attendance', view: 'employee-entry' }, roles: owners },
      { id: 'class-attendance-report', label: 'Class wise Report', target: { page: 'reports', view: 'attendance' }, roles: owners },
      { id: 'students-attendance-report', label: 'Students Attendance Report', target: { page: 'reports', view: 'attendance' }, roles: owners },
      { id: 'employees-attendance-report', label: 'Employees Attendance Report', target: { page: 'attendance', view: 'employee-daily' }, roles: finance },
    ],
  },
  {
    id: 'timetable',
    label: 'Timetable',
    icon: 'calendar',
    roles: academic,
    items: [
      { id: 'weekdays', label: 'Weekdays', target: { page: 'timetable', view: 'weekdays' }, roles: owners },
      { id: 'time-periods', label: 'Time Periods', target: { page: 'timetable', view: 'periods' }, roles: owners },
      { id: 'class-rooms', label: 'Class Rooms', target: { page: 'timetable', view: 'classrooms' }, roles: owners },
      { id: 'create-timetable', label: 'Create Timetable', target: { page: 'timetable', view: 'create' }, roles: owners },
      { id: 'timetable-class', label: 'Generate For Class', target: { page: 'timetable', view: 'class' } },
      { id: 'timetable-teacher', label: 'Generate For Teacher', target: { page: 'timetable', view: 'teacher' } },
    ],
  },
  {
    id: 'homework',
    label: 'Homework',
    icon: 'edit',
    roles: academic,
    items: [
      { id: 'homework-dashboard', label: 'Homework Dashboard', target: { page: 'homework', view: 'dashboard' } },
      { id: 'assign-homework', label: 'Assign Homework', target: { page: 'homework', view: 'assign' } },
      { id: 'homework-report', label: 'Homework Report', target: { page: 'homework', view: 'report' } },
    ],
  },
  {
    id: 'behaviour-skills',
    label: 'Behaviour & Skills',
    icon: 'check',
    roles: academic,
    items: [
      { id: 'rate-behaviours', label: 'Rate Behaviours', target: { page: 'behaviour-skills', view: 'behaviours' } },
      { id: 'rate-skills', label: 'Rate Skills', target: { page: 'behaviour-skills', view: 'skills' } },
      { id: 'observations', label: 'Observations', target: { page: 'behaviour-skills', view: 'observations' } },
      { id: 'affective-domain-report', label: 'Affective Domain Rating Report', target: { page: 'behaviour-skills', view: 'affective' } },
      { id: 'psychomotor-domain-report', label: 'Psychomotor Domain Rating Report', target: { page: 'behaviour-skills', view: 'psychomotor' } },
    ],
  },
  {
    id: 'store-pos',
    label: 'School Store & POS',
    icon: 'wallet',
    roles: finance,
    items: [
      { id: 'store-analytics', label: 'Store Analytics', target: { page: 'store', view: 'dashboard' } },
      { id: 'product-categories', label: 'Product Categories', target: { page: 'store', view: 'categories' } },
      { id: 'product-tax', label: 'Product Tax', target: { page: 'store', view: 'tax' } },
      { id: 'products', label: 'Products', target: { page: 'store', view: 'products' } },
      { id: 'inventory', label: 'Inventory', target: { page: 'store', view: 'inventory' } },
      { id: 'new-order', label: 'Point of Sale', target: { page: 'store', view: 'pos' } },
      { id: 'held-orders', label: 'Held Orders', target: { page: 'store', view: 'held' } },
      { id: 'all-orders', label: 'Sales History', target: { page: 'store', view: 'orders' } },
      { id: 'cashier-sessions', label: 'Cashier Sessions', target: { page: 'store', view: 'sessions' } },
      { id: 'store-reports', label: 'Store Reports', target: { page: 'store', view: 'reports' } },
      { id: 'pos-account-mapping', label: 'Account Mapping', target: { page: 'store', view: 'account-mapping' } },
    ],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: 'bell',
    roles: ['Owner', 'Admin', 'Accountant', 'Teacher', 'Viewer'],
    items: [
      { id: 'whatsapp-services', label: 'WhatsApp Services', target: { page: 'external-communications', view: 'whatsapp' }, roles: ['Owner', 'Admin', 'Accountant', 'Teacher', 'Viewer'] },
    ],
  },
  {
    id: 'messaging',
    label: 'Messaging',
    icon: 'bell',
    roles: ['Owner', 'Admin', 'Accountant', 'Teacher', 'Viewer', 'Student'],
    items: [
      {
        id: 'message-center',
        label: 'Local Message Center',
        target: { page: 'message-center', view: 'inbox' },
        roles: ['Owner', 'Admin', 'Accountant', 'Teacher', 'Viewer', 'Student'],
      },
    ],
  },
  {
    id: 'sms-services',
    label: 'SMS Services',
    icon: 'bell',
    roles: ['Owner', 'Admin', 'Accountant', 'Teacher', 'Viewer'],
    items: [
      { id: 'sms-gateway', label: 'SMS Gateway', target: { page: 'external-communications', view: 'sms' }, roles: ['Owner', 'Admin', 'Accountant', 'Teacher', 'Viewer'] },
      { id: 'sms-templates', label: 'SMS Templates', target: { page: 'external-communications', view: 'sms-templates' }, roles: ['Owner', 'Admin', 'Accountant', 'Teacher', 'Viewer'] },
    ],
  },
  {
    id: 'live-class',
    label: 'Live Class',
    icon: 'school',
    roles: ['Owner', 'Admin', 'Teacher', 'Viewer', 'Student'],
    items: [
      { id: 'live-class-services', label: 'Live Class', target: { page: 'live-class', view: 'schedule' }, roles: ['Owner', 'Admin', 'Teacher', 'Viewer', 'Student'] },
    ],
  },
  {
    id: 'question-paper',
    label: 'Question Paper',
    icon: 'exams',
    roles: academic,
    items: [
      { id: 'subject-chapters', label: 'Subject Chapters', target: { page: 'question-paper', view: 'chapters' } },
      { id: 'question-bank', label: 'Question Bank', target: { page: 'question-paper', view: 'questions' } },
      { id: 'create-question-paper', label: 'Create Question Paper', target: { page: 'question-paper', view: 'papers' } },
    ],
  },
  {
    id: 'exams',
    label: 'Exams',
    icon: 'exams',
    roles: academic,
    items: [
      { id: 'create-exam', label: 'Create New Exam', target: { page: 'exams', view: 'exams' } },
      { id: 'exam-marks', label: 'Add / Update Exam Marks', target: { page: 'exams', view: 'marks' } },
      { id: 'result-card', label: 'Result Card', target: { page: 'exams', view: 'marksheet' } },
      { id: 'exam-schedule', label: 'Exam Schedule', target: { page: 'exams', view: 'schedule' } },
      { id: 'date-sheet', label: 'Date Sheet', target: { page: 'exams', view: 'date-sheet' } },
      { id: 'result-sheet', label: 'Result Sheet', target: { page: 'exams', view: 'result-sheet' } },
      { id: 'blank-award-list', label: 'Blank Award List', target: { page: 'exams', view: 'blank-award-list' } },
    ],
  },
  {
    id: 'class-tests',
    label: 'Class Tests',
    icon: 'edit',
    roles: academic,
    items: [
      { id: 'manage-test-marks', label: 'Manage Test Marks', target: { page: 'class-tests', view: 'manage' } },
      { id: 'test-result', label: 'Test Result', target: { page: 'class-tests', view: 'result' } },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'reports',
    roles: reportReaders,
    items: [
      { id: 'students-report-card', label: 'Students Report Card', target: { page: 'reports', view: 'report-cards' }, roles: reportReaders },
      { id: 'students-info-report', label: 'Students Info Report', target: { page: 'reports', view: 'students' }, roles: studentReaders },
      { id: 'parents-info-report', label: 'Parents Info Report', target: { page: 'reports', view: 'parents-info' }, roles: studentReaders },
      { id: 'students-monthly-attendance', label: 'Students Monthly Attendance Report', target: { page: 'reports', view: 'attendance' }, roles: studentReaders },
      { id: 'staff-monthly-attendance', label: 'Staff Monthly Attendance Report', target: { page: 'attendance', view: 'employee-monthly' }, roles: finance },
      { id: 'fee-collection-report', label: 'Fee Collection Report', target: { page: 'reports', view: 'monthly' }, roles: finance },
      { id: 'student-progress-report', label: 'Student Progress Report', target: { page: 'reports', view: 'progress' }, roles: studentReaders },
      { id: 'accounts-report', label: 'Accounts Report', target: { page: 'accounts', view: 'report' }, roles: finance },
      { id: 'session-report', label: 'Session Report', target: { page: 'academic-sessions', view: 'report' }, roles: finance },
      { id: 'promotion-report', label: 'Promotion Report', target: { page: 'academic-sessions', view: 'history' }, roles: finance },
      { id: 'customised-reports', label: 'Customised Reports', target: { page: 'reports', view: 'custom' }, roles: reportReaders },
    ],
  },
  {
    id: 'certificates',
    label: 'Certificates',
    icon: 'reports',
    roles: owners,
    items: [
      { id: 'generate-certificate', label: 'Generate Certificate', target: { page: 'documents', view: 'certificates' } },
      { id: 'certificate-templates', label: 'Certificate Templates', target: { page: 'documents', view: 'templates' } },
    ],
  },
]

export function canSeeNavigationEntry(
  role: PermissionRole,
  roles?: PermissionRole[],
) {
  return !roles || roles.includes(role)
}

export function getNavigationEntryDetails(
  id: string,
): NavigationEntryDetails | undefined {
  for (const group of erpNavigation) {
    if (group.id === id) {
      return {
        id: group.id,
        label: group.label,
        module: group.label,
        target: group.target,
      }
    }

    const item = group.items?.find((entry) => entry.id === id)
    if (item) {
      return {
        id: item.id,
        label: item.label,
        module: group.label,
        target: item.target,
      }
    }
  }

  return undefined
}
