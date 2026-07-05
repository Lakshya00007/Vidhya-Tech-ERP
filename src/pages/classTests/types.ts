import type {
  ClassItem,
  ClassTest,
  Employee,
  SchoolSettings,
  SectionItem,
  Subject,
} from '../../types'

export type ClassTestsView = 'manage' | 'result'

export interface ClassTestsNotice {
  type: 'success' | 'error'
  message: string
}

export interface ClassTestsData {
  tests: ClassTest[]
  classes: ClassItem[]
  sections: SectionItem[]
  subjects: Subject[]
  employees: Employee[]
  settings: SchoolSettings
}

export interface ClassTestsChildProps {
  data: ClassTestsData
  onNotice: (notice: ClassTestsNotice | null) => void
}
