export type PageId =
  | 'dashboard'
  | 'students'
  | 'families'
  | 'fees'
  | 'attendance'
  | 'exams'
  | 'reports'
  | 'settings'
  | 'documents'
  | 'employees'
  | 'salary'
  | 'accounts'
  | 'timetable'
  | 'homework'
  | 'class-tests'
  | 'question-paper'
  | 'behaviour-skills'
  | 'academic-sessions'
  | 'student-login-management'
  | 'employee-login-management'
  | 'message-center'
  | 'external-communications'
  | 'student-portal'
  | 'employee-portal'
  | 'placeholder'

export interface ModulePlaceholderInfo {
  id: string
  module: string
  title: string
  description?: string
  status?: 'missing' | 'online'
}

export type PermissionRole =
  | 'Owner'
  | 'Admin'
  | 'Accountant'
  | 'Teacher'
  | 'Viewer'
  | 'Student'

export type UserAccountType = 'Staff' | 'Student'

export type EntityType = 'Student' | 'Employee'

export type LicenseState =
  | 'missing'
  | 'active'
  | 'expiring-soon'
  | 'expired'
  | 'maintenance-expired'
  | 'invalid'

export type RemoteLicenseState =
  | 'Active'
  | 'Suspended'
  | 'Expired'
  | 'Revoked'
  | 'Unknown'

export type RemoteLicenseDisplayStatus =
  | 'Online Verified'
  | 'Offline Grace'
  | 'Suspended'
  | 'Expired'
  | 'Revoked'
  | 'Check Required'

export interface LicenseInfo {
  licenseId: string
  schoolName: string
  deviceId: string
  plan: string
  issuedAt: string
  expiresAt: string
  maintenanceUntil: string
  maxUsers: number
  features: string[]
  customerPhone: string
  customerEmail: string
}

export interface RemoteLicenseStatus {
  licenseId: string
  deviceId: string
  remoteStatus: RemoteLicenseState
  displayStatus: RemoteLicenseDisplayStatus
  blocksUsage: boolean
  canUseGrace: boolean
  checkRequired: boolean
  lastOnlineCheckAt: string | null
  nextRequiredCheckAt: string | null
  graceUntil: string | null
  lastError: string
  serverMessage: string
  message: string
}

export interface LicenseStatus {
  status: LicenseState
  isValid: boolean
  message: string
  daysUntilExpiry: number | null
  deviceId: string
  license: LicenseInfo | null
  activatedAt: string | null
  lastCheckedAt: string | null
  remote: RemoteLicenseStatus | null
}

export type ExternalCommunicationChannel = 'WhatsApp' | 'SMS'

export type ExternalCommunicationStatus =
  | 'Queued'
  | 'Processing'
  | 'Submitted'
  | 'Sent'
  | 'Delivered'
  | 'Read'
  | 'Failed'
  | 'Rejected'
  | 'Cancelled'

export interface CommunicationGatewaySettings {
  id: string
  gatewayUrl: string
  tokenStorage: string
  tokenPrefix: string
  hasToken: boolean
  connectionStatus: string
  whatsappStatus: string
  smsStatus: string
  lastSuccessAt: string | null
  lastError: string
  createdAt: string
  updatedAt: string
}

export interface ConfigureCommunicationGatewayInput {
  gatewayUrl: string
  deviceToken?: string
}

export interface CommunicationTemplate {
  id: string
  channel: ExternalCommunicationChannel
  provider: string
  internalName: string
  category: string | null
  providerTemplateId: string | null
  providerTemplateName: string | null
  providerLanguageCode: string | null
  dltTemplateId: string | null
  msg91FlowId: string | null
  senderId: string | null
  bodyPreview: string | null
  variableDefinitions: Array<{ name?: string; key?: string; label?: string }>
  status: string
  createdAt: string
  updatedAt: string
}

export interface ExternalRecipientCandidate {
  type: 'Student' | 'Guardian' | 'Employee'
  entityId: string
  studentId?: string
  name: string
  label?: string
  relation?: string
  className?: string
  section?: string
  department?: string
  designation?: string
  phoneMasked: string
}

export interface ExternalRecipientPreview {
  totalRecords: number
  validCount: number
  missingCount: number
  duplicateCount: number
  optedOutCount: number
  candidates: ExternalRecipientCandidate[]
  missing: Array<{ entityId: string; name: string; reason: string }>
}

export interface ExternalCommunicationJob {
  id: string
  batchId: string | null
  channel: ExternalCommunicationChannel
  provider: string
  templateId: string | null
  recipientType: string | null
  recipientEntityId: string | null
  recipientName: string | null
  recipientPhoneMasked: string | null
  requestedByName: string | null
  requestedByRole: string | null
  status: ExternalCommunicationStatus
  providerMessageId: string | null
  providerResponseCode: string | null
  errorCode: string | null
  errorMessage: string | null
  attemptCount: number
  queuedAt: string | null
  submittedAt: string | null
  sentAt: string | null
  deliveredAt: string | null
  readAt: string | null
  failedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SendExternalMessageInput {
  channel: ExternalCommunicationChannel
  templateId: string
  recipient: ExternalRecipientCandidate
  variables?: Record<string, string>
  mediaUrl?: string
  idempotencyKey?: string
}

export interface SendExternalBatchInput {
  channel: ExternalCommunicationChannel
  templateId: string
  title?: string
  audienceType?: string
  recipients: ExternalRecipientCandidate[]
  variables?: Record<string, string>
  idempotencyKey?: string
}

export interface User {
  id: string
  name: string
  email: string
  username: string
  role: PermissionRole
  accountType: UserAccountType
  mustChangePassword: boolean
  passwordChangedAt: string | null
  status: MasterStatus
  lastLoginAt: string | null
  failedLoginCount: number
  lockedUntil: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
  entityLink?: UserEntityLink | null
}

export type AuthUser = User

export interface CreateFirstOwnerInput {
  name: string
  username: string
  email?: string
  password: string
}

export interface CreateUserInput {
  name: string
  email?: string
  username: string
  password: string
  role: PermissionRole
  status?: MasterStatus
}

export interface UpdateUserInput {
  name?: string
  email?: string
  username?: string
  role?: PermissionRole
  status?: MasterStatus
}

export interface ChangeTemporaryPasswordInput {
  currentPassword: string
  newPassword: string
}

export interface UserEntityLink {
  id: string
  userId: string
  username: string
  userName: string
  role: PermissionRole
  accountType: UserAccountType
  status: MasterStatus
  mustChangePassword: boolean
  lastLoginAt: string | null
  entityType: EntityType
  entityId: string
  entityCode: string
  entityName: string
  isPrimary: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface StudentLoginAccount {
  id: string
  userId: string
  studentId: string
  admissionNo: string
  studentName: string
  className: string
  section: string
  username: string
  email: string
  role: 'Student'
  accountType: 'Student'
  status: MasterStatus
  mustChangePassword: boolean
  lastLoginAt: string | null
  lockedUntil: string | null
}

export interface StudentLoginFilter {
  search?: string
  status?: MasterStatus | 'All'
}

export interface CreateStudentLoginAccountInput {
  studentId: string
  username: string
  password: string
  email?: string
  status?: MasterStatus
  mustChangePassword?: boolean
}

export interface UpdateStudentLoginAccountInput {
  username?: string
  status?: MasterStatus
  mustChangePassword?: boolean
  lockedUntil?: string
  failedLoginCount?: number
}

export interface ResetLoginPasswordInput {
  password: string
  mustChangePassword?: boolean
}

export interface EmployeeLoginAccount {
  id: string
  userId: string
  employeeId: string
  employeeCode: string
  employeeName: string
  department: string
  designation: string
  username: string
  email: string
  role: Exclude<PermissionRole, 'Owner' | 'Student'>
  accountType: 'Staff'
  status: MasterStatus
  mustChangePassword: boolean
  lastLoginAt: string | null
  lockedUntil: string | null
}

export interface EmployeeLoginFilter {
  search?: string
  status?: MasterStatus | 'All'
  role?: PermissionRole | 'All'
}

export interface CreateEmployeeLoginAccountInput {
  employeeId: string
  username: string
  password: string
  email?: string
  role: Exclude<PermissionRole, 'Owner' | 'Student'>
  status?: MasterStatus
  mustChangePassword?: boolean
}

export interface UpdateEmployeeLoginAccountInput {
  username?: string
  role?: Exclude<PermissionRole, 'Owner' | 'Student'>
  status?: MasterStatus
  mustChangePassword?: boolean
  lockedUntil?: string
  failedLoginCount?: number
}

export type RuleCategory =
  | 'General'
  | 'Fees'
  | 'Attendance'
  | 'Discipline'
  | 'Examination'
  | 'Transport'
  | 'Uniform'
  | 'Library'
  | 'Safety'
  | 'Other'

export interface SchoolRule {
  id: string
  title: string
  category: RuleCategory
  ruleText: string
  displayOrder: number
  status: MasterStatus
  academicSessionId: string
  academicSessionName: string
  effectiveFrom: string
  createdBy: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface SchoolRuleFilter {
  category?: RuleCategory | 'All' | ''
  status?: MasterStatus | 'All' | ''
  academicSessionId?: string
  search?: string
}

export interface CreateSchoolRuleInput {
  title: string
  category: RuleCategory
  ruleText: string
  displayOrder?: number
  status?: MasterStatus
  academicSessionId?: string
  academicSessionName?: string
  effectiveFrom?: string
}

export type UpdateSchoolRuleInput = Partial<CreateSchoolRuleInput>

export interface ReorderSchoolRuleInput {
  id: string
  displayOrder: number
}

export type PreferenceScope = 'Application' | 'User'
export type ThemeMode = 'Light' | 'Dark' | 'System'
export type AccentColor = 'Blue' | 'Indigo' | 'Green' | 'Purple' | 'Orange'
export type PreferenceLanguage = 'English' | 'Hindi'
export type FontScale = 'Small' | 'Normal' | 'Large'
export type DateFormatPreference =
  | 'DD/MM/YYYY'
  | 'MM/DD/YYYY'
  | 'YYYY-MM-DD'
  | 'DD MMM YYYY'
export type TimeFormatPreference = '12 Hour' | '24 Hour'

export interface AppPreference {
  id: string
  preferenceScope: PreferenceScope
  userId: string
  themeMode: ThemeMode
  accentColor: AccentColor
  language: PreferenceLanguage
  compactSidebar: boolean
  fontScale: FontScale
  dateFormat: DateFormatPreference
  timeFormat: TimeFormatPreference
  createdAt: string
  updatedAt: string
}

export type UpdatePreferenceInput = Partial<
  Pick<
    AppPreference,
    | 'themeMode'
    | 'accentColor'
    | 'language'
    | 'compactSidebar'
    | 'fontScale'
    | 'dateFormat'
    | 'timeFormat'
  >
>

export interface AccountProfileInput {
  name: string
  username: string
  email?: string
}

export interface ChangeCurrentPasswordInput {
  currentPassword: string
  newPassword: string
}

export interface LoginHistoryFilter {
  startDate?: string
  endDate?: string
  success?: boolean
  limit?: number
}

export interface LoginHistoryEntry {
  id: string
  userId: string
  username: string
  role: string
  loginAt: string
  logoutAt: string
  success: boolean
  deviceName: string
  os: string
  failureReason: string
  createdAt: string
}

export interface AuditLog {
  id: string
  userId: string | null
  userName: string
  action: string
  module: string
  details: string
  createdAt: string
}

export type StudentStatus = 'Active' | 'Inactive'

export interface Student {
  id: string
  admissionNo: string
  name: string
  className: string
  section: string
  guardianName: string
  mobile: string
  fatherName: string
  motherName: string
  email: string
  gender: string
  bloodGroup: string
  aadharNo: string
  previousSchool: string
  notes: string
  status: StudentStatus
  address: string
  dateOfBirth: string
  admissionDate: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: 'pending' | 'synced'
  academicSessionId: string
  academicSessionName: string
  sessionStatus: StudentSessionStatus
}

export interface CreateStudentInput {
  admissionNo?: string
  name: string
  className: string
  section?: string
  guardianName?: string
  mobile?: string
  fatherName?: string
  motherName?: string
  email?: string
  gender?: string
  bloodGroup?: string
  aadharNo?: string
  previousSchool?: string
  notes?: string
  status?: StudentStatus
  address?: string
  dateOfBirth?: string
  admissionDate?: string
}

export type UpdateStudentInput = Partial<CreateStudentInput>

export type GuardianRelation =
  | 'Father'
  | 'Mother'
  | 'Guardian'
  | 'Grandfather'
  | 'Grandmother'
  | 'Brother'
  | 'Sister'
  | 'Uncle'
  | 'Aunt'
  | 'Other'

export interface Family {
  id: string
  familyCode: string
  familyName: string
  primaryContactName: string
  primaryMobile: string
  secondaryMobile: string
  email: string
  address: string
  city: string
  state: string
  postalCode: string
  emergencyContactName: string
  emergencyContactMobile: string
  notes: string
  status: MasterStatus
  studentCount: number
  guardianCount: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface Guardian {
  id: string
  familyId: string
  familyCode: string
  familyName: string
  fullName: string
  relation: GuardianRelation
  mobile: string
  alternateMobile: string
  email: string
  occupation: string
  qualification: string
  annualIncome: number | null
  address: string
  isPrimary: boolean
  canPickupStudent: boolean
  emergencyContact: boolean
  status: MasterStatus
  linkedStudentCount: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface StudentGuardianLink {
  id: string
  studentId: string
  studentName: string
  admissionNo: string
  className: string
  section: string
  guardianId: string
  guardianName: string
  guardianFullName: string
  relation: GuardianRelation | string
  mobile: string
  alternateMobile: string
  email: string
  occupation: string
  address: string
  familyId: string
  familyCode: string
  familyName: string
  relationToStudent: GuardianRelation | string
  isPrimary: boolean
  livesWithStudent: boolean
  financialResponsibility: boolean
  pickupAuthorized: boolean
  guardianCanPickupStudent: boolean
  guardianEmergencyContact: boolean
  emergencyContactName: string
  emergencyContactMobile: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface FamilyProfile extends Family {
  guardians: Guardian[]
  students: Student[]
}

export interface FamilyFilter {
  search?: string
  status?: MasterStatus | 'All'
}

export interface GuardianFilter {
  search?: string
  familyId?: string
  relation?: GuardianRelation | 'All'
  status?: MasterStatus | 'All'
}

export interface CreateFamilyInput {
  familyCode?: string
  familyName?: string
  primaryContactName?: string
  primaryMobile?: string
  secondaryMobile?: string
  email?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  emergencyContactName?: string
  emergencyContactMobile?: string
  notes?: string
  status?: MasterStatus
}

export type UpdateFamilyInput = Partial<CreateFamilyInput>

export interface CreateGuardianInput {
  familyId?: string
  fullName: string
  relation: GuardianRelation
  mobile?: string
  alternateMobile?: string
  email?: string
  occupation?: string
  qualification?: string
  annualIncome?: number | null
  address?: string
  isPrimary?: boolean
  canPickupStudent?: boolean
  emergencyContact?: boolean
  status?: MasterStatus
}

export type UpdateGuardianInput = Partial<CreateGuardianInput>

export interface LinkGuardianToStudentInput {
  studentId: string
  guardianId: string
  familyId?: string
  relationToStudent?: string
  isPrimary?: boolean
  livesWithStudent?: boolean
  financialResponsibility?: boolean
  pickupAuthorized?: boolean
}

export type UpdateStudentGuardianLinkInput =
  Partial<Omit<LinkGuardianToStudentInput, 'studentId' | 'guardianId'>>

export interface LinkSiblingStudentsInput {
  studentIds: string[]
  familyId?: string
}

export interface ParentsInfoReportFilter {
  academicSessionId?: string
  className?: string
  section?: string
  studentId?: string
  guardianRelation?: GuardianRelation | 'All'
  missingMobile?: boolean
  missingEmail?: boolean
  emergencyContact?: boolean
  pickupAuthorized?: boolean
}

export interface ParentsInfoReportRow {
  studentId: string
  admissionNo: string
  studentName: string
  className: string
  section: string
  familyId: string
  familyCode: string
  familyName: string
  guardianId: string
  primaryGuardian: string
  relation: string
  mobile: string
  alternateMobile: string
  email: string
  occupation: string
  address: string
  emergencyContact: boolean
  emergencyContactName: string
  emergencyContactMobile: string
  pickupAuthorized: boolean
  hasLinkedGuardian: boolean
  source: 'Linked' | 'Legacy'
}

export interface ParentsInfoReport {
  rows: ParentsInfoReportRow[]
  summary: {
    totalFamilies: number
    totalGuardians: number
    missingMobile: number
    missingEmail: number
    studentsWithoutLinkedGuardian: number
  }
}

export interface EmergencyContactReportRow {
  studentId: string
  admissionNo: string
  studentName: string
  className: string
  section: string
  primaryGuardian: string
  emergencyContactName: string
  emergencyContactMobile: string
  pickupAuthorized: boolean
  pickupAuthorizedPeople: string
}

export interface EmergencyContactsReport {
  rows: EmergencyContactReportRow[]
  summary: {
    totalRows: number
    missingEmergencyMobile: number
    pickupAuthorized: number
  }
}

export interface SiblingReportRow {
  familyId: string
  familyCode: string
  familyName: string
  primaryContactName: string
  primaryMobile: string
  guardianCount: number
  studentCount: number
  students: Student[]
}

export interface SiblingReport {
  rows: SiblingReportRow[]
  summary: {
    siblingFamilies: number
    linkedStudents: number
  }
}

export interface Employee {
  id: string
  employeeNo: string
  name: string
  designation: string
  department: string
  mobile: string
  email: string
  gender: string
  dateOfBirth: string
  joiningDate: string
  qualification: string
  experience: string
  address: string
  salaryAmount: number
  status: MasterStatus
  userId: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateEmployeeInput {
  employeeNo: string
  name: string
  designation?: string
  department?: string
  mobile?: string
  email?: string
  gender?: string
  dateOfBirth?: string
  joiningDate?: string
  qualification?: string
  experience?: string
  address?: string
  salaryAmount?: number
  status?: MasterStatus
  userId?: string
}

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>

export interface TimetableWeekday {
  id: string
  name: string
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateTimetableWeekdayInput {
  name: string
  displayOrder?: number
  isActive?: boolean
}

export type UpdateTimetableWeekdayInput =
  Partial<CreateTimetableWeekdayInput>

export interface TimetablePeriod {
  id: string
  name: string
  startTime: string
  endTime: string
  displayOrder: number
  isBreak: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateTimetablePeriodInput {
  name: string
  startTime: string
  endTime: string
  displayOrder?: number
  isBreak?: boolean
}

export type UpdateTimetablePeriodInput =
  Partial<CreateTimetablePeriodInput>

export interface Classroom {
  id: string
  name: string
  capacity: number
  description: string
  status: MasterStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateClassroomInput {
  name: string
  capacity?: number
  description?: string
  status?: MasterStatus
}

export type UpdateClassroomInput = Partial<CreateClassroomInput>

export interface TimetableEntry {
  id: string
  className: string
  section: string
  weekdayId: string
  weekdayName: string
  periodId: string
  periodName: string
  startTime: string
  endTime: string
  subjectId: string
  subjectName: string
  teacherId: string
  teacherName: string
  classroomId: string
  classroomName: string
  notes: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface SaveTimetableEntryInput {
  className: string
  section?: string
  weekdayId: string
  periodId: string
  subjectId: string
  teacherId: string
  classroomId?: string
  notes?: string
}

export type HomeworkStatus = 'Active' | 'Inactive'
export type HomeworkSubmissionStatus =
  | 'Pending'
  | 'Submitted'
  | 'Checked'
  | 'Late'
  | 'Missing'

export interface Homework {
  id: string
  title: string
  className: string
  section: string
  subjectId: string
  subjectName: string
  teacherId: string
  teacherName: string
  homeworkDate: string
  dueDate: string
  description: string
  instructions: string
  status: HomeworkStatus
  createdBy: string
  submissionCount: number
  pendingSubmissionCount: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateHomeworkInput {
  title: string
  className: string
  section?: string
  subjectId: string
  teacherId: string
  homeworkDate: string
  dueDate?: string
  description?: string
  instructions?: string
  status?: HomeworkStatus
}

export type UpdateHomeworkInput = Partial<CreateHomeworkInput>

export interface HomeworkSubmission {
  id: string
  homeworkId: string
  studentId: string
  studentName: string
  admissionNo: string
  className: string
  section: string
  status: HomeworkSubmissionStatus
  submittedDate: string
  remarks: string
  marks: number | null
  createdAt: string
  updatedAt: string
  syncStatus: SyncStatus
}

export interface SaveHomeworkSubmissionInput {
  homeworkId: string
  studentId: string
  status: HomeworkSubmissionStatus
  submittedDate?: string
  remarks?: string
  marks?: number | null
}

export interface UpdateHomeworkSubmissionInput {
  status?: HomeworkSubmissionStatus
  submittedDate?: string
  remarks?: string
  marks?: number | null
}

export type ClassTestStatus = 'Active' | 'Inactive'
export type ClassTestResultStatus = 'Pending' | 'Pass' | 'Fail' | 'Absent'

export interface ClassTest {
  id: string
  testName: string
  className: string
  section: string
  subjectId: string
  subjectName: string
  teacherId: string
  teacherName: string
  testDate: string
  maxMarks: number
  passingMarks: number
  description: string
  status: ClassTestStatus
  createdBy: string
  markCount: number
  pendingMarkCount: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateClassTestInput {
  testName: string
  className: string
  section?: string
  subjectId: string
  teacherId: string
  testDate: string
  maxMarks: number
  passingMarks?: number
  description?: string
  status?: ClassTestStatus
}

export type UpdateClassTestInput = Partial<CreateClassTestInput>

export interface ClassTestMark {
  id: string
  testId: string
  studentId: string
  studentName: string
  admissionNo: string
  className: string
  section: string
  marksObtained: number
  resultStatus: ClassTestResultStatus
  remarks: string
  createdAt: string
  updatedAt: string
  syncStatus: SyncStatus
}

export interface SaveClassTestMarkInput {
  testId: string
  studentId: string
  marksObtained: number
  resultStatus: ClassTestResultStatus
  remarks?: string
}

export interface UpdateClassTestMarkInput {
  marksObtained?: number
  resultStatus?: ClassTestResultStatus
  remarks?: string
}

export interface SubjectChapter {
  id: string
  className: string
  subjectId: string
  subjectName: string
  chapterName: string
  chapterNo: string
  description: string
  status: MasterStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateSubjectChapterInput {
  className: string
  subjectId: string
  chapterName: string
  chapterNo?: string
  description?: string
  status?: MasterStatus
}

export type UpdateSubjectChapterInput =
  Partial<CreateSubjectChapterInput>

export type QuestionType =
  | 'Objective'
  | 'Short Answer'
  | 'Long Answer'
  | 'Fill in the Blanks'
  | 'True/False'
  | 'Match the Following'

export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard'

export interface QuestionBankItem {
  id: string
  className: string
  subjectId: string
  subjectName: string
  chapterId: string
  chapterName: string
  questionType: QuestionType
  difficulty: QuestionDifficulty
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  marks: number
  status: MasterStatus
  createdBy: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateQuestionInput {
  className: string
  subjectId: string
  chapterId?: string
  questionType: QuestionType
  difficulty?: QuestionDifficulty
  questionText: string
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  correctAnswer?: string
  marks?: number
  status?: MasterStatus
}

export type UpdateQuestionInput = Partial<CreateQuestionInput>

export interface QuestionFilter {
  className?: string
  subjectId?: string
  subjectName?: string
  chapterId?: string
  questionType?: QuestionType | ''
  difficulty?: QuestionDifficulty | ''
}

export interface QuestionPaperItem {
  id: string
  paperId: string
  questionId: string
  sectionTitle: string
  displayOrder: number
  questionType: QuestionType
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  marks: number
  createdAt: string
  updatedAt: string
  syncStatus: SyncStatus
}

export interface CreateQuestionPaperItemInput {
  questionId: string
  sectionTitle?: string
  displayOrder?: number
}

export interface QuestionPaper {
  id: string
  paperNo: string
  title: string
  className: string
  section: string
  subjectId: string
  subjectName: string
  examName: string
  durationMinutes: number
  totalMarks: number
  instructions: string
  createdBy: string
  itemCount: number
  items: QuestionPaperItem[]
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateQuestionPaperInput {
  title: string
  className: string
  section?: string
  subjectId: string
  examName?: string
  durationMinutes?: number
  instructions?: string
  items: CreateQuestionPaperItemInput[]
}

export type UpdateQuestionPaperInput =
  Partial<CreateQuestionPaperInput>

export type StudentRating =
  | 'Excellent'
  | 'Very Good'
  | 'Good'
  | 'Average'
  | 'Needs Improvement'

export type SkillDomain = 'Affective' | 'Psychomotor'

export interface BehaviourTrait {
  id: string
  name: string
  description: string
  status: MasterStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateBehaviourTraitInput {
  name: string
  description?: string
  status?: MasterStatus
}

export type UpdateBehaviourTraitInput =
  Partial<CreateBehaviourTraitInput>

export interface SkillTrait {
  id: string
  name: string
  domain: SkillDomain
  description: string
  status: MasterStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateSkillTraitInput {
  name: string
  domain: SkillDomain
  description?: string
  status?: MasterStatus
}

export type UpdateSkillTraitInput = Partial<CreateSkillTraitInput>

export interface StudentRatingFilter {
  className?: string
  section?: string
  studentId?: string
  traitId?: string
  skillId?: string
  domain?: SkillDomain | ''
  academicYear?: string
  startDate?: string
  endDate?: string
}

export interface BehaviourRating {
  id: string
  studentId: string
  studentName: string
  admissionNo: string
  className: string
  section: string
  traitId: string
  traitName: string
  rating: StudentRating
  ratingDate: string
  academicYear: string
  remarks: string
  ratedBy: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface SaveBehaviourRatingInput {
  studentId: string
  traitId: string
  rating: StudentRating
  ratingDate: string
  academicYear?: string
  remarks?: string
}

export interface SkillRating {
  id: string
  studentId: string
  studentName: string
  admissionNo: string
  className: string
  section: string
  skillId: string
  skillName: string
  domain: SkillDomain
  rating: StudentRating
  ratingDate: string
  academicYear: string
  remarks: string
  ratedBy: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface SaveSkillRatingInput {
  studentId: string
  skillId: string
  rating: StudentRating
  ratingDate: string
  academicYear?: string
  remarks?: string
}

export type ObservationType =
  | 'Academic'
  | 'Behaviour'
  | 'Discipline'
  | 'Health'
  | 'General'

export type ObservationStatus = 'Open' | 'Follow Up' | 'Closed'

export interface StudentObservation {
  id: string
  studentId: string
  studentName: string
  admissionNo: string
  className: string
  section: string
  observationDate: string
  observationType: ObservationType
  observationText: string
  actionTaken: string
  followUpDate: string
  status: ObservationStatus
  createdBy: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface StudentObservationFilter {
  className?: string
  section?: string
  studentId?: string
  observationType?: ObservationType | ''
  status?: ObservationStatus | ''
  startDate?: string
  endDate?: string
}

export interface CreateStudentObservationInput {
  studentId: string
  observationDate: string
  observationType: ObservationType
  observationText: string
  actionTaken?: string
  followUpDate?: string
  status?: ObservationStatus
}

export type UpdateStudentObservationInput =
  Partial<CreateStudentObservationInput>

export type AcademicSessionStatus = 'Active' | 'Inactive' | 'Closed'
export type StudentSessionStatus =
  | 'Active'
  | 'Promoted'
  | 'Repeated'
  | 'TC'
  | 'Left'
  | 'Inactive'
export type StudentResultStatus =
  | 'Pass'
  | 'Fail'
  | 'Repeat'
  | 'TC'
  | 'Left'
  | 'Not Applicable'
export type PromotionAction =
  | 'Promote'
  | 'Repeat'
  | 'TC'
  | 'Left'
  | 'Inactive'
export type CarryForwardDueStatus = 'Pending' | 'Paid' | 'Waived'

export interface AcademicSession {
  id: string
  sessionName: string
  startDate: string
  endDate: string
  status: AcademicSessionStatus
  isCurrent: boolean
  createdAt: string
  updatedAt: string
  closedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateAcademicSessionInput {
  sessionName: string
  startDate?: string
  endDate?: string
}

export type UpdateAcademicSessionInput =
  Partial<CreateAcademicSessionInput>

export interface StudentSessionHistory {
  id: string
  studentId: string
  admissionNo: string
  studentName: string
  academicSessionId: string
  academicSessionName: string
  className: string
  section: string
  rollNo: string
  status: StudentSessionStatus
  resultStatus: StudentResultStatus
  promotedToSessionId: string
  promotedToSessionName: string
  promotedToClass: string
  promotedToSection: string
  promotionDate: string
  remarks: string
  createdAt: string
  updatedAt: string
  syncStatus: SyncStatus
}

export interface SaveStudentSessionHistoryInput {
  studentId: string
  academicSessionId: string
  className?: string
  section?: string
  rollNo?: string
  status?: StudentSessionStatus
  resultStatus?: StudentResultStatus
  remarks?: string
}

export interface PromotionPreviewInput {
  fromSessionId: string
  toSessionId: string
  className: string
  section?: string
  toClass?: string
  toSection?: string
}

export interface PromotionPreviewRow {
  studentId: string
  admissionNo: string
  studentName: string
  currentClass: string
  currentSection: string
  currentStatus: StudentSessionStatus
  oldDueAmount: number
  action: PromotionAction
  newClass: string
  newSection: string
  carryForwardDue: boolean
  carryForwardAmount: number
  remarks: string
}

export interface PromotionPreviewSummary {
  totalStudents: number
  promote: number
  repeat: number
  tc: number
  left: number
  inactive: number
  totalDueAmount: number
  carryForwardAmount: number
}

export interface PromotionPreview {
  fromSession: AcademicSession
  toSession: AcademicSession
  rows: PromotionPreviewRow[]
  summary: PromotionPreviewSummary
}

export interface PromoteStudentItemInput {
  studentId: string
  action: PromotionAction
  newClass?: string
  newSection?: string
  oldDueAmount?: number
  carryForwardDue?: boolean
  carryForwardAmount?: number
  remarks?: string
}

export interface PromoteStudentsInput {
  fromSessionId: string
  toSessionId: string
  fromClass: string
  fromSection?: string
  toClass?: string
  toSection?: string
  promotionDate: string
  remarks?: string
  items: PromoteStudentItemInput[]
}

export interface StudentPromotionItem {
  id: string
  promotionId: string
  studentId: string
  admissionNo: string
  studentName: string
  oldClass: string
  oldSection: string
  newClass: string
  newSection: string
  action: PromotionAction
  oldDueAmount: number
  carriedForwardAmount: number
  remarks: string
  createdAt: string
  updatedAt: string
  syncStatus: SyncStatus
}

export interface StudentPromotion {
  id: string
  promotionNo: string
  fromSessionId: string
  fromSessionName: string
  toSessionId: string
  toSessionName: string
  fromClass: string
  fromSection: string
  toClass: string
  toSection: string
  promotionDate: string
  totalStudents: number
  promotedCount: number
  repeatedCount: number
  tcCount: number
  leftCount: number
  inactiveCount: number
  carryForwardDues: number
  createdBy: string
  remarks: string
  items: StudentPromotionItem[]
  createdAt: string
  updatedAt: string
  syncStatus: SyncStatus
}

export interface CarryForwardDue {
  id: string
  studentId: string
  admissionNo: string
  studentName: string
  fromSessionId: string
  fromSessionName: string
  toSessionId: string
  toSessionName: string
  oldDueAmount: number
  carriedAmount: number
  status: CarryForwardDueStatus
  promotionId: string
  className: string
  section: string
  createdAt: string
  updatedAt: string
  syncStatus: SyncStatus
}

export interface CarryForwardDueFilter {
  fromSessionId?: string
  toSessionId?: string
  className?: string
  section?: string
  status?: CarryForwardDueStatus | ''
}

export interface UpdateCarryForwardDueInput {
  carriedAmount?: number
  status?: CarryForwardDueStatus
}

export interface SessionReport {
  session: AcademicSession
  summary: {
    totalActiveStudents: number
    newAdmissions: number
    promotedStudents: number
    repeatedStudents: number
    tcStudents: number
    leftStudents: number
    inactiveStudents: number
    totalCarriedDues: number
  }
  classCounts: {
    className: string
    section: string
    studentCount: number
  }[]
}

export type SalaryPaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'

export interface SalaryPayment {
  id: string
  salaryNo: string
  employeeId: string
  employeeNo: string
  employeeName: string
  designation: string
  department: string
  salaryMonth: string
  baseSalary: number
  allowances: number
  deductions: number
  netSalary: number
  paymentMode: SalaryPaymentMode
  paymentDate: string
  notes: string
  paidBy: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateSalaryPaymentInput {
  employeeId: string
  salaryMonth: string
  baseSalary: number
  allowances?: number
  deductions?: number
  paymentMode: SalaryPaymentMode
  paymentDate: string
  notes?: string
}

export type UpdateSalaryPaymentInput = Partial<CreateSalaryPaymentInput>

export type AccountType = 'Income' | 'Expense'

export interface AccountCategory {
  id: string
  name: string
  type: AccountType
  description: string
  status: MasterStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateAccountCategoryInput {
  name: string
  type: AccountType
  description?: string
  status?: MasterStatus
}

export type UpdateAccountCategoryInput =
  Partial<CreateAccountCategoryInput>

export interface AccountTransaction {
  id: string
  transactionNo: string
  type: AccountType
  categoryId: string
  categoryName: string
  title: string
  amount: number
  paymentMode: PaymentMode
  transactionDate: string
  referenceNo: string
  linkedModule: string
  linkedRecordId: string
  notes: string
  createdBy: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateAccountTransactionInput {
  type: AccountType
  categoryId: string
  title: string
  amount: number
  paymentMode: PaymentMode
  transactionDate: string
  referenceNo?: string
  notes?: string
  linkedModule?: string
  linkedRecordId?: string
}

export type UpdateAccountTransactionInput =
  Partial<CreateAccountTransactionInput>

export type StudentImportMode = 'skip' | 'update'

export interface StudentImportRow {
  rowNumber: number
  providedFields?: string[]
  admissionNo: string
  name: string
  className: string
  section: string
  guardianName: string
  mobile: string
  fatherName: string
  motherName: string
  address: string
  dateOfBirth: string
  admissionDate: string
  status: string
  email: string
  gender: string
  bloodGroup: string
  aadharNo: string
  previousSchool: string
  notes: string
}

export interface StudentImportOptions {
  mode: StudentImportMode
  autoCreateMasters: boolean
}

export interface StudentImportError {
  rowNumber: number
  admissionNo: string
  message: string
}

export interface StudentImportResult {
  totalRows: number
  imported: number
  inserted: number
  updated: number
  skipped: number
  duplicates: number
  errors: StudentImportError[]
  classesCreated: number
  sectionsCreated: number
}

export interface StudentImportTemplate {
  columns: string[]
  sampleRows: string[][]
  filename: string
}

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
export type FeePaymentStatus = 'Active' | 'Reversed'
export type DiscountMode = 'Fixed' | 'Percentage'
export type BillingPeriod = 'Monthly' | 'Quarterly' | 'Term' | 'Annual' | 'Custom'
export type FeeInvoiceStatus =
  | 'Draft'
  | 'Unpaid'
  | 'Partially Paid'
  | 'Paid'
  | 'Overdue'
  | 'Cancelled'

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
  cashierName: string
  status: FeePaymentStatus
  reversedAt: string | null
  reversedBy: string
  reversalReason: string
  createdAt: string
  updatedAt: string
  syncStatus: 'pending' | 'synced'
}

export interface FeePaymentInvoiceAllocationInput {
  invoiceId: string
  allocatedAmount: number
}

export interface CreateFeePaymentInput {
  studentId: string
  feeType: string
  amount: number
  paymentMode: PaymentMode
  paymentDate: string
  notes?: string
  invoiceAllocations?: FeePaymentInvoiceAllocationInput[]
}

export type Receipt = FeePayment

export interface DiscountType {
  id: string
  name: string
  discountMode: DiscountMode
  defaultValue: number
  description: string
  status: MasterStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateDiscountTypeInput {
  name: string
  discountMode: DiscountMode
  defaultValue?: number
  description?: string
  status?: MasterStatus
}

export type UpdateDiscountTypeInput = Partial<CreateDiscountTypeInput>

export interface StudentDiscount {
  id: string
  studentId: string
  admissionNo: string
  studentName: string
  discountTypeId: string
  discountTypeName: string
  discountMode: DiscountMode
  discountValue: number
  feeHeadId: string
  feeHeadName: string
  academicSessionId: string
  academicSessionName: string
  startDate: string
  endDate: string
  reason: string
  status: MasterStatus
  approvedBy: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface StudentDiscountFilter {
  studentId?: string
  academicSessionId?: string
  status?: MasterStatus | 'All'
}

export interface CreateStudentDiscountInput {
  studentId: string
  discountTypeId: string
  discountMode?: DiscountMode
  discountValue?: number
  feeHeadId?: string
  academicSessionId?: string
  startDate?: string
  endDate?: string
  reason?: string
  status?: MasterStatus
  approvedBy?: string
}

export type UpdateStudentDiscountInput =
  Partial<CreateStudentDiscountInput>

export interface FeeInvoiceItem {
  id: string
  invoiceId: string
  feeHeadId: string
  feeHeadName: string
  description: string
  quantity: number
  unitAmount: number
  grossAmount: number
  discountAmount: number
  netAmount: number
  displayOrder: number
  createdAt: string
  updatedAt: string
  syncStatus: SyncStatus
}

export interface FeeInvoicePreviewItem {
  feeHeadId: string
  feeHeadName: string
  description: string
  quantity: number
  unitAmount: number
  grossAmount: number
  discountAmount: number
  netAmount: number
  displayOrder: number
}

export interface FeeInvoiceAllocation {
  id: string
  invoiceId: string
  feePaymentId: string
  receiptNo: string
  allocatedAmount: number
  createdAt: string
  reversedAt: string | null
  reversalId: string
  syncStatus: SyncStatus
}

export interface FeeInvoice {
  id: string
  invoiceNo: string
  studentId: string
  admissionNo: string
  studentName: string
  className: string
  section: string
  academicSessionId: string
  academicSessionName: string
  billingPeriod: BillingPeriod
  invoiceDate: string
  dueDate: string
  subtotal: number
  discountAmount: number
  previousDue: number
  lateFee: number
  adjustmentAmount: number
  grandTotal: number
  paidAmount: number
  balanceAmount: number
  status: FeeInvoiceStatus
  notes: string
  generatedBy: string
  createdAt: string
  updatedAt: string
  cancelledAt: string | null
  cancelledBy: string
  cancellationReason: string
  syncStatus: SyncStatus
  items: FeeInvoiceItem[]
  allocations: FeeInvoiceAllocation[]
}

export interface FeeInvoicePreviewInput {
  studentId: string
  academicSessionId: string
  billingPeriod: BillingPeriod
  invoiceDate: string
  dueDate?: string
  includePreviousDue?: boolean
  lateFee?: number
  adjustmentAmount?: number
  adjustmentReason?: string
  notes?: string
}

export interface FeeInvoicePreview {
  studentId: string
  admissionNo: string
  studentName: string
  className: string
  section: string
  academicSessionId: string
  academicSessionName: string
  billingPeriod: BillingPeriod
  invoiceDate: string
  dueDate: string
  subtotal: number
  discountAmount: number
  previousDue: number
  lateFee: number
  adjustmentAmount: number
  adjustmentReason: string
  grandTotal: number
  balanceAmount: number
  items: FeeInvoicePreviewItem[]
  discounts: StudentDiscount[]
  possibleDuplicates: FeeInvoice[]
}

export interface CreateFeeInvoiceInput extends FeeInvoicePreviewInput {
  allowDuplicate?: boolean
}

export interface FeeInvoiceFilter {
  academicSessionId?: string
  className?: string
  section?: string
  studentId?: string
  status?: FeeInvoiceStatus | 'All'
  startDate?: string
  endDate?: string
}

export interface FeeInvoiceAllocationInput {
  feePaymentId: string
  allocations: FeePaymentInvoiceAllocationInput[]
}

export interface FeeInvoiceAllocationResult {
  allocations: FeeInvoiceAllocation[]
  invoices: FeeInvoice[]
}

export interface FeeInvoiceSummary {
  invoiceCount: number
  activeInvoiceCount: number
  cancelledInvoiceCount: number
  unpaidInvoiceCount: number
  partiallyPaidInvoiceCount: number
  paidInvoiceCount: number
  overdueInvoiceCount: number
  subtotal: number
  discountAmount: number
  previousDue: number
  lateFee: number
  adjustmentAmount: number
  grandTotal: number
  paidAmount: number
  balanceAmount: number
}

export interface FeeInvoiceAccountsReport {
  summary: {
    invoicedAmount: number
    collectedAmount: number
    outstandingAmount: number
    discountAmount: number
    previousDue: number
  }
  feeHeads: {
    feeHeadId: string
    feeHeadName: string
    invoicedAmount: number
    collectedAmount: number
    outstandingAmount: number
    discountAmount: number
  }[]
}

export interface StudentFeeLedgerEntry {
  id: string
  date: string
  type: string
  referenceNo: string
  description: string
  debit: number
  credit: number
  status: string
  balance: number
}

export interface FeeInvoiceAccountMapping {
  id: string
  feeHeadId: string
  feeHeadName: string
  accountCategoryId: string
  accountCategoryName: string
  status: MasterStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface SaveFeeInvoiceAccountMappingInput {
  feeHeadId: string
  accountCategoryId: string
  status?: MasterStatus
}

export interface FeePaymentReversal {
  id: string
  feePaymentId: string
  receiptNo: string
  amount: number
  reason: string
  reversedBy: string
  createdAt: string
  syncStatus: SyncStatus
}

export interface FeePaymentReversalResult {
  payment: FeePayment
  reversal: FeePaymentReversal
  affectedInvoices: FeeInvoice[]
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Leave'

export interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  admissionNo: string
  className: string
  section: string
  attendanceDate: string
  status: AttendanceStatus
  remarks: string
  createdAt: string
  updatedAt: string
  syncStatus: SyncStatus
}

export interface SaveAttendanceInput {
  studentId: string
  attendanceDate: string
  status: AttendanceStatus
  remarks?: string
}

export interface UpdateAttendanceInput {
  status?: AttendanceStatus
  remarks?: string
}

export interface AttendanceSummary {
  startDate: string
  endDate: string
  totalMarked: number
  present: number
  absent: number
  leave: number
  percentage: number | null
}

export type EmployeeAttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Leave'
  | 'Half Day'
  | 'Late'
  | 'Holiday'

export interface EmployeeAttendanceRecord {
  id: string
  employeeId: string
  employeeCode: string
  employeeName: string
  department: string
  designation: string
  attendanceDate: string
  status: EmployeeAttendanceStatus
  checkInTime: string
  checkOutTime: string
  lateMinutes: number
  overtimeMinutes: number
  leaveType: string
  remarks: string
  markedBy: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface EmployeeAttendanceFilter {
  date?: string
  startDate?: string
  endDate?: string
  month?: string
  employeeId?: string
  department?: string
  designation?: string
  status?: EmployeeAttendanceStatus | 'All'
}

export interface SaveEmployeeAttendanceInput {
  employeeId: string
  attendanceDate: string
  status: EmployeeAttendanceStatus
  checkInTime?: string
  checkOutTime?: string
  lateMinutes?: number
  overtimeMinutes?: number
  leaveType?: string
  remarks?: string
}

export interface UpdateEmployeeAttendanceInput {
  status?: EmployeeAttendanceStatus
  checkInTime?: string
  checkOutTime?: string
  lateMinutes?: number
  overtimeMinutes?: number
  leaveType?: string
  remarks?: string
}

export interface EmployeeAttendanceSummary {
  startDate: string
  endDate: string
  month: string
  totalEmployees: number
  totalMarked: number
  present: number
  absent: number
  leave: number
  halfDay: number
  late: number
  holiday: number
  overtimeMinutes: number
  attendancePercentage: number | null
}

export interface EmployeeMonthlyAttendanceRow {
  employeeId: string
  employeeCode: string
  employeeName: string
  department: string
  designation: string
  month: string
  workingDays: number
  present: number
  absent: number
  leave: number
  halfDays: number
  lateDays: number
  holidays: number
  overtimeMinutes: number
  attendancePercentage: number | null
}

export interface EmployeeMonthlyAttendance
  extends EmployeeMonthlyAttendanceRow {
  records: EmployeeAttendanceRecord[]
}

export interface EmployeeAttendanceReport {
  rows: EmployeeAttendanceRecord[]
  summary: EmployeeAttendanceSummary
  monthlyRows: EmployeeMonthlyAttendanceRow[]
}

export interface Subject {
  id: string
  name: string
  code: string
  className: string
  maxMarks: number
  passingMarks: number
  status: MasterStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateSubjectInput {
  name: string
  code?: string
  className: string
  maxMarks?: number
  passingMarks?: number
  status?: MasterStatus
}

export type UpdateSubjectInput = Partial<CreateSubjectInput>

export interface Exam {
  id: string
  name: string
  className: string
  section: string
  academicYear: string
  examDate: string
  status: MasterStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateExamInput {
  name: string
  className: string
  section?: string
  academicYear?: string
  examDate: string
  status?: MasterStatus
}

export type UpdateExamInput = Partial<CreateExamInput>

export interface MarkRecord {
  id: string
  examId: string
  examName: string
  studentId: string
  studentName: string
  admissionNo: string
  className: string
  section: string
  subjectId: string
  subjectName: string
  maxMarks: number
  passingMarks: number
  obtainedMarks: number
  remarks: string
  createdAt: string
  updatedAt: string
  syncStatus: SyncStatus
}

export interface SaveMarkInput {
  examId: string
  studentId: string
  subjectId: string
  obtainedMarks: number
  remarks?: string
}

export interface UpdateMarkInput {
  obtainedMarks?: number
  remarks?: string
}

export interface MarksheetSummary {
  totalMarks: number
  obtainedMarks: number
  percentage: number
  result: 'Pass' | 'Fail'
  grade: string
  remarks: string
}

export type GradingCalculationMode = 'Percentage' | 'Marks'
export type GradingResultStatus = 'Pass' | 'Fail'
export type ReportCardResultStatus =
  | 'Pass'
  | 'Fail'
  | 'Promoted'
  | 'Detained'
  | 'Pending'

export interface GradingRange {
  id: string
  gradingSchemeId: string
  minValue: number
  maxValue: number
  grade: string
  gradePoint: number | null
  resultStatus: GradingResultStatus
  description: string
  displayOrder: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface GradingRangeInput {
  id?: string
  minValue: number
  maxValue: number
  grade: string
  gradePoint?: number | null
  resultStatus?: GradingResultStatus
  description?: string
  displayOrder?: number
}

export interface GradingScheme {
  id: string
  name: string
  academicSessionId: string
  academicSessionName: string
  className: string
  calculationMode: GradingCalculationMode
  status: MasterStatus
  isDefault: boolean
  description: string
  createdBy: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
  ranges: GradingRange[]
}

export interface CreateGradingSchemeInput {
  name: string
  academicSessionId?: string
  className?: string
  calculationMode?: GradingCalculationMode
  status?: MasterStatus
  isDefault?: boolean
  description?: string
  ranges: GradingRangeInput[]
}

export type UpdateGradingSchemeInput = Partial<CreateGradingSchemeInput>

export interface CalculateGradeInput {
  value: number
  gradingSchemeId?: string
  academicSessionId?: string
  className?: string
}

export interface CalculateGradeResult {
  scheme: GradingScheme
  value: number
  grade: string
  gradePoint: number | null
  resultStatus: GradingResultStatus
  range: GradingRange | null
}

export interface ReportCardTemplate {
  id: string
  name: string
  templateType: 'Standard' | 'Detailed'
  academicSessionId: string
  className: string
  showAttendance: boolean
  showClassTests: boolean
  showBehaviour: boolean
  showSkills: boolean
  showTeacherRemarks: boolean
  showPrincipalSignature: boolean
  headerText: string
  footerText: string
  status: MasterStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface ReportCardTemplateInput {
  name: string
  templateType?: 'Standard' | 'Detailed'
  academicSessionId?: string
  className?: string
  showAttendance?: boolean
  showClassTests?: boolean
  showBehaviour?: boolean
  showSkills?: boolean
  showTeacherRemarks?: boolean
  showPrincipalSignature?: boolean
  headerText?: string
  footerText?: string
  status?: MasterStatus
}

export type UpdateReportCardTemplateInput =
  Partial<ReportCardTemplateInput>

export interface StudentReportCardSubject {
  id: string
  reportCardId: string
  subjectId: string
  subjectName: string
  maxMarks: number
  passingMarks: number
  obtainedMarks: number
  percentage: number
  grade: string
  gradePoint: number | null
  resultStatus: string
  remarks: string
  displayOrder: number
  createdAt: string
  updatedAt: string
  syncStatus: SyncStatus
}

export interface ReportCardClassTestSnapshot {
  testName: string
  subjectName: string
  testDate: string
  maxMarks: number
  passingMarks: number
  obtainedMarks: number
  resultStatus: string
  remarks: string
}

export interface ReportCardPreview {
  student: {
    id: string
    admissionNo: string
    name: string
    className: string
    section: string
    guardianName: string
    rollNo: string
  }
  exam: Exam
  academicSession: AcademicSession | null
  gradingScheme: GradingScheme
  template: ReportCardTemplate
  subjects: StudentReportCardSubject[]
  totalMaxMarks: number
  totalObtainedMarks: number
  percentage: number
  overallGrade: string
  overallGradePoint: number | null
  resultStatus: ReportCardResultStatus
  attendance: {
    workingDays: number
    presentDays: number
    percentage: number
    startDate: string
    endDate: string
  }
  behaviourRatings: BehaviourRating[]
  affectiveSkills: SkillRating[]
  psychomotorSkills: SkillRating[]
  classTests: ReportCardClassTestSnapshot[]
  teacherRemarks: string
  principalRemarks: string
  rankingMethod: string
}

export interface ReportCardPreviewInput {
  academicSessionId?: string
  className?: string
  section?: string
  examId: string
  gradingSchemeId?: string
  templateId?: string
  studentId: string
  teacherRemarks?: string
  principalRemarks?: string
}

export interface GenerateReportCardInput extends ReportCardPreviewInput {
  generatedDate?: string
  regenerate?: boolean
  regenerateReportCardId?: string
}

export interface GenerateClassReportCardsInput
  extends Omit<GenerateReportCardInput, 'studentId'> {
  studentId?: string
}

export interface StudentReportCard {
  id: string
  reportCardNo: string
  studentId: string
  admissionNo: string
  studentName: string
  className: string
  section: string
  academicSessionId: string
  academicSessionName: string
  examId: string
  examName: string
  gradingSchemeId: string
  gradingSchemeName: string
  totalMaxMarks: number
  totalObtainedMarks: number
  percentage: number
  overallGrade: string
  resultStatus: ReportCardResultStatus
  attendanceWorkingDays: number
  attendancePresentDays: number
  attendancePercentage: number
  classPosition: number | null
  sectionPosition: number | null
  teacherRemarks: string
  principalRemarks: string
  generatedBy: string
  generatedAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
  subjects: StudentReportCardSubject[]
}

export interface ReportCardFilter {
  academicSessionId?: string
  className?: string
  section?: string
  examId?: string
  studentId?: string
  resultStatus?: ReportCardResultStatus | 'All'
}

export interface UpdateReportCardRemarksInput {
  teacherRemarks?: string
  principalRemarks?: string
}

export interface ClassResultSubjectSummary {
  subjectName: string
  appeared: number
  passed: number
  failed: number
  highest: number
  lowest: number
  average: number
  passPercentage: number
}

export interface ResultPosition {
  position: number
  reportCardId: string
  studentId: string
  studentName: string
  admissionNo: string
  total: number
  percentage: number
  grade: string
  resultStatus: ReportCardResultStatus
}

export interface ClassResultSummary {
  summary: {
    totalStudents: number
    resultComplete: number
    passed: number
    failed: number
    absentOrIncomplete: number
    passPercentage: number
    highestPercentage: number
    lowestPercentage: number
    classAverage: number
  }
  subjectSummaries: ClassResultSubjectSummary[]
  rankings: ResultPosition[]
  cards: StudentReportCard[]
  rankingMethod: string
}

export interface GenerateClassReportCardsResult {
  count: number
  reportCards: StudentReportCard[]
}

export type CertificateType =
  | 'Bonafide'
  | 'Character'
  | 'Transfer'
  | 'Admission'
  | 'Custom'

export interface CertificateTemplate {
  id: string
  name: string
  type: CertificateType
  bodyTemplate: string
  status: MasterStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface CreateCertificateTemplateInput {
  name: string
  type: CertificateType
  bodyTemplate: string
  status?: MasterStatus
}

export type UpdateCertificateTemplateInput =
  Partial<CreateCertificateTemplateInput>

export interface IssuedCertificate {
  id: string
  certificateNo: string
  studentId: string
  studentName: string
  admissionNo: string
  className: string
  section: string
  templateId: string
  certificateType: CertificateType
  issuedDate: string
  body: string
  issuedBy: string
  createdAt: string
  updatedAt: string
  syncStatus: SyncStatus
}

export interface IssueCertificateInput {
  studentId: string
  templateId: string
  issuedDate: string
}

export type MessageThreadType =
  | 'Direct'
  | 'Announcement'
  | 'Class Notice'
  | 'Staff Notice'
  | 'System'

export type MessagePriority = 'Low' | 'Normal' | 'High' | 'Urgent'

export type MessageThreadStatus = 'Active' | 'Archived' | 'Closed'

export type MessageType = 'Text' | 'Notice' | 'System'

export type MessageDeliveryStatus = 'Delivered' | 'Read' | 'Archived'

export type AnnouncementAudienceType =
  | 'All Users'
  | 'All Students'
  | 'All Employees'
  | 'Teachers'
  | 'Accountants'
  | 'Specific Class'
  | 'Specific Section'
  | 'Selected Users'

export type AnnouncementStatus =
  | 'Draft'
  | 'Published'
  | 'Expired'
  | 'Cancelled'

export interface MessageRecipientCandidate {
  userId: string
  name: string
  username: string
  role: PermissionRole
  accountType: UserAccountType
  entityType: EntityType | 'User'
  entityId: string
  entityCode: string
  entityName: string
  className: string
  section: string
  department: string
  designation: string
  label: string
}

export interface MessageRecipient {
  id: string
  threadId: string
  recipientUserId: string
  recipientName: string
  recipientUsername: string
  recipientRole: PermissionRole | ''
  recipientEntityType: EntityType | 'User' | ''
  recipientEntityId: string
  recipientEntityCode: string
  recipientEntityName: string
  className: string
  section: string
  deliveryStatus: MessageDeliveryStatus
  deliveredAt: string
  readAt: string
  archivedAt: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface MessageItem {
  id: string
  threadId: string
  senderUserId: string
  senderName: string
  senderRole: PermissionRole | ''
  messageText: string
  messageType: MessageType
  replyToMessageId: string
  editedAt: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  isDeleted: boolean
  syncStatus: SyncStatus
}

export interface MessageThreadSummary {
  id: string
  subject: string
  threadType: MessageThreadType
  createdByUserId: string
  createdByName: string
  createdByRole: PermissionRole | ''
  academicSessionId: string
  className: string
  section: string
  status: MessageThreadStatus
  priority: MessagePriority
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
  senderName: string
  senderRole: PermissionRole | ''
  lastMessageAt: string
  lastMessagePreview: string
  deliveryStatus: MessageDeliveryStatus | ''
  deliveredAt: string
  readAt: string
  archivedAt: string
  isRead: boolean
  unreadCount: number
  recipientCount: number
  readCount: number
  recipientSummary: string
  announcementId: string
}

export interface MessageThreadDetail extends MessageThreadSummary {
  messages: MessageItem[]
  recipients: MessageRecipient[]
  canReply: boolean
}

export interface MessageFilter {
  search?: string
  unreadOnly?: boolean
  archived?: boolean
  threadType?: MessageThreadType
  type?: MessageThreadType
  priority?: MessagePriority
  limit?: number
}

export interface CreateDirectMessageInput {
  recipientType?: EntityType | 'User'
  recipientUserId?: string
  recipientUserIds?: string[]
  subject: string
  priority?: MessagePriority
  messageText: string
  academicSessionId?: string
  className?: string
  section?: string
}

export interface ReplyToMessageThreadInput {
  threadId: string
  messageText: string
  replyToMessageId?: string
}

export interface Announcement {
  id: string
  title: string
  announcementText: string
  audienceType: AnnouncementAudienceType
  academicSessionId: string
  className: string
  section: string
  priority: MessagePriority
  publishFrom: string
  publishUntil: string
  status: AnnouncementStatus
  selectedUserIds: string[]
  createdByUserId: string
  createdByName: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
  recipientCount: number
  readCount: number
  threadId: string
}

export interface AnnouncementInput {
  title: string
  announcementText: string
  audienceType: AnnouncementAudienceType
  academicSessionId?: string
  className?: string
  section?: string
  priority?: MessagePriority
  publishFrom?: string
  publishUntil?: string
  status?: 'Draft' | 'Published'
  selectedUserIds?: string[]
}

export type UpdateAnnouncementInput = Partial<AnnouncementInput>

export interface MessageDeliveryReport {
  thread: MessageThreadSummary
  recipients: MessageRecipient[]
}

export interface AnnouncementReadReport {
  announcement: Announcement
  recipients: MessageRecipient[]
}

export interface StudentPortalData {
  student: Student
  guardians: StudentGuardianLink[]
  attendance: AttendanceRecord[]
  timetable: TimetableEntry[]
  homework: Homework[]
  classTests: ClassTest[]
  marks: MarkRecord[]
  reportCards: StudentReportCard[]
  feePayments: FeePayment[]
  feeLedger: StudentFeeLedgerEntry[]
  invoices: FeeInvoice[]
  certificates: IssuedCertificate[]
  announcements: MessageThreadSummary[]
  unreadMessageCount: number
}

export interface EmployeePortalData {
  employee: Employee
  attendance: EmployeeAttendanceRecord[]
  salaryPayments: SalaryPayment[]
  timetable: TimetableEntry[]
  announcements: MessageThreadSummary[]
  unreadMessageCount: number
}

export interface DatabaseInfo {
  databasePath: string
  databaseDirectory: string
  fileSizeBytes: number
  fileSizeLabel: string
  lastModified: string
  exists: boolean
  restorePending: boolean
  recommendation: string
}

export interface DatabaseActionResult {
  success: boolean
  canceled?: boolean
  message: string
  path?: string
  safetyBackupPath?: string
  requiresRestart?: boolean
}

export interface DemoDataCreatedCounts {
  classes: number
  sections: number
  feeHeads: number
  feeStructures: number
  students: number
  feePayments: number
  attendance: number
  subjects: number
  exams: number
  marks: number
}

export interface DemoDataResult {
  success: boolean
  alreadyPresent: boolean
  message: string
  created: DemoDataCreatedCounts
}
