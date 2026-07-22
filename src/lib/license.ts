import type {
  LicenseState,
  LicenseStatus,
  RemoteLicenseDisplayStatus,
} from '../types'

export const licenseStatusLabels: Record<LicenseState, string> = {
  missing: 'Activation Required',
  active: 'Active',
  'expiring-soon': 'Expiring Soon',
  expired: 'Expired',
  'maintenance-expired': 'Maintenance Expired',
  invalid: 'Invalid',
}

export const remoteLicenseStatusLabels: Record<
  RemoteLicenseDisplayStatus,
  string
> = {
  'Online Verified': 'Online Verified',
  'Offline Grace': 'Offline Grace',
  Suspended: 'Suspended',
  Expired: 'Expired',
  Revoked: 'Revoked',
  'Check Required': 'Check Required',
}

export function formatLicenseDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date)
}

export function shouldCheckRemoteLicense(
  status: LicenseStatus | null | undefined,
) {
  const nextRequiredCheckAt = status?.remote?.nextRequiredCheckAt
  if (!status?.isValid || !nextRequiredCheckAt) return false
  const date = new Date(nextRequiredCheckAt)
  return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now()
}

const normalizeFeature = (feature: string) =>
  feature.trim().toLowerCase().replace(/[\s_]+/g, '-')

export function hasFeature(
  status: LicenseStatus,
  requestedFeature: string,
) {
  if (!status.isValid || status.remote?.blocksUsage) {
    return false
  }
  const features = status.license?.features.map(normalizeFeature) ?? []
  const feature = normalizeFeature(requestedFeature)
  return features.includes('all') || features.includes(feature)
}
