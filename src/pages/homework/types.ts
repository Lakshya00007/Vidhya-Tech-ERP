import type {
  ClassItem,
  Employee,
  Homework,
  SchoolSettings,
  SectionItem,
  Subject,
} from '../../types'

export type HomeworkView = 'dashboard' | 'assign' | 'report'

export interface HomeworkNotice {
  type: 'success' | 'error'
  message: string
}

export interface HomeworkData {
  homework: Homework[]
  classes: ClassItem[]
  sections: SectionItem[]
  subjects: Subject[]
  employees: Employee[]
  settings: SchoolSettings
}

export interface HomeworkChildProps {
  data: HomeworkData
  onNotice: (notice: HomeworkNotice | null) => void
}
