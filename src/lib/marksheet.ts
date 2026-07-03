import type { MarkRecord, MarksheetSummary } from '../types'

export const getGrade = (percentage: number) => {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B+'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C'
  if (percentage >= 33) return 'D'
  return 'Fail'
}

export function calculateMarksheetSummary(
  marks: MarkRecord[],
): MarksheetSummary | null {
  if (marks.length === 0) return null

  const totalMarks = marks.reduce((total, mark) => total + mark.maxMarks, 0)
  const obtainedMarks = marks.reduce(
    (total, mark) => total + mark.obtainedMarks,
    0,
  )
  const percentage =
    totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0
  const result = marks.every(
    (mark) => mark.obtainedMarks >= mark.passingMarks,
  )
    ? 'Pass'
    : 'Fail'
  const remarks = Array.from(
    new Set(marks.map((mark) => mark.remarks.trim()).filter(Boolean)),
  ).join('; ')

  return {
    totalMarks,
    obtainedMarks,
    percentage,
    result,
    grade: result === 'Pass' ? getGrade(percentage) : 'Fail',
    remarks,
  }
}
