export interface ExamNotice {
  type: 'success' | 'error'
  message: string
}

export interface ExamTabNoticeProps {
  onNotice: (notice: ExamNotice) => void
}
