import type {
  AccountCategory,
  AccountProfileInput,
  AccountTransaction,
  AcademicSession,
  AppPreference,
  AuditLog,
  AttendanceRecord,
  AttendanceSummary,
  AuthUser,
  BehaviourRating,
  BehaviourTrait,
  CarryForwardDue,
  CarryForwardDueFilter,
  ClassItem,
  ClassTest,
  ClassTestMark,
  Classroom,
  CertificateTemplate,
  AdmissionFormData,
  AdmissionFormSnapshot,
  CreateCertificateTemplateInput,
  CreateAcademicSessionInput,
  CreateBehaviourTraitInput,
  CreateAccountCategoryInput,
  CreateAccountTransactionInput,
  CreateSchoolRuleInput,
  CreateClassInput,
  CreateClassTestInput,
  CreateClassroomInput,
  CreateQuestionInput,
  CreateQuestionPaperInput,
  CreateSubjectChapterInput,
  CreateEmployeeInput,
  CreateEmployeeLoginAccountInput,
  CreateExamInput,
  CreateDiscountTypeInput,
  CreateFirstOwnerInput,
  CreateFeeInvoiceInput,
  CreateFeePaymentInput,
  CreateFamilyInput,
  CreateFeeHeadInput,
  CreateFeeStructureInput,
  CreateGuardianInput,
  CreateStudentDiscountInput,
  CreateStudentLoginAccountInput,
  CreateSectionInput,
  CreateSalaryPaymentInput,
  CreateStudentInput,
  CreateStudentObservationInput,
  CreateSubjectInput,
  CreateSkillTraitInput,
  CreateTimetablePeriodInput,
  CreateTimetableWeekdayInput,
  CreateUserInput,
  ChangeCurrentPasswordInput,
  ChangeTemporaryPasswordInput,
  CalculateGradeInput,
  CalculateGradeResult,
  ClassResultSummary,
  CommunicationGatewaySettings,
  CommunicationTemplate,
  ConfigureCommunicationGatewayInput,
  DatabaseActionResult,
  DatabaseInfo,
  DemoDataResult,
  DiscountType,
  DocumentTemplateSettings,
  DocumentTemplateType,
  UpdateDocumentTemplateSettingInput,
  Employee,
  EmployeeLoginAccount,
  EmployeeLoginFilter,
  EmployeePortalData,
  EmployeeAttendanceFilter,
  EmployeeAttendanceRecord,
  EmployeeAttendanceReport,
  EmployeeAttendanceSummary,
  EmployeeMonthlyAttendance,
  Exam,
  FeeInvoice,
  FeeInvoiceAccountsReport,
  FeeInvoiceAccountMapping,
  FeeInvoiceAllocationInput,
  FeeInvoiceAllocationResult,
  FeeInvoiceFilter,
  FeeInvoicePreview,
  FeeInvoicePreviewInput,
  FeeInvoiceSummary,
  FeeHead,
  FeePayment,
  FeeReceiptPrintData,
  FeePaymentReversalResult,
  FeeStructure,
  Family,
  FamilyFilter,
  FamilyProfile,
  GenerateClassReportCardsInput,
  GenerateClassReportCardsResult,
  GenerateReportCardInput,
  GradingScheme,
  CreateGradingSchemeInput,
  Guardian,
  GuardianFilter,
  Homework,
  HomeworkSubmission,
  IssueCertificateInput,
  IssuedCertificate,
  MarkRecord,
  MasterStatus,
  LicenseStatus,
  LoginHistoryEntry,
  LoginHistoryFilter,
  LinkGuardianToStudentInput,
  LinkSiblingStudentsInput,
  ManagedImageResult,
  ManagedImageSelectionInput,
  Announcement,
  AnnouncementInput,
  AnnouncementReadReport,
  CreateDirectMessageInput,
  RemoteLicenseStatus,
  MessageDeliveryReport,
  MessageFilter,
  MessageRecipientCandidate,
  MessageThreadDetail,
  MessageThreadSummary,
  ParentsInfoReport,
  ParentsInfoReportFilter,
  ReplyToMessageThreadInput,
  EmergencyContactsReport,
  ExternalCommunicationChannel,
  ExternalCommunicationJob,
  ExternalRecipientPreview,
  ReportCardFilter,
  ReportCardPreview,
  ReportCardPreviewInput,
  ReportCardTemplate,
  ReportCardTemplateInput,
  ResultPosition,
  SaveMarkInput,
  SaveBehaviourRatingInput,
  SaveAttendanceInput,
  SaveClassTestMarkInput,
  SaveHomeworkSubmissionInput,
  SaveSchoolSettingsInput,
  SaveFeeInvoiceAccountMappingInput,
  SaveSkillRatingInput,
  SaveEmployeeAttendanceInput,
  SalaryPayment,
  SchoolSettings,
  SectionItem,
  SaveTimetableEntryInput,
  SendExternalBatchInput,
  SendExternalMessageInput,
  Student,
  StudentAdmissionNumbers,
  StudentAdmissionProfile,
  StudentAdmissionSaveInput,
  StudentGuardianLink,
  StudentDiscount,
  StudentDiscountFilter,
  StudentLoginAccount,
  StudentLoginFilter,
  StudentPortalData,
  StudentFeeLedgerEntry,
  StudentObservation,
  StudentObservationFilter,
  StudentReportCard,
  SchoolRule,
  SchoolRuleFilter,
  StudentRatingFilter,
  StudentImportOptions,
  StudentImportResult,
  StudentImportRow,
  StudentImportTemplate,
  Subject,
  SubjectChapter,
  SkillRating,
  SkillTrait,
  SiblingReport,
  QuestionBankItem,
  QuestionFilter,
  QuestionPaper,
  PromotionPreview,
  PromotionPreviewInput,
  PromoteStudentsInput,
  SessionReport,
  SaveStudentSessionHistoryInput,
  StudentPromotion,
  StudentSessionHistory,
  TransferCertificate,
  TransferCertificateInput,
  TransferCertificatePreview,
  TimetableEntry,
  TimetablePeriod,
  TimetableWeekday,
  User,
  UpdateClassInput,
  UpdateAcademicSessionInput,
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
  UpdateEmployeeAttendanceInput,
  UpdateAttendanceInput,
  UpdateCarryForwardDueInput,
  UpdateDiscountTypeInput,
  UpdateExamInput,
  UpdateFamilyInput,
  UpdateFeeHeadInput,
  UpdateFeeStructureInput,
  UpdateGuardianInput,
  UpdateHomeworkInput,
  UpdateHomeworkSubmissionInput,
  UpdateSectionInput,
  UpdateSalaryPaymentInput,
  UpdateStudentInput,
  UpdateStudentGuardianLinkInput,
  UpdateStudentDiscountInput,
  UpdateStudentObservationInput,
  UpdateSubjectInput,
  UpdateSkillTraitInput,
  UpdateTimetablePeriodInput,
  UpdateTimetableWeekdayInput,
  UpdateMarkInput,
  UpdateGradingSchemeInput,
  UpdateReportCardRemarksInput,
  UpdateReportCardTemplateInput,
  UpdateUserInput,
  UpdatePreferenceInput,
  UpdateSchoolRuleInput,
  UpdateEmployeeLoginAccountInput,
  UpdateAnnouncementInput,
  UpdateStudentLoginAccountInput,
  CreateHomeworkInput,
  ReorderSchoolRuleInput,
  ResetLoginPasswordInput,
  UserEntityLink,
} from './index'

// Dynamic IPC report rows are validated in the Electron main process.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IpcRecord = Record<string, any>

export interface ErpApi {
  getDeviceId: () => Promise<string>
  getLicenseStatus: () => Promise<LicenseStatus>
  activateLicense: (licenseKey: string) => Promise<LicenseStatus>
  updateLicenseKey: (licenseKey: string) => Promise<LicenseStatus>
  deactivateLicense: () => Promise<{ success: boolean; message: string }>
  getLicenseInfo: () => Promise<LicenseStatus>
  checkRemoteLicenseNow: () => Promise<RemoteLicenseStatus>
  getRemoteLicenseStatus: () => Promise<RemoteLicenseStatus>

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
  changeTemporaryPassword: (
    input: ChangeTemporaryPasswordInput,
  ) => Promise<AuthUser>
  getCurrentAccountProfile: () => Promise<AuthUser>
  updateCurrentAccountProfile: (
    input: AccountProfileInput,
  ) => Promise<AuthUser>
  changeCurrentPassword: (
    input: ChangeCurrentPasswordInput,
  ) => Promise<{ success: boolean }>
  getCurrentLoginHistory: (
    filter?: LoginHistoryFilter,
  ) => Promise<LoginHistoryEntry[]>
  getCurrentUserEntityLink: () => Promise<UserEntityLink | null>
  getCurrentStudentPortalData: () => Promise<StudentPortalData>
  getCurrentEmployeePortalData: () => Promise<EmployeePortalData>

  getUsers: () => Promise<User[]>
  createUser: (input: CreateUserInput) => Promise<User>
  updateUser: (id: string, input: UpdateUserInput) => Promise<User>
  resetUserPassword: (
    id: string,
    newPassword: string,
  ) => Promise<{ success: boolean }>
  deleteUser: (id: string) => Promise<{ success: boolean }>
  getAuditLogs: (limit?: number) => Promise<AuditLog[]>
  getStudentLoginAccounts: (
    filter?: StudentLoginFilter,
  ) => Promise<StudentLoginAccount[]>
  createStudentLoginAccount: (
    input: CreateStudentLoginAccountInput,
  ) => Promise<StudentLoginAccount>
  updateStudentLoginAccount: (
    id: string,
    input: UpdateStudentLoginAccountInput,
  ) => Promise<StudentLoginAccount>
  disableStudentLoginAccount: (
    id: string,
    reason: string,
  ) => Promise<StudentLoginAccount>
  enableStudentLoginAccount: (id: string) => Promise<StudentLoginAccount>
  resetStudentLoginPassword: (
    id: string,
    input: ResetLoginPasswordInput,
  ) => Promise<{ success: boolean }>
  unlinkStudentLoginAccount: (id: string) => Promise<{ success: boolean }>
  getEmployeeLoginAccounts: (
    filter?: EmployeeLoginFilter,
  ) => Promise<EmployeeLoginAccount[]>
  createEmployeeLoginAccount: (
    input: CreateEmployeeLoginAccountInput,
  ) => Promise<EmployeeLoginAccount>
  updateEmployeeLoginAccount: (
    id: string,
    input: UpdateEmployeeLoginAccountInput,
  ) => Promise<EmployeeLoginAccount>
  disableEmployeeLoginAccount: (
    id: string,
    reason: string,
  ) => Promise<EmployeeLoginAccount>
  enableEmployeeLoginAccount: (id: string) => Promise<EmployeeLoginAccount>
  resetEmployeeLoginPassword: (
    id: string,
    input: ResetLoginPasswordInput,
  ) => Promise<{ success: boolean }>
  unlinkEmployeeLoginAccount: (id: string) => Promise<{ success: boolean }>
  getMessageInbox: (
    filter?: MessageFilter,
  ) => Promise<MessageThreadSummary[]>
  getSentMessages: (
    filter?: MessageFilter,
  ) => Promise<MessageThreadSummary[]>
  getMessageThread: (threadId: string) => Promise<MessageThreadDetail>
  markMessageThreadRead: (threadId: string) => Promise<MessageThreadDetail>
  archiveMessageThread: (threadId: string) => Promise<{ success: boolean }>
  unarchiveMessageThread: (threadId: string) => Promise<{ success: boolean }>
  createDirectMessage: (
    input: CreateDirectMessageInput,
  ) => Promise<MessageThreadDetail>
  replyToMessageThread: (
    input: ReplyToMessageThreadInput,
  ) => Promise<MessageThreadDetail>
  editOwnMessage: (
    messageId: string,
    text: string,
  ) => Promise<MessageThreadDetail>
  deleteOwnMessage: (messageId: string) => Promise<{ success: boolean }>
  closeMessageThread: (threadId: string) => Promise<{ success: boolean }>
  getAnnouncements: (filter?: {
    search?: string
    status?: string
    audienceType?: string
    className?: string
    section?: string
  }) => Promise<Announcement[]>
  getCurrentUserAnnouncements: () => Promise<MessageThreadSummary[]>
  createAnnouncement: (input: AnnouncementInput) => Promise<Announcement>
  updateAnnouncement: (
    id: string,
    input: UpdateAnnouncementInput,
  ) => Promise<Announcement>
  publishAnnouncement: (id: string) => Promise<Announcement>
  cancelAnnouncement: (id: string) => Promise<Announcement>
  deleteAnnouncement: (id: string) => Promise<{ success: boolean }>
  getEligibleMessageRecipients: (filter?: {
    search?: string
    recipientType?: 'User' | 'Student' | 'Employee'
    role?: string
    className?: string
    section?: string
  }) => Promise<MessageRecipientCandidate[]>
  resolveAnnouncementRecipients: (
    input: AnnouncementInput,
  ) => Promise<MessageRecipientCandidate[]>
  getMessageDeliveryReport: (
    threadId: string,
  ) => Promise<MessageDeliveryReport>
  getAnnouncementReadReport: (
    announcementId: string,
  ) => Promise<AnnouncementReadReport>
  configureCommunicationGateway: (
    input: ConfigureCommunicationGatewayInput,
  ) => Promise<CommunicationGatewaySettings>
  getCommunicationGatewayConfiguration: () => Promise<CommunicationGatewaySettings>
  removeCommunicationGatewayToken: () => Promise<CommunicationGatewaySettings>
  getCommunicationIntegrationStatus: () => Promise<CommunicationGatewaySettings>
  testCommunicationGateway: () => Promise<CommunicationGatewaySettings>
  getCommunicationTemplates: (
    channel?: ExternalCommunicationChannel,
  ) => Promise<CommunicationTemplate[]>
  getExternalRecipientPreview: (input: {
    audienceType?: string
    className?: string
    section?: string
    studentIds?: string[]
    employeeIds?: string[]
    includeAllGuardians?: boolean
  }) => Promise<ExternalRecipientPreview>
  sendExternalMessage: (
    input: SendExternalMessageInput,
  ) => Promise<{ job: ExternalCommunicationJob; duplicate: boolean }>
  sendExternalBatch: (input: SendExternalBatchInput) => Promise<{
    batchId: string
    totalRecipients: number
    queuedCount: number
    excluded: Array<{ name: string; reason: string }>
  }>
  getCommunicationJobs: (filter?: {
    channel?: ExternalCommunicationChannel
    status?: ExternalCommunicationJob['status'] | 'All'
  }) => Promise<ExternalCommunicationJob[]>
  getCommunicationJob: (id: string) => Promise<ExternalCommunicationJob>
  retryCommunicationJob: (id: string) => Promise<ExternalCommunicationJob>
  selectManagedImage: (
    input: ManagedImageSelectionInput,
  ) => Promise<ManagedImageResult>
  replaceManagedImage: (
    input: ManagedImageSelectionInput,
  ) => Promise<ManagedImageResult>
  getManagedImageUrl: (assetKey: string) => Promise<ManagedImageResult>
  removeManagedImage: (
    assetKey: string,
  ) => Promise<{ success: boolean; removed?: boolean; referenced?: boolean }>
  createDemoData: () => Promise<DemoDataResult>

  getStudents: () => Promise<Student[]>
  getStudentAdmissionProfile: (
    studentId: string,
  ) => Promise<StudentAdmissionProfile | null>
  getNextStudentAdmissionNumbers: () => Promise<StudentAdmissionNumbers>
  saveStudentAdmission: (
    input: StudentAdmissionSaveInput,
  ) => Promise<StudentAdmissionProfile>
  createStudent: (student: CreateStudentInput) => Promise<Student>
  updateStudent: (id: string, student: UpdateStudentInput) => Promise<Student>
  deleteStudent: (id: string) => Promise<{ success: boolean }>
  importStudentsBulk: (
    rows: StudentImportRow[],
    options: StudentImportOptions,
  ) => Promise<StudentImportResult>
  getStudentImportTemplate: () => Promise<StudentImportTemplate>
  getFamilies: (filter?: FamilyFilter) => Promise<Family[]>
  getFamilyById: (id: string) => Promise<FamilyProfile | null>
  createFamily: (input: CreateFamilyInput) => Promise<FamilyProfile>
  updateFamily: (
    id: string,
    input: UpdateFamilyInput,
  ) => Promise<FamilyProfile>
  deleteFamily: (id: string) => Promise<{ success: boolean }>
  getFamilyStudents: (familyId: string) => Promise<Student[]>
  getGuardians: (filter?: GuardianFilter) => Promise<Guardian[]>
  createGuardian: (input: CreateGuardianInput) => Promise<Guardian>
  updateGuardian: (
    id: string,
    input: UpdateGuardianInput,
  ) => Promise<Guardian>
  deleteGuardian: (id: string) => Promise<{ success: boolean }>
  getStudentGuardians: (
    studentId: string,
  ) => Promise<StudentGuardianLink[]>
  linkGuardianToStudent: (
    input: LinkGuardianToStudentInput,
  ) => Promise<StudentGuardianLink>
  updateStudentGuardianLink: (
    id: string,
    input: UpdateStudentGuardianLinkInput,
  ) => Promise<StudentGuardianLink>
  unlinkGuardianFromStudent: (id: string) => Promise<{ success: boolean }>
  linkSiblingStudents: (
    input: LinkSiblingStudentsInput,
  ) => Promise<FamilyProfile>
  createFamilyFromStudentDetails: (
    studentId: string,
  ) => Promise<FamilyProfile>
  getParentsInfoReport: (
    filter?: ParentsInfoReportFilter,
  ) => Promise<ParentsInfoReport>
  getEmergencyContactsReport: (
    filter?: ParentsInfoReportFilter,
  ) => Promise<EmergencyContactsReport>
  getSiblingReport: (
    filter?: Pick<ParentsInfoReportFilter, 'className' | 'section'> & {
      status?: MasterStatus | 'All'
    },
  ) => Promise<SiblingReport>

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

  getAcademicSessions: () => Promise<AcademicSession[]>
  getCurrentAcademicSession: () => Promise<AcademicSession | null>
  createAcademicSession: (
    input: CreateAcademicSessionInput,
  ) => Promise<AcademicSession>
  updateAcademicSession: (
    id: string,
    input: UpdateAcademicSessionInput,
  ) => Promise<AcademicSession>
  setCurrentAcademicSession: (id: string) => Promise<AcademicSession>
  closeAcademicSession: (id: string) => Promise<AcademicSession>
  deleteAcademicSession: (id: string) => Promise<{ success: boolean }>

  getStudentSessionHistory: (
    studentId: string,
  ) => Promise<StudentSessionHistory[]>
  getSessionStudents: (
    sessionId: string,
  ) => Promise<StudentSessionHistory[]>
  createOrUpdateStudentSessionHistory: (
    input: SaveStudentSessionHistoryInput,
  ) => Promise<StudentSessionHistory>

  getPromotionPreview: (
    input: PromotionPreviewInput,
  ) => Promise<PromotionPreview>
  promoteStudentsBulk: (
    input: PromoteStudentsInput,
  ) => Promise<StudentPromotion>
  getStudentPromotions: () => Promise<StudentPromotion[]>
  getStudentPromotionById: (
    id: string,
  ) => Promise<StudentPromotion | null>
  getPromotionReport: (filter: {
    sessionId: string
  }) => Promise<SessionReport>

  getCarryForwardDues: (
    filter: CarryForwardDueFilter,
  ) => Promise<CarryForwardDue[]>
  updateCarryForwardDue: (
    id: string,
    input: UpdateCarryForwardDueInput,
  ) => Promise<CarryForwardDue>
  waiveCarryForwardDue: (
    id: string,
    reason: string,
  ) => Promise<CarryForwardDue>

  getSchoolSettings: () => Promise<SchoolSettings>
  saveSchoolSettings: (settings: SaveSchoolSettingsInput) => Promise<SchoolSettings>
  getSchoolRules: (filter?: SchoolRuleFilter) => Promise<SchoolRule[]>
  createSchoolRule: (input: CreateSchoolRuleInput) => Promise<SchoolRule>
  updateSchoolRule: (
    id: string,
    input: UpdateSchoolRuleInput,
  ) => Promise<SchoolRule>
  deleteSchoolRule: (id: string) => Promise<{ success: boolean }>
  reorderSchoolRules: (
    records: ReorderSchoolRuleInput[],
  ) => Promise<SchoolRule[]>
  getAppPreferences: () => Promise<AppPreference>
  updateAppPreferences: (
    input: UpdatePreferenceInput,
  ) => Promise<AppPreference>
  getUserPreferences: () => Promise<AppPreference>
  updateUserPreferences: (
    input: UpdatePreferenceInput,
  ) => Promise<AppPreference>

  getFeePayments: () => Promise<FeePayment[]>
  getFeePaymentsByDateRange: (
    startDate: string,
    endDate: string,
  ) => Promise<FeePayment[]>
  createFeePayment: (payment: CreateFeePaymentInput) => Promise<FeePayment>
  reverseFeePayment: (
    id: string,
    reason: string,
  ) => Promise<FeePaymentReversalResult>
  getDiscountTypes: () => Promise<DiscountType[]>
  createDiscountType: (input: CreateDiscountTypeInput) => Promise<DiscountType>
  updateDiscountType: (
    id: string,
    input: UpdateDiscountTypeInput,
  ) => Promise<DiscountType>
  deleteDiscountType: (id: string) => Promise<{ success: boolean }>
  getStudentDiscounts: (
    filter?: StudentDiscountFilter,
  ) => Promise<StudentDiscount[]>
  createStudentDiscount: (
    input: CreateStudentDiscountInput,
  ) => Promise<StudentDiscount>
  updateStudentDiscount: (
    id: string,
    input: UpdateStudentDiscountInput,
  ) => Promise<StudentDiscount>
  deleteStudentDiscount: (id: string) => Promise<{ success: boolean }>
  getFeeInvoicePreview: (
    input: FeeInvoicePreviewInput,
  ) => Promise<FeeInvoicePreview>
  createFeeInvoice: (input: CreateFeeInvoiceInput) => Promise<FeeInvoice>
  getFeeInvoices: (filter?: FeeInvoiceFilter) => Promise<FeeInvoice[]>
  getFeeInvoiceById: (id: string) => Promise<FeeInvoice | null>
  cancelFeeInvoice: (id: string, reason: string) => Promise<FeeInvoice>
  refreshFeeInvoiceStatus: (id: string) => Promise<FeeInvoice>
  allocateFeePaymentToInvoices: (
    input: FeeInvoiceAllocationInput,
  ) => Promise<FeeInvoiceAllocationResult>
  getStudentOutstandingInvoices: (
    studentId: string,
  ) => Promise<FeeInvoice[]>
  getFeeInvoiceSummary: (
    filter?: FeeInvoiceFilter,
  ) => Promise<FeeInvoiceSummary>
  getFeeInvoiceAccountsReport: (
    filter?: FeeInvoiceFilter,
  ) => Promise<FeeInvoiceAccountsReport>
  getStudentFeeLedger: (
    studentId: string,
  ) => Promise<StudentFeeLedgerEntry[]>
  getFeeInvoiceAccountMappings: () => Promise<FeeInvoiceAccountMapping[]>
  saveFeeInvoiceAccountMapping: (
    input: SaveFeeInvoiceAccountMappingInput,
  ) => Promise<FeeInvoiceAccountMapping>
  deleteFeeInvoiceAccountMapping: (
    id: string,
  ) => Promise<{ success: boolean }>

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
  getEmployeeAttendanceByDate: (
    date: string,
    filters?: EmployeeAttendanceFilter,
  ) => Promise<EmployeeAttendanceRecord[]>
  getEmployeeAttendanceByRange: (
    filter?: EmployeeAttendanceFilter,
  ) => Promise<EmployeeAttendanceRecord[]>
  saveEmployeeAttendanceBulk: (
    records: SaveEmployeeAttendanceInput[],
  ) => Promise<EmployeeAttendanceRecord[]>
  updateEmployeeAttendance: (
    id: string,
    input: UpdateEmployeeAttendanceInput,
  ) => Promise<EmployeeAttendanceRecord>
  getEmployeeAttendanceSummary: (
    filter?: EmployeeAttendanceFilter,
  ) => Promise<EmployeeAttendanceSummary>
  getEmployeeMonthlyAttendance: (
    employeeId: string,
    month: string,
  ) => Promise<EmployeeMonthlyAttendance>
  getEmployeeAttendanceReport: (
    filter?: EmployeeAttendanceFilter,
  ) => Promise<EmployeeAttendanceReport>

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
  getGradingSchemes: () => Promise<GradingScheme[]>
  getGradingSchemeById: (id: string) => Promise<GradingScheme | null>
  createGradingScheme: (
    input: CreateGradingSchemeInput,
  ) => Promise<GradingScheme>
  updateGradingScheme: (
    id: string,
    input: UpdateGradingSchemeInput,
  ) => Promise<GradingScheme>
  deleteGradingScheme: (id: string) => Promise<{ success: boolean }>
  setDefaultGradingScheme: (id: string) => Promise<GradingScheme>
  calculateGrade: (
    input: CalculateGradeInput,
  ) => Promise<CalculateGradeResult>
  getReportCardTemplates: () => Promise<ReportCardTemplate[]>
  createReportCardTemplate: (
    input: ReportCardTemplateInput,
  ) => Promise<ReportCardTemplate>
  updateReportCardTemplate: (
    id: string,
    input: UpdateReportCardTemplateInput,
  ) => Promise<ReportCardTemplate>
  deleteReportCardTemplate: (id: string) => Promise<{ success: boolean }>
  getReportCardPreview: (
    input: ReportCardPreviewInput,
  ) => Promise<ReportCardPreview>
  generateStudentReportCard: (
    input: GenerateReportCardInput,
  ) => Promise<StudentReportCard>
  generateClassReportCards: (
    input: GenerateClassReportCardsInput,
  ) => Promise<GenerateClassReportCardsResult>
  getStudentReportCards: (
    filter?: ReportCardFilter,
  ) => Promise<StudentReportCard[]>
  getStudentReportCardById: (
    id: string,
  ) => Promise<StudentReportCard | null>
  updateReportCardRemarks: (
    id: string,
    input: UpdateReportCardRemarksInput,
  ) => Promise<StudentReportCard>
  deleteReportCard: (id: string) => Promise<{ success: boolean }>
  getClassResultSummary: (
    filter?: ReportCardFilter,
  ) => Promise<ClassResultSummary>
  getResultPositions: (
    filter?: ReportCardFilter,
  ) => Promise<ResultPosition[]>
  getExamSchedules: (filter?: IpcRecord) => Promise<IpcRecord[]>
  getExamSchedule: (id: string) => Promise<IpcRecord | null>
  createExamSchedule: (input: IpcRecord) => Promise<IpcRecord>
  updateExamSchedule: (
    id: string,
    input: IpcRecord,
  ) => Promise<IpcRecord>
  deleteExamSchedule: (id: string) => Promise<{ success: boolean }>
  publishExamSchedule: (id: string) => Promise<IpcRecord>
  cancelExamSchedule: (id: string) => Promise<IpcRecord>
  completeExamSchedule: (id: string) => Promise<IpcRecord>
  getExamScheduleEntries: (scheduleId: string) => Promise<IpcRecord[]>
  saveExamScheduleEntries: (
    scheduleId: string,
    entries: IpcRecord[],
  ) => Promise<IpcRecord[]>
  detectExamScheduleConflicts: (
    input: IpcRecord,
  ) => Promise<IpcRecord>
  getDateSheet: (filter?: IpcRecord) => Promise<IpcRecord>
  getResultSheet: (filter?: IpcRecord) => Promise<IpcRecord>
  getBlankAwardList: (filter?: IpcRecord) => Promise<IpcRecord>
  getStudentProgressReport: (filter?: IpcRecord) => Promise<IpcRecord>
  getCustomReportDomains: () => Promise<IpcRecord[]>
  previewCustomReport: (input: IpcRecord) => Promise<IpcRecord>
  getSavedReportDefinitions: (filter?: IpcRecord) => Promise<IpcRecord[]>
  saveReportDefinition: (input: IpcRecord) => Promise<IpcRecord>
  deleteReportDefinition: (id: string) => Promise<{ success: boolean }>
  getLiveClasses: (filter?: IpcRecord) => Promise<IpcRecord[]>
  getLiveClass: (id: string) => Promise<IpcRecord | null>
  createLiveClass: (input: IpcRecord) => Promise<IpcRecord>
  updateLiveClass: (id: string, input: IpcRecord) => Promise<IpcRecord>
  setLiveClassStatus: (id: string, status: string) => Promise<IpcRecord>
  saveLiveClassAttendance: (
    liveClassId: string,
    records: IpcRecord[],
  ) => Promise<IpcRecord>
  previewLiveClassNotification: (
    liveClassId: string,
    input: IpcRecord,
  ) => Promise<IpcRecord>
  notifyLiveClassRecipients: (
    liveClassId: string,
    input: IpcRecord,
  ) => Promise<IpcRecord>
  getStoreCategories: () => Promise<IpcRecord[]>
  saveStoreCategory: (input: IpcRecord) => Promise<IpcRecord>
  getStoreTaxRates: () => Promise<IpcRecord[]>
  saveStoreTaxRate: (input: IpcRecord) => Promise<IpcRecord>
  getStoreProducts: (filter?: IpcRecord) => Promise<IpcRecord[]>
  saveStoreProduct: (input: IpcRecord) => Promise<IpcRecord>
  getStoreAccountMappings: () => Promise<IpcRecord[]>
  saveStoreAccountMapping: (input: IpcRecord) => Promise<IpcRecord>
  createStoreInventoryTransaction: (input: IpcRecord) => Promise<IpcRecord>
  getStoreInventoryLedger: (filter?: IpcRecord) => Promise<IpcRecord[]>
  getStoreOrders: (filter?: IpcRecord) => Promise<IpcRecord[]>
  createStoreOrder: (input: IpcRecord) => Promise<IpcRecord>
  resumeHeldStoreOrder: (id: string, input: IpcRecord) => Promise<IpcRecord>
  cancelHeldStoreOrder: (id: string, reason: string) => Promise<IpcRecord>
  reverseStoreOrder: (id: string, reason: string) => Promise<IpcRecord>
  getCurrentStorePosSession: () => Promise<IpcRecord | null>
  getStorePosSessions: (filter?: IpcRecord) => Promise<IpcRecord[]>
  openStorePosSession: (input: IpcRecord) => Promise<IpcRecord>
  closeStorePosSession: (id: string, input: IpcRecord) => Promise<IpcRecord>
  getStoreReports: (filter?: IpcRecord) => Promise<IpcRecord>

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
  getDocumentTemplateSettings: () => Promise<DocumentTemplateSettings[]>
  updateDocumentTemplateSetting: (
    documentType: DocumentTemplateType,
    input: UpdateDocumentTemplateSettingInput,
  ) => Promise<DocumentTemplateSettings>
  getAdmissionFormData: (input: {
    mode: 'Blank' | 'Prefilled'
    studentId?: string
    formDate?: string
  }) => Promise<AdmissionFormData>
  getAdmissionFormSnapshots: (filter?: {
    studentId?: string
  }) => Promise<AdmissionFormSnapshot[]>
  saveAdmissionFormSnapshot: (input: {
    mode: 'Blank' | 'Prefilled'
    studentId?: string
    formDate?: string
  }) => Promise<AdmissionFormSnapshot>
  getTransferCertificates: (
    filter?: IpcRecord,
  ) => Promise<TransferCertificate[]>
  getTransferCertificate: (
    id: string,
  ) => Promise<TransferCertificate | null>
  getTransferCertificatePreview: (
    input: TransferCertificateInput,
  ) => Promise<TransferCertificatePreview>
  createTransferCertificateDraft: (
    input: TransferCertificateInput,
  ) => Promise<TransferCertificate>
  updateTransferCertificateDraft: (
    id: string,
    input: TransferCertificateInput,
  ) => Promise<TransferCertificate>
  issueTransferCertificate: (
    id: string,
    input?: TransferCertificateInput,
  ) => Promise<TransferCertificate>
  reprintTransferCertificate: (id: string) => Promise<TransferCertificate>
  cancelTransferCertificate: (
    id: string,
    reason: string,
  ) => Promise<TransferCertificate>
  markStudentTransferredFromCertificate: (
    id: string,
  ) => Promise<Student>
  getFeeReceiptPrintData: (paymentId: string) => Promise<FeeReceiptPrintData>
  recordFeeReceiptPrint: (
    paymentId: string,
  ) => Promise<{ success: boolean; receiptNo: string }>

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
