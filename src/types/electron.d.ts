import type {
  AccountCategory,
  AccountTransaction,
  AuditLog,
  AttendanceRecord,
  AttendanceSummary,
  AuthUser,
  BehaviourRating,
  BehaviourTrait,
  ClassItem,
  ClassTest,
  ClassTestMark,
  Classroom,
  CertificateTemplate,
  CreateCertificateTemplateInput,
  CreateBehaviourTraitInput,
  CreateAccountCategoryInput,
  CreateAccountTransactionInput,
  CreateClassInput,
  CreateClassTestInput,
  CreateClassroomInput,
  CreateQuestionInput,
  CreateQuestionPaperInput,
  CreateSubjectChapterInput,
  CreateEmployeeInput,
  CreateExamInput,
  CreateFirstOwnerInput,
  CreateFeePaymentInput,
  CreateFeeHeadInput,
  CreateFeeStructureInput,
  CreateSectionInput,
  CreateSalaryPaymentInput,
  CreateStudentInput,
  CreateStudentObservationInput,
  CreateSubjectInput,
  CreateSkillTraitInput,
  CreateTimetablePeriodInput,
  CreateTimetableWeekdayInput,
  CreateUserInput,
  DatabaseActionResult,
  DatabaseInfo,
  DemoDataResult,
  Employee,
  Exam,
  FeeHead,
  FeePayment,
  FeeStructure,
  Homework,
  HomeworkSubmission,
  IssueCertificateInput,
  IssuedCertificate,
  MarkRecord,
  LicenseStatus,
  SaveMarkInput,
  SaveBehaviourRatingInput,
  SaveAttendanceInput,
  SaveClassTestMarkInput,
  SaveHomeworkSubmissionInput,
  SaveSchoolSettingsInput,
  SaveSkillRatingInput,
  SalaryPayment,
  SchoolSettings,
  SectionItem,
  SaveTimetableEntryInput,
  Student,
  StudentObservation,
  StudentObservationFilter,
  StudentRatingFilter,
  StudentImportOptions,
  StudentImportResult,
  StudentImportRow,
  StudentImportTemplate,
  Subject,
  SubjectChapter,
  SkillRating,
  SkillTrait,
  QuestionBankItem,
  QuestionFilter,
  QuestionPaper,
  TimetableEntry,
  TimetablePeriod,
  TimetableWeekday,
  User,
  UpdateClassInput,
  UpdateBehaviourTraitInput,
  UpdateClassTestInput,
  UpdateClassTestMarkInput,
  UpdateCertificateTemplateInput,
  UpdateAccountCategoryInput,
  UpdateAccountTransactionInput,
  UpdateClassroomInput,
  UpdateQuestionInput,
  UpdateQuestionPaperInput,
  UpdateSubjectChapterInput,
  UpdateEmployeeInput,
  UpdateAttendanceInput,
  UpdateExamInput,
  UpdateFeeHeadInput,
  UpdateFeeStructureInput,
  UpdateHomeworkInput,
  UpdateHomeworkSubmissionInput,
  UpdateSectionInput,
  UpdateSalaryPaymentInput,
  UpdateStudentInput,
  UpdateStudentObservationInput,
  UpdateSubjectInput,
  UpdateSkillTraitInput,
  UpdateTimetablePeriodInput,
  UpdateTimetableWeekdayInput,
  UpdateMarkInput,
  UpdateUserInput,
  CreateHomeworkInput,
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

  getAccountCategories: () => Promise<AccountCategory[]>
  createAccountCategory: (
    input: CreateAccountCategoryInput,
  ) => Promise<AccountCategory>
  updateAccountCategory: (
    id: string,
    input: UpdateAccountCategoryInput,
  ) => Promise<AccountCategory>
  deleteAccountCategory: (id: string) => Promise<{ success: boolean }>
  getAccountTransactions: () => Promise<AccountTransaction[]>
  getAccountTransactionsByDateRange: (
    startDate: string,
    endDate: string,
  ) => Promise<AccountTransaction[]>
  createAccountTransaction: (
    input: CreateAccountTransactionInput,
  ) => Promise<AccountTransaction>
  updateAccountTransaction: (
    id: string,
    input: UpdateAccountTransactionInput,
  ) => Promise<AccountTransaction>
  deleteAccountTransaction: (id: string) => Promise<{ success: boolean }>

  getTimetableWeekdays: () => Promise<TimetableWeekday[]>
  createTimetableWeekday: (
    input: CreateTimetableWeekdayInput,
  ) => Promise<TimetableWeekday>
  updateTimetableWeekday: (
    id: string,
    input: UpdateTimetableWeekdayInput,
  ) => Promise<TimetableWeekday>
  deleteTimetableWeekday: (id: string) => Promise<{ success: boolean }>

  getTimetablePeriods: () => Promise<TimetablePeriod[]>
  createTimetablePeriod: (
    input: CreateTimetablePeriodInput,
  ) => Promise<TimetablePeriod>
  updateTimetablePeriod: (
    id: string,
    input: UpdateTimetablePeriodInput,
  ) => Promise<TimetablePeriod>
  deleteTimetablePeriod: (id: string) => Promise<{ success: boolean }>

  getClassrooms: () => Promise<Classroom[]>
  createClassroom: (input: CreateClassroomInput) => Promise<Classroom>
  updateClassroom: (
    id: string,
    input: UpdateClassroomInput,
  ) => Promise<Classroom>
  deleteClassroom: (id: string) => Promise<{ success: boolean }>

  getTimetableEntries: () => Promise<TimetableEntry[]>
  getTimetableByClass: (
    className: string,
    section: string,
  ) => Promise<TimetableEntry[]>
  getTimetableByTeacher: (
    teacherId: string,
  ) => Promise<TimetableEntry[]>
  createOrUpdateTimetableEntry: (
    input: SaveTimetableEntryInput,
  ) => Promise<TimetableEntry>
  deleteTimetableEntry: (id: string) => Promise<{ success: boolean }>

  getHomework: () => Promise<Homework[]>
  getHomeworkByClass: (
    className: string,
    section: string,
  ) => Promise<Homework[]>
  createHomework: (input: CreateHomeworkInput) => Promise<Homework>
  updateHomework: (
    id: string,
    input: UpdateHomeworkInput,
  ) => Promise<Homework>
  deleteHomework: (id: string) => Promise<{ success: boolean }>
  getHomeworkSubmissions: (
    homeworkId: string,
  ) => Promise<HomeworkSubmission[]>
  saveHomeworkSubmissionsBulk: (
    records: SaveHomeworkSubmissionInput[],
  ) => Promise<HomeworkSubmission[]>
  updateHomeworkSubmission: (
    id: string,
    input: UpdateHomeworkSubmissionInput,
  ) => Promise<HomeworkSubmission>

  getClassTests: () => Promise<ClassTest[]>
  getClassTestsByClass: (
    className: string,
    section: string,
  ) => Promise<ClassTest[]>
  createClassTest: (input: CreateClassTestInput) => Promise<ClassTest>
  updateClassTest: (
    id: string,
    input: UpdateClassTestInput,
  ) => Promise<ClassTest>
  deleteClassTest: (id: string) => Promise<{ success: boolean }>
  getClassTestMarks: (testId: string) => Promise<ClassTestMark[]>
  saveClassTestMarksBulk: (
    records: SaveClassTestMarkInput[],
  ) => Promise<ClassTestMark[]>
  updateClassTestMark: (
    id: string,
    input: UpdateClassTestMarkInput,
  ) => Promise<ClassTestMark>

  getSubjectChapters: () => Promise<SubjectChapter[]>
  getSubjectChaptersByClassSubject: (
    className: string,
    subjectName: string,
  ) => Promise<SubjectChapter[]>
  createSubjectChapter: (
    input: CreateSubjectChapterInput,
  ) => Promise<SubjectChapter>
  updateSubjectChapter: (
    id: string,
    input: UpdateSubjectChapterInput,
  ) => Promise<SubjectChapter>
  deleteSubjectChapter: (id: string) => Promise<{ success: boolean }>

  getQuestions: () => Promise<QuestionBankItem[]>
  getQuestionsByFilter: (
    filter: QuestionFilter,
  ) => Promise<QuestionBankItem[]>
  createQuestion: (input: CreateQuestionInput) => Promise<QuestionBankItem>
  updateQuestion: (
    id: string,
    input: UpdateQuestionInput,
  ) => Promise<QuestionBankItem>
  deleteQuestion: (id: string) => Promise<{ success: boolean }>

  getQuestionPapers: () => Promise<QuestionPaper[]>
  getQuestionPaperById: (id: string) => Promise<QuestionPaper | null>
  createQuestionPaper: (
    input: CreateQuestionPaperInput,
  ) => Promise<QuestionPaper>
  updateQuestionPaper: (
    id: string,
    input: UpdateQuestionPaperInput,
  ) => Promise<QuestionPaper>
  deleteQuestionPaper: (id: string) => Promise<{ success: boolean }>

  getBehaviourTraits: () => Promise<BehaviourTrait[]>
  createBehaviourTrait: (
    input: CreateBehaviourTraitInput,
  ) => Promise<BehaviourTrait>
  updateBehaviourTrait: (
    id: string,
    input: UpdateBehaviourTraitInput,
  ) => Promise<BehaviourTrait>
  deleteBehaviourTrait: (id: string) => Promise<{ success: boolean }>

  getSkillTraits: () => Promise<SkillTrait[]>
  createSkillTrait: (input: CreateSkillTraitInput) => Promise<SkillTrait>
  updateSkillTrait: (
    id: string,
    input: UpdateSkillTraitInput,
  ) => Promise<SkillTrait>
  deleteSkillTrait: (id: string) => Promise<{ success: boolean }>

  getBehaviourRatings: (
    filter: StudentRatingFilter,
  ) => Promise<BehaviourRating[]>
  saveBehaviourRatingsBulk: (
    records: SaveBehaviourRatingInput[],
  ) => Promise<BehaviourRating[]>

  getSkillRatings: (filter: StudentRatingFilter) => Promise<SkillRating[]>
  saveSkillRatingsBulk: (
    records: SaveSkillRatingInput[],
  ) => Promise<SkillRating[]>

  getStudentObservations: (
    filter: StudentObservationFilter,
  ) => Promise<StudentObservation[]>
  createStudentObservation: (
    input: CreateStudentObservationInput,
  ) => Promise<StudentObservation>
  updateStudentObservation: (
    id: string,
    input: UpdateStudentObservationInput,
  ) => Promise<StudentObservation>
  deleteStudentObservation: (id: string) => Promise<{ success: boolean }>

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
