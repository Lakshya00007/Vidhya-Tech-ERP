import type {
  AcademicSession,
  ClassItem,
  PermissionRole,
  SchoolSettings,
  SectionItem,
  Student,
  StudentPromotion,
} from '../../types'

export type AcademicSessionsView =
  | 'sessions'
  | 'promote'
  | 'history'
  | 'dues'
  | 'report'

export interface AcademicSessionsNotice {
  type: 'success' | 'error'
  message: string
}

export interface AcademicSessionsData {
  sessions: AcademicSession[]
  currentSession: AcademicSession | null
  classes: ClassItem[]
  sections: SectionItem[]
  students: Student[]
  promotions: StudentPromotion[]
  settings: SchoolSettings
  role: PermissionRole
}

export interface AcademicSessionsChildProps {
  data: AcademicSessionsData
  onNotice: (notice: AcademicSessionsNotice | null) => void
  onRefresh: () => Promise<void>
}
