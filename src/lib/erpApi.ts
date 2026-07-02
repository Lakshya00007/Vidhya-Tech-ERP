import type { ErpApi } from '../types/electron'

export function getErpApi(): ErpApi {
  if (!window.erpApi) {
    throw new Error('The local database is available only inside the Electron desktop app.')
  }
  return window.erpApi
}

export function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'An unexpected local database error occurred.'
  }

  return error.message
    .replace(/^Error invoking remote method '[^']+': Error: /, '')
    .replace(/^Error: /, '')
}
