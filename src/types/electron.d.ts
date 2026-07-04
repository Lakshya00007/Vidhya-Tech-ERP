import type {
  AuditLog,
  AttendanceRecord,
  AttendanceSummary,
  AuthUser,
  ClassItem,
  CertificateTemplate,
  CreateCertificateTemplateInput,
  CreateClassInput,
  CreateEmployeeInput,
  CreateExamInput,
  CreateFirstOwnerInput,
  CreateFeePaymentInput,
  CreateFeeHeadInput,
  CreateFeeStructureInput,
  CreateSectionInput,
  CreateSalaryPaymentInput,
  CreateStudentInput,
  CreateSubjectInput,
  CreateUserInput,
  DatabaseActionResult,
  DatabaseInfo,
  DemoDataResult,
  Employee,
  Exam,
  FeeHead,
  FeePayment,
  FeeStructure,
  IssueCertificateInput,
  IssuedCertificate,
  MarkRecord,
  LicenseStatus,
  SaveMarkInput,
  SaveAttendanceInput,
  SaveSchoolSettingsInput,
  SalaryPayment,
  SchoolSettings,
  SectionItem,
  Student,
  StudentImportOptions,
  StudentImportResult,
  StudentImportRow,
  StudentImportTemplate,
  Subject,
  User,
  UpdateClassInput,
  UpdateCertificateTemplateInput,
  UpdateEmployeeInput,
  UpdateAttendanceInput,
  UpdateExamInput,
  UpdateFeeHeadInput,
  UpdateFeeStructureInput,
  UpdateSectionInput,
  UpdateSalaryPaymentInput,
  UpdateStudentInput,
  UpdateSubjectInput,
  UpdateMarkInput,
  UpdateUserInput,
} from './index'

export interface ErpApi {
  getDeviceId: () => Promise<string>
  getLicenseStatus: () => Promise<LicenseStatus>
  activateLicense: (licenseKey: string) => Promise<LicenseStatus>
  deactivateLicense: () => Promise<{ success: boolean; message: string }>
  getLicenseInfo: () => Promise<LicenseStatus>

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
  createDemoData: () => Promise<DemoDataResult>

  getStudents: () => Promise<Student[]>
  createStudent: (student: CreateStudentInput) => Promise<Student>
  updateStudent: (id: string, student: UpdateStudentInput) => Promise<Student>
  deleteStudent: (id: string) => Promise<{ success: boolean }>
  importStudentsBulk: (
    rows: StudentImportRow[],
    options: StudentImportOptions,
  ) => Promise<StudentImportResult>
  getStudentImportTemplate: () => Promise<StudentImportTemplate>

  getEmployees: () => Promise<Employee[]>
  getEmployeeById: (id: string) => Promise<Employee | null>
  createEmployee: (input: CreateEmployeeInput) => Promise<Employee>
  updateEmployee: (id: string, input: UpdateEmployeeInput) => Promise<Employee>
  deleteEmployee: (id: string) => Promise<{ success: boolean }>

  getSalaryPayments: () => Promise<SalaryPayment[]>
  getSalaryPaymentsByDateRange: (
    startDate: string,
    endDate: string,
  ) => Promise<SalaryPayment[]>
  getSalaryPaymentsByEmployee: (
    employeeId: string,
  ) => Promise<SalaryPayment[]>
  createSalaryPayment: (
    input: CreateSalaryPaymentInput,
  ) => Promise<SalaryPayment>
  updateSalaryPayment: (
    id: string,
    input: UpdateSalaryPaymentInput,
  ) => Promise<SalaryPayment>
  deleteSalaryPayment: (id: string) => Promise<{ success: boolean }>

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

  getCertificateTemplates: () => Promise<CertificateTemplate[]>
  createCertificateTemplate: (
    input: CreateCertificateTemplateInput,
  ) => Promise<CertificateTemplate>
  updateCertificateTemplate: (
    id: string,
    input: UpdateCertificateTemplateInput,
  ) => Promise<CertificateTemplate>
  deleteCertificateTemplate: (id: string) => Promise<{ success: boolean }>
  issueCertificate: (
    input: IssueCertificateInput,
  ) => Promise<IssuedCertificate>
  getIssuedCertificates: () => Promise<IssuedCertificate[]>
  getIssuedCertificatesByStudent: (
    studentId: string,
  ) => Promise<IssuedCertificate[]>

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
