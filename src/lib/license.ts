import type { LicenseState, LicenseStatus } from '../types'

export const licenseStatusLabels: Record<LicenseState, string> = {
  missing: 'Activation Required',
  active: 'Active',
  'expiring-soon': 'Expiring Soon',
  expired: 'Expired',
  'maintenance-expired': 'Maintenance Expired',
  invalid: 'Invalid',
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

const normalizeFeature = (feature: string) =>
  feature.trim().toLowerCase().replace(/[\s_]+/g, '-')

export function hasLicenseFeature(
  status: LicenseStatus,
  requestedFeature: string,
) {
  const features = status.license?.features.map(normalizeFeature) ?? []
  const feature = normalizeFeature(requestedFeature)
  return (
    features.includes('all') ||
    features.includes('advanced') ||
    features.includes(feature)
  )
}
