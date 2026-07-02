export type PageId =
  | 'dashboard'
  | 'students'
  | 'fees'
  | 'attendance'
  | 'exams'
  | 'reports'
  | 'settings'

export type StudentStatus = 'Active' | 'Inactive'

export interface Student {
  id: string
  admissionNo: string
  name: string
  className: string
  section: string
  guardianName: string
  mobile: string
  status: StudentStatus
  address: string
  dateOfBirth: string
  admissionDate: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: 'pending' | 'synced'
}

export interface CreateStudentInput {
  admissionNo?: string
  name: string
  className: string
  section?: string
  guardianName?: string
  mobile?: string
  status?: StudentStatus
  address?: string
  dateOfBirth?: string
  admissionDate?: string
}

export type UpdateStudentInput = Partial<CreateStudentInput>

export interface SchoolSettings {
  id: string
  schoolName: string
  address: string
  phone: string
  email: string
  academicYear: string
  receiptPrefix: string
  createdAt: string
  updatedAt: string
}

export type SaveSchoolSettingsInput = Pick<
  SchoolSettings,
  'schoolName' | 'address' | 'phone' | 'email' | 'academicYear' | 'receiptPrefix'
>

export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer'

export interface FeePayment {
  id: string
  receiptNo: string
  studentId: string | null
  studentName: string
  admissionNo: string
  className: string
  feeType: string
  amount: number
  paymentMode: PaymentMode
  paymentDate: string
  notes: string
  createdAt: string
  updatedAt: string
  syncStatus: 'pending' | 'synced'
}

export interface CreateFeePaymentInput {
  receiptNo?: string
  studentId?: string
  studentName: string
  className?: string
  feeType?: string
  amount: number
  paymentMode?: PaymentMode
  paymentDate?: string
  notes?: string
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Leave'

export interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  className: string
  section: string
  attendanceDate: string
  status: AttendanceStatus
  createdAt?: string
  updatedAt?: string
  syncStatus?: 'pending' | 'synced'
  rollNo?: string
  admissionNo?: string
}

export type SaveAttendanceInput = Omit<
  AttendanceRecord,
  'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'rollNo' | 'admissionNo'
> & {
  id?: string
}

export interface Exam {
  id: string
  name: string
  classes: string
  startDate: string
  endDate: string
  status: 'Upcoming' | 'Completed' | 'In Progress'
}

export interface MarkEntry {
  id: string
  rollNo: string
  studentName: string
  maximumMarks: number
  marksObtained: number
  grade: string
}
