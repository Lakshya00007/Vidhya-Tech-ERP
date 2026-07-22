export type CsvValue = string | number | null | undefined

const escapeCsvValue = (value: CsvValue) => {
  const text = value == null ? '' : String(value)
  const safeText =
    typeof value === 'string' && /^[=+\-@]/.test(text) ? `'${text}` : text
  return /[",\r\n]/.test(safeText)
    ? `"${safeText.replaceAll('"', '""')}"`
    : safeText
}

export function exportCsv(
  filename: string,
  headers: string[],
  rows: CsvValue[][],
) {
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

export const formatReportDate = (value: string) => {
  const dateText = value.slice(0, 10)
  const date = new Date(`${dateText}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date)
}

export const formatGeneratedAt = (date = new Date()) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)

export const formatReportMonth = (monthValue: string) => {
  const range = getMonthDateRange(monthValue)
  if (!range) return monthValue

  return new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${range.startDate}T00:00:00`))
}

export const getTodayValue = () => {
  const today = new Date()
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')
}

export const getCurrentMonthValue = () => getTodayValue().slice(0, 7)

export const getMonthDateRange = (monthValue: string) => {
  const match = /^(\d{4})-(\d{2})$/.exec(monthValue)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  if (month < 1 || month > 12) return null

  const lastDay = new Date(year, month, 0).getDate()
  return {
    startDate: `${match[1]}-${match[2]}-01`,
    endDate: `${match[1]}-${match[2]}-${String(lastDay).padStart(2, '0')}`,
  }
}
