import type { AppPreference } from '../types'

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const pad = (value: number) => String(value).padStart(2, '0')

export function formatPreferenceDate(
  value: string,
  preferences?: Pick<AppPreference, 'dateFormat'>,
) {
  if (!value) return '—'
  const dateOnly = value.slice(0, 10)
  const [year, month, day] = dateOnly.split('-').map(Number)
  if (!year || !month || !day) return value
  switch (preferences?.dateFormat) {
    case 'MM/DD/YYYY':
      return `${pad(month)}/${pad(day)}/${year}`
    case 'YYYY-MM-DD':
      return `${year}-${pad(month)}-${pad(day)}`
    case 'DD MMM YYYY':
      return `${pad(day)} ${monthNames[month - 1]} ${year}`
    case 'DD/MM/YYYY':
    default:
      return `${pad(day)}/${pad(month)}/${year}`
  }
}

export function formatPreferenceDateTime(
  value: string,
  preferences?: Pick<AppPreference, 'dateFormat' | 'timeFormat'>,
) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  const date = formatPreferenceDate(parsed.toISOString().slice(0, 10), preferences)
  const hours = parsed.getHours()
  const minutes = pad(parsed.getMinutes())
  if (preferences?.timeFormat === '24 Hour') {
    return `${date} ${pad(hours)}:${minutes}`
  }
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${date} ${pad(hour12)}:${minutes} ${suffix}`
}
