import type {
  AttendanceRecord,
  ClassItem,
  CreateClassInput,
  CreateFeePaymentInput,
  CreateFeeHeadInput,
  CreateFeeStructureInput,
  CreateSectionInput,
  CreateStudentInput,
  FeeHead,
  FeePayment,
  FeeStructure,
  SaveAttendanceInput,
  SaveSchoolSettingsInput,
  SchoolSettings,
  SectionItem,
  Student,
  UpdateClassInput,
  UpdateFeeHeadInput,
  UpdateFeeStructureInput,
  UpdateSectionInput,
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
  getFeePaymentsByDateRange: (
    startDate: string,
    endDate: string,
  ) => Promise<FeePayment[]>
  createFeePayment: (payment: CreateFeePaymentInput) => Promise<FeePayment>

  getAttendance: () => Promise<AttendanceRecord[]>
  saveAttendance: (record: SaveAttendanceInput) => Promise<AttendanceRecord>

  getClasses: () => Promise<ClassItem[]>
  createClass: (input: CreateClassInput) => Promise<ClassItem>
  updateClass: (id: string, input: UpdateClassInput) => Promise<ClassItem>
  deleteClass: (id: string) => Promise<{ success: boolean }>

  getSections: () => Promise<SectionItem[]>
  createSection: (input: CreateSectionInput) => Promise<SectionItem>
  updateSection: (id: string, input: UpdateSectionInput) => Promise<SectionItem>
  deleteSection: (id: string) => Promise<{ success: boolean }>

  getFeeHeads: () => Promise<FeeHead[]>
  createFeeHead: (input: CreateFeeHeadInput) => Promise<FeeHead>
  updateFeeHead: (id: string, input: UpdateFeeHeadInput) => Promise<FeeHead>
  deleteFeeHead: (id: string) => Promise<{ success: boolean }>

  getFeeStructures: () => Promise<FeeStructure[]>
  createFeeStructure: (input: CreateFeeStructureInput) => Promise<FeeStructure>
  updateFeeStructure: (
    id: string,
    input: UpdateFeeStructureInput,
  ) => Promise<FeeStructure>
  deleteFeeStructure: (id: string) => Promise<{ success: boolean }>
}

declare global {
  interface Window {
    erpApi: ErpApi
  }
}
