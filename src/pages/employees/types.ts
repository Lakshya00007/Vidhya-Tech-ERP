export type EmployeeNotice = {
  type: 'success' | 'error'
  message: string
}

export interface EmployeeNoticeProps {
  onNotice: (notice: EmployeeNotice) => void
}
