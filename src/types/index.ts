export type PageId =
  | 'dashboard'
  | 'students'
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
  | 'placeholder'

export interface ModulePlaceholderInfo {
  id: string
  module: string
  title: string
  description?: string
}

export type PermissionRole =
  | 'Owner'
  | 'Admin'
  | 'Accountant'
  | 'Teacher'
  | 'Viewer'

export type LicenseState =
  | 'missing'
  | 'active'
  | 'expiring-soon'
  | 'expired'
  | 'maintenance-expired'
  | 'invalid'

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

export interface LicenseStatus {
  status: LicenseState
  isValid: boolean
  message: string
  daysUntilExpiry: number | null
  deviceId: string
  license: LicenseInfo | null
  activatedAt: string | null
  lastCheckedAt: string | null
}

export interface User {
  id: string
  name: string
  email: string
  username: string
  role: PermissionRole
  status: MasterStatus
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
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
  role?: PermissionRole
  status?: MasterStatus
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
