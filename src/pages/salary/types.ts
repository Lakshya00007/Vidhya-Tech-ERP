export type SalaryNotice = {
  type: 'success' | 'error'
  message: string
}

export interface SalaryNoticeProps {
  onNotice: (notice: SalaryNotice) => void
}
