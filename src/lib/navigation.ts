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
  locked?: boolean
  feature?: string
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

const owners: PermissionRole[] = ['Owner', 'Admin']
const finance: PermissionRole[] = ['Owner', 'Admin', 'Accountant']
const academic: PermissionRole[] = ['Owner', 'Admin', 'Teacher']
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
  'Viewer',
]

const placeholder = (id: string, label: string, options?: Partial<ErpMenuItem>) => ({
  id,
  label,
  ...options,
})

export const erpNavigation: ErpMenuGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    target: { page: 'dashboard' },
    roles: studentReaders,
  },
  {
    id: 'general-settings',
    label: 'General Settings',
    icon: 'settings',
    roles: finance,
    items: [
      { id: 'institute-profile', label: 'Institute Profile', target: { page: 'settings', view: 'profile' } },
      { id: 'fees-particulars', label: 'Fees Particulars', target: { page: 'settings', view: 'fee-heads' }, roles: owners },
      { id: 'fees-structure', label: 'Fees Structure', target: { page: 'settings', view: 'fee-structure' }, roles: owners },
      placeholder('discount-type', 'Discount Type', { roles: owners }),
      placeholder('accounts-fees-invoice', 'Accounts For Fees Invoice', { roles: finance }),
      placeholder('rules-regulations', 'Rules & Regulations', { roles: owners }),
      placeholder('marks-grading', 'Marks Grading', { roles: owners }),
      placeholder('theme-language', 'Theme & Language', { roles: owners }),
      placeholder('account-settings', 'Account Settings', { roles: owners }),
      { id: 'users-roles', label: 'Users & Roles', target: { page: 'settings', view: 'users' }, roles: owners },
      { id: 'license', label: 'License', target: { page: 'settings', view: 'license' } },
      { id: 'backup-restore', label: 'Backup & Restore', target: { page: 'settings', view: 'backup' }, roles: owners },
      { id: 'about', label: 'About', target: { page: 'settings', view: 'about' } },
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
      { id: 'all-students', label: 'All Students', target: { page: 'students' } },
      { id: 'add-student', label: 'Add New', target: { page: 'students', view: 'add' }, roles: owners },
      { id: 'import-students', label: 'Import Students', target: { page: 'students', view: 'import' }, roles: owners },
      placeholder('manage-families', 'Manage Families', { locked: true, feature: 'student-families', roles: owners }),
      placeholder('student-active-inactive', 'Active / Inactive'),
      { id: 'admission-letter', label: 'Admission Letter', target: { page: 'documents', view: 'admission-letter' }, roles: owners },
      { id: 'student-id-cards', label: 'Student ID Cards', target: { page: 'documents', view: 'id-cards' }, roles: owners },
      { id: 'student-basic-list', label: 'Print Basic List', target: { page: 'reports', view: 'students' }, roles: reportReaders },
      placeholder('student-login', 'Manage Login', { roles: owners }),
      placeholder('promote-students', 'Promote Students', { roles: owners }),
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
      placeholder('employee-login', 'Manage Login', {
        description: 'Employee login linking will be available in next release.',
      }),
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
    ],
  },
  {
    id: 'fees',
    label: 'Fees',
    icon: 'fees',
    roles: finance,
    items: [
      placeholder('generate-fees-invoice', 'Generate Fees Invoice'),
      { id: 'collect-fees', label: 'Collect Fees', target: { page: 'fees' } },
      { id: 'fees-paid-slip', label: 'Fees Paid Slip', target: { page: 'fees' } },
      { id: 'fees-defaulters', label: 'Fees Defaulters', target: { page: 'reports', view: 'fee-due' } },
      { id: 'fees-report', label: 'Fees Report', target: { page: 'reports', view: 'daily' } },
      placeholder('delete-fees', 'Delete Fees', { locked: true, feature: 'delete-fees', roles: owners }),
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
    roles: academic,
    items: [
      { id: 'students-attendance', label: 'Students Attendance', target: { page: 'attendance' } },
      placeholder('employees-attendance', 'Employees Attendance', { roles: owners }),
      { id: 'class-attendance-report', label: 'Class wise Report', target: { page: 'reports', view: 'attendance' }, roles: owners },
      { id: 'students-attendance-report', label: 'Students Attendance Report', target: { page: 'reports', view: 'attendance' }, roles: owners },
      placeholder('employees-attendance-report', 'Employees Attendance Report', { roles: owners }),
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
    label: 'Online Store & POS',
    icon: 'wallet',
    roles: finance,
    items: [
      placeholder('store-analytics', 'Store Analytics', { locked: true, feature: 'store-pos' }),
      placeholder('product-categories', 'Product Categories', { locked: true, feature: 'store-pos' }),
      placeholder('product-tax', 'Product Tax', { locked: true, feature: 'store-pos' }),
      placeholder('products', 'Products', { locked: true, feature: 'store-pos' }),
      placeholder('new-order', 'New Order', { locked: true, feature: 'store-pos' }),
      placeholder('all-orders', 'All Orders', { locked: true, feature: 'store-pos' }),
    ],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: 'bell',
    roles: owners,
    items: [
      placeholder('whatsapp-services', 'WhatsApp Services', { locked: true, feature: 'whatsapp' }),
    ],
  },
  {
    id: 'messaging',
    label: 'Messaging',
    icon: 'bell',
    roles: ['Owner', 'Admin', 'Accountant', 'Teacher'],
    items: [placeholder('message-center', 'Message Center')],
  },
  {
    id: 'sms-services',
    label: 'SMS Services',
    icon: 'bell',
    roles: owners,
    items: [
      placeholder('free-sms-gateway', 'Free SMS Gateway'),
      placeholder('branded-sms', 'Branded SMS', { locked: true, feature: 'branded-sms' }),
      placeholder('sms-templates', 'SMS Templates', { locked: true, feature: 'branded-sms' }),
    ],
  },
  {
    id: 'live-class',
    label: 'Live Class',
    icon: 'school',
    roles: academic,
    items: [
      placeholder('live-class-services', 'Live Class', { locked: true, feature: 'live-class' }),
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
      placeholder('result-sheet', 'Result Sheet', { locked: true, feature: 'exam-advanced' }),
      placeholder('exam-schedule', 'Exam Schedule', { locked: true, feature: 'exam-advanced' }),
      placeholder('date-sheet', 'Date Sheet', { locked: true, feature: 'exam-advanced' }),
      placeholder('blank-award-list', 'Blank Award List', { locked: true, feature: 'exam-advanced' }),
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
      placeholder('students-report-card', 'Students Report Card'),
      { id: 'students-info-report', label: 'Students Info Report', target: { page: 'reports', view: 'students' } },
      placeholder('parents-info-report', 'Parents Info Report'),
      placeholder('students-monthly-attendance', 'Students Monthly Attendance Report', { locked: true, feature: 'advanced-reports' }),
      placeholder('staff-monthly-attendance', 'Staff Monthly Attendance Report', { locked: true, feature: 'advanced-reports' }),
      { id: 'fee-collection-report', label: 'Fee Collection Report', target: { page: 'reports', view: 'monthly' } },
      placeholder('student-progress-report', 'Student Progress Report', { locked: true, feature: 'advanced-reports' }),
      { id: 'accounts-report', label: 'Accounts Report', target: { page: 'accounts', view: 'report' }, roles: finance },
      placeholder('customised-reports', 'Customised Reports', { locked: true, feature: 'advanced-reports' }),
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
