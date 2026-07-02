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
  guardian: string
  mobile: string
  status: StudentStatus
}

export interface Payment {
  id: string
  receiptNo: string
  studentName: string
  admissionNo: string
  className: string
  feeType: string
  amount: number
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer'
  date: string
  time: string
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Leave'

export interface AttendanceRecord {
  id: string
  rollNo: string
  admissionNo: string
  studentName: string
  className: string
  section: string
  status: AttendanceStatus
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
