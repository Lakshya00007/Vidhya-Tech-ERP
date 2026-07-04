export type DocumentNotice = {
  type: 'success' | 'error'
  message: string
}

export interface DocumentNoticeProps {
  onNotice: (notice: DocumentNotice) => void
}
