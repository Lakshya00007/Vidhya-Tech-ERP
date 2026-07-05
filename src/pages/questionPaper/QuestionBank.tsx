import { useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import {
  getErrorMessage,
  getQuestionPaperErpApi,
} from '../../lib/erpApi'
import type {
  CreateQuestionInput,
  MasterStatus,
  QuestionBankItem,
  QuestionDifficulty,
  QuestionType,
} from '../../types'
import {
  questionDifficulties,
  questionTypes,
} from './constants'
import type { QuestionPaperChildProps } from './types'

const buildForm = (
  data: QuestionPaperChildProps['data'],
  question?: QuestionBankItem,
): CreateQuestionInput => {
  if (question) {
    return {
      className: question.className,
      subjectId: question.subjectId,
      chapterId: question.chapterId,
      questionType: question.questionType,
      difficulty: question.difficulty,
      questionText: question.questionText,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctAnswer: question.correctAnswer,
      marks: question.marks,
      status: question.status,
    }
  }
  const className =
    data.classes.find((item) => item.status === 'Active')?.name ?? ''
  return {
    className,
    subjectId:
      data.subjects.find(
        (item) => item.status === 'Active' && item.className === className,
      )?.id ?? '',
    chapterId: '',
    questionType: 'Objective',
    difficulty: 'Medium',
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: '',
    marks: 1,
    status: 'Active',
  }
}

export function QuestionBank({
  data,
  onNotice,
  onRefresh,
}: QuestionPaperChildProps) {
  const [editing, setEditing] = useState<QuestionBankItem | null>(null)
  const [form, setForm] = useState<CreateQuestionInput>(() => buildForm(data))
  const [filterClass, setFilterClass] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterChapter, setFilterChapter] = useState('')
  const [filterType, setFilterType] = useState<QuestionType | ''>('')
  const [filterDifficulty, setFilterDifficulty] =
    useState<QuestionDifficulty | ''>('')
  const [isSaving, setIsSaving] = useState(false)

  const subjects = data.subjects.filter(
    (item) =>
      item.className === form.className &&
      (item.status === 'Active' || item.id === form.subjectId),
  )
  const chapters = data.chapters.filter(
    (item) =>
      item.className === form.className &&
      item.subjectId === form.subjectId &&
      (item.status === 'Active' || item.id === form.chapterId),
  )
  const filterSubjects = data.subjects.filter(
    (item) =>
      item.status === 'Active' &&
      (!filterClass || item.className === filterClass),
  )
  const filterChapters = data.chapters.filter(
    (item) =>
      item.status === 'Active' &&
      (!filterClass || item.className === filterClass) &&
      (!filterSubject || item.subjectId === filterSubject),
  )
  const visibleQuestions = useMemo(
    () =>
      data.questions.filter(
        (question) =>
          (!filterClass || question.className === filterClass) &&
          (!filterSubject || question.subjectId === filterSubject) &&
          (!filterChapter || question.chapterId === filterChapter) &&
          (!filterType || question.questionType === filterType) &&
          (!filterDifficulty || question.difficulty === filterDifficulty),
      ),
    [
      data.questions,
      filterChapter,
      filterClass,
      filterDifficulty,
      filterSubject,
      filterType,
    ],
  )

  const reset = () => {
    setEditing(null)
    setForm(buildForm(data))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setIsSaving(true)
      const api = getQuestionPaperErpApi()
      const saved = editing
        ? await api.updateQuestion(editing.id, form)
        : await api.createQuestion(form)
      await onRefresh()
      onNotice({
        type: 'success',
        message: `${saved.questionType} question was ${editing ? 'updated' : 'added to the bank'}.`,
      })
      reset()
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const edit = (question: QuestionBankItem) => {
    setEditing(question)
    setForm(buildForm(data, question))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const remove = async (question: QuestionBankItem) => {
    if (!window.confirm('Delete this question from the active bank?')) return
    try {
      const result = await getQuestionPaperErpApi().deleteQuestion(question.id)
      if (!result.success) throw new Error('Question was not found.')
      if (editing?.id === question.id) reset()
      await onRefresh()
      onNotice({
        type: 'success',
        message: 'The question was removed from the active bank.',
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const columns: TableColumn<QuestionBankItem>[] = [
    {
      key: 'question',
      header: 'Question',
      render: (question) => (
        <div className="question-bank-text">
          <strong>{question.questionText}</strong>
          <span>
            {question.chapterName || 'No chapter'} · {question.subjectName}
          </span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (question) => question.questionType,
    },
    {
      key: 'difficulty',
      header: 'Difficulty',
      render: (question) => (
        <span
          className={`question-difficulty question-difficulty--${question.difficulty.toLowerCase()}`}
        >
          {question.difficulty}
        </span>
      ),
    },
    {
      key: 'marks',
      header: 'Marks',
      render: (question) => question.marks,
    },
    {
      key: 'status',
      header: 'Status',
      render: (question) => (
        <span
          className={`status-badge${
            question.status === 'Active' ? '' : ' status-badge--inactive'
          }`}
        >
          {question.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (question) => (
        <div className="table-actions">
          <button
            className="table-action-button"
            onClick={() => edit(question)}
            type="button"
          >
            <Icon name="edit" size={13} />
            Edit
          </button>
          <button
            className="table-action-button table-action-button--danger"
            onClick={() => void remove(question)}
            type="button"
          >
            <Icon name="trash" size={13} />
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="question-bank-layout">
      <form className="panel question-bank-form" onSubmit={submit}>
        <div className="panel-heading">
          <div>
            <h3>{editing ? 'Edit Question' : 'Add Question'}</h3>
            <p>Create reusable questions for offline paper generation.</p>
          </div>
          {editing && (
            <button className="text-button" onClick={reset} type="button">
              Cancel edit
            </button>
          )}
        </div>
        <div className="question-bank-form-fields">
          <label className="form-field">
            <span>Class</span>
            <select
              onChange={(event) => {
                const className = event.target.value
                setForm((current) => ({
                  ...current,
                  className,
                  subjectId:
                    data.subjects.find(
                      (item) =>
                        item.status === 'Active' &&
                        item.className === className,
                    )?.id ?? '',
                  chapterId: '',
                }))
              }}
              value={form.className}
            >
              {data.classes
                .filter((item) => item.status === 'Active')
                .map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="form-field">
            <span>Subject</span>
            <select
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  subjectId: event.target.value,
                  chapterId: '',
                }))
              }
              required
              value={form.subjectId}
            >
              <option value="">Select subject</option>
              {subjects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Chapter</span>
            <select
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  chapterId: event.target.value,
                }))
              }
              value={form.chapterId}
            >
              <option value="">No chapter</option>
              {chapters.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.chapterNo ? `${item.chapterNo}. ` : ''}
                  {item.chapterName}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Question Type</span>
            <select
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  questionType: event.target.value as QuestionType,
                }))
              }
              value={form.questionType}
            >
              {questionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Difficulty</span>
            <select
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  difficulty: event.target.value as QuestionDifficulty,
                }))
              }
              value={form.difficulty}
            >
              {questionDifficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Marks</span>
            <input
              min="1"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  marks: Number(event.target.value),
                }))
              }
              required
              type="number"
              value={form.marks}
            />
          </label>
          <label className="form-field question-bank-field--full">
            <span>Question Text</span>
            <textarea
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  questionText: event.target.value,
                }))
              }
              placeholder="Enter the complete question"
              required
              rows={4}
              value={form.questionText}
            />
          </label>
          {form.questionType === 'Objective' && (
            <div className="question-options-grid question-bank-field--full">
              {(['A', 'B', 'C', 'D'] as const).map((option) => {
                const key =
                  `option${option}` as keyof Pick<
                    CreateQuestionInput,
                    'optionA' | 'optionB' | 'optionC' | 'optionD'
                  >
                return (
                  <label className="form-field" key={option}>
                    <span>Option {option}</span>
                    <input
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                      required={option === 'A' || option === 'B'}
                      value={form[key]}
                    />
                  </label>
                )
              })}
            </div>
          )}
          <label className="form-field">
            <span>Correct Answer</span>
            <input
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  correctAnswer: event.target.value,
                }))
              }
              placeholder={
                form.questionType === 'Objective'
                  ? 'e.g. A'
                  : 'Model answer where applicable'
              }
              required={[
                'Objective',
                'True/False',
                'Fill in the Blanks',
              ].includes(form.questionType)}
              value={form.correctAnswer}
            />
          </label>
          <label className="form-field">
            <span>Status</span>
            <select
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as MasterStatus,
                }))
              }
              value={form.status}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
        </div>
        <div className="question-paper-form-footer">
          <button
            className="primary-button"
            disabled={isSaving || !form.subjectId}
            type="submit"
          >
            <Icon name={editing ? 'check' : 'plus'} size={16} />
            {isSaving ? 'Saving...' : editing ? 'Update Question' : 'Add Question'}
          </button>
        </div>
      </form>

      <section className="panel question-bank-list">
        <div className="question-bank-filter-bar">
          <div>
            <h3>Question Bank</h3>
            <p>Filter reusable questions without changing stored data.</p>
          </div>
          <div className="question-bank-filter-fields">
            <label className="form-field">
              <span>Class</span>
              <select
                onChange={(event) => {
                  setFilterClass(event.target.value)
                  setFilterSubject('')
                  setFilterChapter('')
                }}
                value={filterClass}
              >
                <option value="">All Classes</option>
                {data.classes.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Subject</span>
              <select
                onChange={(event) => {
                  setFilterSubject(event.target.value)
                  setFilterChapter('')
                }}
                value={filterSubject}
              >
                <option value="">All Subjects</option>
                {filterSubjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Chapter</span>
              <select
                onChange={(event) => setFilterChapter(event.target.value)}
                value={filterChapter}
              >
                <option value="">All Chapters</option>
                {filterChapters.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.chapterName}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Type</span>
              <select
                onChange={(event) =>
                  setFilterType(event.target.value as QuestionType | '')
                }
                value={filterType}
              >
                <option value="">All Types</option>
                {questionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Difficulty</span>
              <select
                onChange={(event) =>
                  setFilterDifficulty(
                    event.target.value as QuestionDifficulty | '',
                  )
                }
                value={filterDifficulty}
              >
                <option value="">All Levels</option>
                {questionDifficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <DataTable
          columns={columns}
          emptyMessage="No questions match the selected filters."
          getRowKey={(question) => question.id}
          rows={visibleQuestions}
        />
      </section>
    </div>
  )
}
