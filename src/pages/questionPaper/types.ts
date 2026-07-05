import type {
  ClassItem,
  QuestionBankItem,
  QuestionPaper,
  SchoolSettings,
  SectionItem,
  Subject,
  SubjectChapter,
} from '../../types'

export type QuestionPaperView = 'chapters' | 'questions' | 'papers'

export interface QuestionPaperNotice {
  type: 'success' | 'error'
  message: string
}

export interface QuestionPaperData {
  classes: ClassItem[]
  sections: SectionItem[]
  subjects: Subject[]
  chapters: SubjectChapter[]
  questions: QuestionBankItem[]
  papers: QuestionPaper[]
  settings: SchoolSettings
}

export interface QuestionPaperChildProps {
  data: QuestionPaperData
  onNotice: (notice: QuestionPaperNotice | null) => void
  onRefresh: () => Promise<void>
}
