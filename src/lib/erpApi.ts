import type { ErpApi } from '../types/electron'

export const ATTENDANCE_API_UNAVAILABLE_MESSAGE =
  'Attendance database API is not available. Please restart the Electron app.'

export const BACKUP_API_UNAVAILABLE_MESSAGE =
  'Backup database API is not available. Please restart the Electron app.'

export const AUTH_API_UNAVAILABLE_MESSAGE =
  'Login is available only inside the Electron desktop app.'

export const LICENSE_API_UNAVAILABLE_MESSAGE =
  'License activation is available only inside the Electron desktop app.'

export const DOCUMENTS_API_UNAVAILABLE_MESSAGE =
  'Student documents are available only inside the Electron desktop app.'

export const EMPLOYEES_API_UNAVAILABLE_MESSAGE =
  'Employee management is available only inside the Electron desktop app.'

export const SALARY_API_UNAVAILABLE_MESSAGE =
  'Salary management is available only inside the Electron desktop app.'

export const ACCOUNTS_API_UNAVAILABLE_MESSAGE =
  'Accounts management is available only inside the Electron desktop app.'

export const TIMETABLE_API_UNAVAILABLE_MESSAGE =
  'Timetable management is available only inside the Electron desktop app.'

export const HOMEWORK_API_UNAVAILABLE_MESSAGE =
  'Homework management is available only inside the Electron desktop app.'

export const CLASS_TESTS_API_UNAVAILABLE_MESSAGE =
  'Class test management is available only inside the Electron desktop app.'

export const QUESTION_PAPER_API_UNAVAILABLE_MESSAGE =
  'Question paper management is available only inside the Electron desktop app.'

const licenseApiMethods = [
  'getDeviceId',
  'getLicenseStatus',
  'activateLicense',
  'deactivateLicense',
  'getLicenseInfo',
] as const satisfies ReadonlyArray<keyof ErpApi>

const authApiMethods = [
  'hasUsers',
  'createFirstOwner',
  'login',
  'logout',
  'getCurrentUser',
] as const satisfies ReadonlyArray<keyof ErpApi>

const attendanceApiMethods = [
  'getAttendance',
  'getAttendanceByDate',
  'getAttendanceByClassDate',
  'getAttendanceByDateRange',
  'getAttendanceSummary',
  'saveAttendanceBulk',
  'updateAttendance',
] as const satisfies ReadonlyArray<keyof ErpApi>

const backupApiMethods = [
  'createDatabaseBackup',
  'restoreDatabaseBackup',
  'getDatabaseInfo',
  'openDatabaseFolder',
  'restartApp',
] as const satisfies ReadonlyArray<keyof ErpApi>

const documentApiMethods = [
  'getCertificateTemplates',
  'createCertificateTemplate',
  'updateCertificateTemplate',
  'deleteCertificateTemplate',
  'issueCertificate',
  'getIssuedCertificates',
  'getIssuedCertificatesByStudent',
] as const satisfies ReadonlyArray<keyof ErpApi>

const employeeApiMethods = [
  'getEmployees',
  'getEmployeeById',
  'createEmployee',
  'updateEmployee',
  'deleteEmployee',
] as const satisfies ReadonlyArray<keyof ErpApi>

const salaryApiMethods = [
  'getSalaryPayments',
  'getSalaryPaymentsByDateRange',
  'getSalaryPaymentsByEmployee',
  'createSalaryPayment',
  'updateSalaryPayment',
  'deleteSalaryPayment',
] as const satisfies ReadonlyArray<keyof ErpApi>

const accountApiMethods = [
  'getAccountCategories',
  'createAccountCategory',
  'updateAccountCategory',
  'deleteAccountCategory',
  'getAccountTransactions',
  'getAccountTransactionsByDateRange',
  'createAccountTransaction',
  'updateAccountTransaction',
  'deleteAccountTransaction',
] as const satisfies ReadonlyArray<keyof ErpApi>

const timetableApiMethods = [
  'getTimetableWeekdays',
  'createTimetableWeekday',
  'updateTimetableWeekday',
  'deleteTimetableWeekday',
  'getTimetablePeriods',
  'createTimetablePeriod',
  'updateTimetablePeriod',
  'deleteTimetablePeriod',
  'getClassrooms',
  'createClassroom',
  'updateClassroom',
  'deleteClassroom',
  'getTimetableEntries',
  'getTimetableByClass',
  'getTimetableByTeacher',
  'createOrUpdateTimetableEntry',
  'deleteTimetableEntry',
] as const satisfies ReadonlyArray<keyof ErpApi>

const homeworkApiMethods = [
  'getHomework',
  'getHomeworkByClass',
  'createHomework',
  'updateHomework',
  'deleteHomework',
  'getHomeworkSubmissions',
  'saveHomeworkSubmissionsBulk',
  'updateHomeworkSubmission',
] as const satisfies ReadonlyArray<keyof ErpApi>

const classTestsApiMethods = [
  'getClassTests',
  'getClassTestsByClass',
  'createClassTest',
  'updateClassTest',
  'deleteClassTest',
  'getClassTestMarks',
  'saveClassTestMarksBulk',
  'updateClassTestMark',
] as const satisfies ReadonlyArray<keyof ErpApi>

const questionPaperApiMethods = [
  'getSubjectChapters',
  'getSubjectChaptersByClassSubject',
  'createSubjectChapter',
  'updateSubjectChapter',
  'deleteSubjectChapter',
  'getQuestions',
  'getQuestionsByFilter',
  'createQuestion',
  'updateQuestion',
  'deleteQuestion',
  'getQuestionPapers',
  'getQuestionPaperById',
  'createQuestionPaper',
  'updateQuestionPaper',
  'deleteQuestionPaper',
] as const satisfies ReadonlyArray<keyof ErpApi>

export function getErpApi(): ErpApi {
  if (!window.erpApi) {
    throw new Error('The local database is available only inside the Electron desktop app.')
  }
  return window.erpApi
}

export function getAuthErpApi(): ErpApi {
  const api = window.erpApi
  if (!api || authApiMethods.some((method) => typeof api[method] !== 'function')) {
    throw new Error(AUTH_API_UNAVAILABLE_MESSAGE)
  }
  return api
}

export function getLicenseErpApi(): ErpApi {
  const api = window.erpApi
  if (
    !api ||
    licenseApiMethods.some((method) => typeof api[method] !== 'function')
  ) {
    throw new Error(LICENSE_API_UNAVAILABLE_MESSAGE)
  }
  return api
}

export function getAttendanceErpApi(): ErpApi {
  const api = window.erpApi
  if (
    !api ||
    attendanceApiMethods.some((method) => typeof api[method] !== 'function')
  ) {
    throw new Error(ATTENDANCE_API_UNAVAILABLE_MESSAGE)
  }
  return api
}

export function getBackupErpApi(): ErpApi {
  const api = window.erpApi
  if (
    !api ||
    backupApiMethods.some((method) => typeof api[method] !== 'function')
  ) {
    throw new Error(BACKUP_API_UNAVAILABLE_MESSAGE)
  }
  return api
}

export function getDocumentsErpApi(): ErpApi {
  const api = window.erpApi
  if (
    !api ||
    documentApiMethods.some((method) => typeof api[method] !== 'function')
  ) {
    throw new Error(DOCUMENTS_API_UNAVAILABLE_MESSAGE)
  }
  return api
}

export function getEmployeesErpApi(): ErpApi {
  const api = window.erpApi
  if (
    !api ||
    employeeApiMethods.some((method) => typeof api[method] !== 'function')
  ) {
    throw new Error(EMPLOYEES_API_UNAVAILABLE_MESSAGE)
  }
  return api
}

export function getSalaryErpApi(): ErpApi {
  const api = window.erpApi
  if (
    !api ||
    salaryApiMethods.some((method) => typeof api[method] !== 'function')
  ) {
    throw new Error(SALARY_API_UNAVAILABLE_MESSAGE)
  }
  return api
}

export function getAccountsErpApi(): ErpApi {
  const api = window.erpApi
  if (
    !api ||
    accountApiMethods.some((method) => typeof api[method] !== 'function')
  ) {
    throw new Error(ACCOUNTS_API_UNAVAILABLE_MESSAGE)
  }
  return api
}

export function getTimetableErpApi(): ErpApi {
  const api = window.erpApi
  if (
    !api ||
    timetableApiMethods.some((method) => typeof api[method] !== 'function')
  ) {
    throw new Error(TIMETABLE_API_UNAVAILABLE_MESSAGE)
  }
  return api
}

export function getHomeworkErpApi(): ErpApi {
  const api = window.erpApi
  if (
    !api ||
    homeworkApiMethods.some((method) => typeof api[method] !== 'function')
  ) {
    throw new Error(HOMEWORK_API_UNAVAILABLE_MESSAGE)
  }
  return api
}

export function getClassTestsErpApi(): ErpApi {
  const api = window.erpApi
  if (
    !api ||
    classTestsApiMethods.some((method) => typeof api[method] !== 'function')
  ) {
    throw new Error(CLASS_TESTS_API_UNAVAILABLE_MESSAGE)
  }
  return api
}

export function getQuestionPaperErpApi(): ErpApi {
  const api = window.erpApi
  if (
    !api ||
    questionPaperApiMethods.some(
      (method) => typeof api[method] !== 'function',
    )
  ) {
    throw new Error(QUESTION_PAPER_API_UNAVAILABLE_MESSAGE)
  }
  return api
}

export function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'An unexpected local database error occurred.'
  }

  return error.message
    .replace(/^Error invoking remote method '[^']+': Error: /, '')
    .replace(/^Error: /, '')
}
