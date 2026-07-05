import type {
  ClassItem,
  Classroom,
  Employee,
  SchoolSettings,
  SectionItem,
  Subject,
  TimetableEntry,
  TimetablePeriod,
  TimetableWeekday,
} from '../../types'

export type TimetableView =
  | 'weekdays'
  | 'periods'
  | 'classrooms'
  | 'create'
  | 'class'
  | 'teacher'

export interface TimetableNotice {
  type: 'success' | 'error'
  message: string
}

export interface TimetableData {
  weekdays: TimetableWeekday[]
  periods: TimetablePeriod[]
  classrooms: Classroom[]
  entries: TimetableEntry[]
  classes: ClassItem[]
  sections: SectionItem[]
  subjects: Subject[]
  employees: Employee[]
  settings: SchoolSettings
}

export interface TimetableChildProps {
  data: TimetableData
  onNotice: (notice: TimetableNotice | null) => void
  onRefresh: () => Promise<void>
}
