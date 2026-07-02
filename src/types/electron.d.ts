import type {
  AttendanceRecord,
  CreateFeePaymentInput,
  CreateStudentInput,
  FeePayment,
  SaveAttendanceInput,
  SaveSchoolSettingsInput,
  SchoolSettings,
  Student,
  UpdateStudentInput,
} from './index'

export interface ErpApi {
  getStudents: () => Promise<Student[]>
  createStudent: (student: CreateStudentInput) => Promise<Student>
  updateStudent: (id: string, student: UpdateStudentInput) => Promise<Student>
  deleteStudent: (id: string) => Promise<{ success: boolean }>

  getSchoolSettings: () => Promise<SchoolSettings>
  saveSchoolSettings: (settings: SaveSchoolSettingsInput) => Promise<SchoolSettings>

  getFeePayments: () => Promise<FeePayment[]>
  createFeePayment: (payment: CreateFeePaymentInput) => Promise<FeePayment>

  getAttendance: () => Promise<AttendanceRecord[]>
  saveAttendance: (record: SaveAttendanceInput) => Promise<AttendanceRecord>
}

declare global {
  interface Window {
    erpApi: ErpApi
  }
}
