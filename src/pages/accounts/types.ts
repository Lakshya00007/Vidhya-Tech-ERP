export type AccountsNotice = {
  type: 'success' | 'error'
  message: string
}

export interface AccountsNoticeProps {
  onNotice: (notice: AccountsNotice) => void
}
