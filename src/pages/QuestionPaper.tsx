import { useCallback, useEffect, useState } from 'react'
import { Icon, type IconName } from '../components/Icon'
import { getErrorMessage, getQuestionPaperErpApi } from '../lib/erpApi'
import type { SchoolSettings } from '../types'
import { QuestionBank } from './questionPaper/QuestionBank'
import { QuestionPaperComposer } from './questionPaper/QuestionPaperComposer'
import { SubjectChapters } from './questionPaper/SubjectChapters'
import type {
  QuestionPaperData,
  QuestionPaperNotice,
  QuestionPaperView,
} from './questionPaper/types'

export type { QuestionPaperView } from './questionPaper/types'

interface QuestionPaperProps {
  initialView?: QuestionPaperView
}

const fallbackSettings: SchoolSettings = {
  id: 'school-profile',
  schoolName: 'Vidhya School ERP',
  address: '',
  phone: '',
  email: '',
  academicYear: '',
  receiptPrefix: '',
  createdAt: '',
  updatedAt: '',
}

const initialData: QuestionPaperData = {
  classes: [],
  sections: [],
  subjects: [],
  chapters: [],
  questions: [],
  papers: [],
  settings: fallbackSettings,
}

const tabs: { id: QuestionPaperView; label: string; icon: IconName }[] = [
  { id: 'chapters', label: 'Subject Chapters', icon: 'exams' },
  { id: 'questions', label: 'Question Bank', icon: 'edit' },
  { id: 'papers', label: 'Create Question Paper', icon: 'reports' },
]

export function QuestionPaper({
  initialView = 'chapters',
}: QuestionPaperProps) {
  const [activeView, setActiveView] =
    useState<QuestionPaperView>(initialView)
  const [data, setData] = useState<QuestionPaperData>(initialData)
  const [notice, setNotice] = useState<QuestionPaperNotice | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    const api = getQuestionPaperErpApi()
    const [chapters, questions, papers] = await Promise.all([
      api.getSubjectChapters(),
      api.getQuestions(),
      api.getQuestionPapers(),
    ])
    setData((current) => ({ ...current, chapters, questions, papers }))
  }, [])

  useEffect(() => {
    let current = true
    Promise.resolve()
      .then(() => {
        const api = getQuestionPaperErpApi()
        return Promise.all([
          api.getClasses(),
          api.getSections(),
          api.getSubjects(),
          api.getSubjectChapters(),
          api.getQuestions(),
          api.getQuestionPapers(),
          api.getSchoolSettings(),
        ])
      })
      .then(
        ([
          classes,
          sections,
          subjects,
          chapters,
          questions,
          papers,
          settings,
        ]) => {
          if (!current) return
          setData({
            classes,
            sections,
            subjects,
            chapters,
            questions,
            papers,
            settings,
          })
        },
      )
      .catch((error: unknown) => {
        if (current) {
          setNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (current) setIsLoading(false)
      })
    return () => {
      current = false
    }
  }, [])

  const childProps = { data, onNotice: setNotice, onRefresh: refresh }

  return (
    <div className="page-stack question-paper-page">
      <section className="page-header">
        <div>
          <h2>Question Paper</h2>
          <p>
            Organize chapters, build a reusable question bank and generate
            printable exam papers.
          </p>
        </div>
      </section>

      <nav
        aria-label="Question paper sections"
        className="settings-tabs question-paper-tabs"
      >
        {tabs.map((tab) => (
          <button
            className={`settings-tab${
              activeView === tab.id ? ' settings-tab--active' : ''
            }`}
            key={tab.id}
            onClick={() => {
              setActiveView(tab.id)
              setNotice(null)
            }}
            type="button"
          >
            <Icon name={tab.icon} size={17} />
            {tab.label}
          </button>
        ))}
      </nav>

      {notice && (
        <div
          className={`inline-message${
            notice.type === 'error' ? ' inline-message--error' : ''
          }`}
        >
          <Icon name={notice.type === 'error' ? 'close' : 'check'} size={17} />
          <span>{notice.message}</span>
          <button
            aria-label="Dismiss message"
            onClick={() => setNotice(null)}
            type="button"
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      {isLoading ? (
        <section className="panel document-empty-state">
          <span className="loading-spinner" />
          <h3>Loading question paper setup...</h3>
        </section>
      ) : (
        <>
          {activeView === 'chapters' && <SubjectChapters {...childProps} />}
          {activeView === 'questions' && <QuestionBank {...childProps} />}
          {activeView === 'papers' && (
            <QuestionPaperComposer {...childProps} />
          )}
        </>
      )}
    </div>
  )
}
