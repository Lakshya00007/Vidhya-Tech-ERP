import type { SchoolSettings, Student } from '../types'

export const certificateVariables = [
  '{{schoolName}}',
  '{{studentName}}',
  '{{admissionNo}}',
  '{{className}}',
  '{{section}}',
  '{{guardianName}}',
  '{{date}}',
  '{{academicYear}}',
] as const

export function getTodayDateInput() {
  const now = new Date()
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

export function formatDocumentDate(value: string) {
  if (!value) return '—'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(date)
}

export function renderCertificateTemplate(
  template: string,
  settings: SchoolSettings,
  student: Student,
  issuedDate: string,
) {
  const values: Record<string, string> = {
    schoolName: settings.schoolName,
    studentName: student.name,
    admissionNo: student.admissionNo,
    className: student.className,
    section: student.section,
    guardianName: student.guardianName,
    date: formatDocumentDate(issuedDate),
    academicYear: settings.academicYear,
  }

  return Object.entries(values).reduce(
    (body, [name, value]) => body.replaceAll(`{{${name}}}`, value),
    template,
  )
}

export function getStudentInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
