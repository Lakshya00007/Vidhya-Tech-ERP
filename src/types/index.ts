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

export type MasterStatus = 'Active' | 'Inactive'
export type SyncStatus = 'pending' | 'synced'

export interface ClassItem {
  id: string
  name: string
  displayOrder: number
  status: MasterStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateClassInput {
  name: string
  displayOrder?: number
  status?: MasterStatus
}

export type UpdateClassInput = Partial<CreateClassInput>

export interface SectionItem {
  id: string
  classId: string
  className: string
  name: string
  status: MasterStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateSectionInput {
  classId: string
  name: string
  status?: MasterStatus
}

export type UpdateSectionInput = Partial<CreateSectionInput>

export type FeeFrequency =
  | 'Monthly'
  | 'Quarterly'
  | 'Half-Yearly'
  | 'Yearly'
  | 'One-Time'

export interface FeeHead {
  id: string
  name: string
  description: string
  frequency: FeeFrequency
  status: MasterStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateFeeHeadInput {
  name: string
  description?: string
  frequency: FeeFrequency
  status?: MasterStatus
}

export type UpdateFeeHeadInput = Partial<CreateFeeHeadInput>

export interface FeeStructure {
  id: string
  className: string
  feeHeadId: string
  feeHeadName: string
  amount: number
  academicYear: string
  status: MasterStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateFeeStructureInput {
  className: string
  feeHeadId: string
  amount: number
  academicYear?: string
  status?: MasterStatus
}

export type UpdateFeeStructureInput = Partial<CreateFeeStructureInput>

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

export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Cheque'

export interface FeePayment {
  id: string
  receiptNo: string
  studentId: string | null
  studentName: string
  admissionNo: string
  className: string
  section: string
  guardianName: string
  mobile: string
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
  studentId: string
  feeType: string
  amount: number
  paymentMode: PaymentMode
  paymentDate: string
  notes?: string
}

export type Receipt = FeePayment

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
