import type { ErpApi } from '../types/electron'

export const ATTENDANCE_API_UNAVAILABLE_MESSAGE =
  'Attendance database API is not available. Please restart the Electron app.'

export const BACKUP_API_UNAVAILABLE_MESSAGE =
  'Backup database API is not available. Please restart the Electron app.'

export const AUTH_API_UNAVAILABLE_MESSAGE =
  'Login is available only inside the Electron desktop app.'

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

export function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'An unexpected local database error occurred.'
  }

  return error.message
    .replace(/^Error invoking remote method '[^']+': Error: /, '')
    .replace(/^Error: /, '')
}
