import type {
  BehaviourTrait,
  ClassItem,
  SchoolSettings,
  SectionItem,
  SkillTrait,
  Student,
} from '../../types'

export type BehaviourSkillsView =
  | 'behaviours'
  | 'skills'
  | 'observations'
  | 'affective'
  | 'psychomotor'

export interface BehaviourSkillsNotice {
  type: 'success' | 'error'
  message: string
}

export interface BehaviourSkillsData {
  students: Student[]
  classes: ClassItem[]
  sections: SectionItem[]
  behaviourTraits: BehaviourTrait[]
  skillTraits: SkillTrait[]
  settings: SchoolSettings
}

export interface BehaviourSkillsChildProps {
  data: BehaviourSkillsData
  onNotice: (notice: BehaviourSkillsNotice | null) => void
}
