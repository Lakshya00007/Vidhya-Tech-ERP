import type {
  AuditLog,
  AttendanceRecord,
  AttendanceSummary,
  AuthUser,
  ClassItem,
  CreateClassInput,
  CreateExamInput,
  CreateFirstOwnerInput,
  CreateFeePaymentInput,
  CreateFeeHeadInput,
  CreateFeeStructureInput,
  CreateSectionInput,
  CreateStudentInput,
  CreateSubjectInput,
  CreateUserInput,
  DatabaseActionResult,
  DatabaseInfo,
  Exam,
  FeeHead,
  FeePayment,
  FeeStructure,
  MarkRecord,
  SaveMarkInput,
  SaveAttendanceInput,
  SaveSchoolSettingsInput,
  SchoolSettings,
  SectionItem,
  Student,
  Subject,
  User,
  UpdateClassInput,
  UpdateAttendanceInput,
  UpdateExamInput,
  UpdateFeeHeadInput,
  UpdateFeeStructureInput,
  UpdateSectionInput,
  UpdateStudentInput,
  UpdateSubjectInput,
  UpdateMarkInput,
  UpdateUserInput,
} from './index'

export interface ErpApi {
  hasUsers: () => Promise<boolean>
  createFirstOwner: (input: CreateFirstOwnerInput) => Promise<AuthUser>
  login: (username: string, password: string) => Promise<AuthUser>
  logout: () => Promise<{ success: boolean }>
  getCurrentUser: () => Promise<AuthUser | null>
  changePassword: (
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) => Promise<{ success: boolean }>

  getUsers: () => Promise<User[]>
  createUser: (input: CreateUserInput) => Promise<User>
  updateUser: (id: string, input: UpdateUserInput) => Promise<User>
  resetUserPassword: (
    id: string,
    newPassword: string,
  ) => Promise<{ success: boolean }>
  deleteUser: (id: string) => Promise<{ success: boolean }>
  getAuditLogs: (limit?: number) => Promise<AuditLog[]>

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
  getAttendanceByDate: (date: string) => Promise<AttendanceRecord[]>
  getAttendanceByClassDate: (
    className: string,
    section: string,
    date: string,
  ) => Promise<AttendanceRecord[]>
  getAttendanceByDateRange: (
    startDate: string,
    endDate: string,
  ) => Promise<AttendanceRecord[]>
  getAttendanceSummary: (
    startDate: string,
    endDate: string,
  ) => Promise<AttendanceSummary>
  saveAttendance: (record: SaveAttendanceInput) => Promise<AttendanceRecord>
  saveAttendanceBulk: (
    records: SaveAttendanceInput[],
  ) => Promise<AttendanceRecord[]>
  updateAttendance: (
    id: string,
    input: UpdateAttendanceInput,
  ) => Promise<AttendanceRecord>

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

  getSubjects: () => Promise<Subject[]>
  createSubject: (input: CreateSubjectInput) => Promise<Subject>
  updateSubject: (id: string, input: UpdateSubjectInput) => Promise<Subject>
  deleteSubject: (id: string) => Promise<{ success: boolean }>

  getExams: () => Promise<Exam[]>
  createExam: (input: CreateExamInput) => Promise<Exam>
  updateExam: (id: string, input: UpdateExamInput) => Promise<Exam>
  deleteExam: (id: string) => Promise<{ success: boolean }>

  getMarks: () => Promise<MarkRecord[]>
  getMarksByExam: (examId: string) => Promise<MarkRecord[]>
  getMarksByStudentExam: (
    studentId: string,
    examId: string,
  ) => Promise<MarkRecord[]>
  saveMarksBulk: (records: SaveMarkInput[]) => Promise<MarkRecord[]>
  updateMark: (id: string, input: UpdateMarkInput) => Promise<MarkRecord>

  createDatabaseBackup: () => Promise<DatabaseActionResult>
  restoreDatabaseBackup: () => Promise<DatabaseActionResult>
  getDatabaseInfo: () => Promise<DatabaseInfo>
  openDatabaseFolder: () => Promise<DatabaseActionResult>
  restartApp: () => Promise<DatabaseActionResult>
}

declare global {
  interface Window {
    erpApi: ErpApi
  }
}
