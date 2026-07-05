import { useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import {
  getErrorMessage,
  getQuestionPaperErpApi,
} from '../../lib/erpApi'
import { exportCsv, formatGeneratedAt } from '../../lib/reportUtils'
import type {
  CreateQuestionPaperInput,
  QuestionBankItem,
  QuestionDifficulty,
  QuestionPaper,
  QuestionPaperItem,
  QuestionType,
} from '../../types'
import {
  questionDifficulties,
  questionTypes,
} from './constants'
import type { QuestionPaperChildProps } from './types'

interface SelectedQuestion {
  questionId: string
  sectionTitle: string
}

const sections = ['Section A', 'Section B', 'Section C']

const buildPaperForm = (
  data: QuestionPaperChildProps['data'],
  paper?: QuestionPaper,
): Omit<CreateQuestionPaperInput, 'items'> => {
  if (paper) {
    return {
      title: paper.title,
      className: paper.className,
      section: paper.section,
      subjectId: paper.subjectId,
      examName: paper.examName,
      durationMinutes: paper.durationMinutes,
      instructions: paper.instructions,
    }
  }
  const className =
    data.classes.find((item) => item.status === 'Active')?.name ?? ''
  return {
    title: '',
    className,
    section: '',
    subjectId:
      data.subjects.find(
        (item) => item.status === 'Active' && item.className === className,
      )?.id ?? '',
    examName: '',
    durationMinutes: 60,
    instructions:
      'Answer all questions. Write clearly and show working where required.',
  }
}

const optionsForItem = (item: QuestionPaperItem) =>
  [
    ['A', item.optionA],
    ['B', item.optionB],
    ['C', item.optionC],
    ['D', item.optionD],
  ].filter((option) => option[1])

export function QuestionPaperComposer({
  data,
  onNotice,
  onRefresh,
}: QuestionPaperChildProps) {
  const [editingPaper, setEditingPaper] = useState<QuestionPaper | null>(null)
  const [previewPaper, setPreviewPaper] = useState<QuestionPaper | null>(null)
  const [form, setForm] = useState(() => buildPaperForm(data))
  const [selected, setSelected] = useState<SelectedQuestion[]>([])
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
  const classSections = data.sections.filter(
    (item) => item.status === 'Active' && item.className === form.className,
  )
  const chapters = data.chapters.filter(
    (item) =>
      item.status === 'Active' &&
      item.className === form.className &&
      item.subjectId === form.subjectId,
  )
  const availableQuestions = data.questions.filter(
    (question) =>
      question.status === 'Active' &&
      question.className === form.className &&
      question.subjectId === form.subjectId &&
      (!filterChapter || question.chapterId === filterChapter) &&
      (!filterType || question.questionType === filterType) &&
      (!filterDifficulty || question.difficulty === filterDifficulty),
  )
  const selectedQuestions = selected
    .map((item) => ({
      selection: item,
      question: data.questions.find(
        (question) => question.id === item.questionId,
      ),
    }))
    .filter(
      (
        item,
      ): item is {
        selection: SelectedQuestion
        question: QuestionBankItem
      } => Boolean(item.question),
    )
  const totalMarks = selectedQuestions.reduce(
    (total, item) => total + item.question.marks,
    0,
  )

  const reset = () => {
    setEditingPaper(null)
    setForm(buildPaperForm(data))
    setSelected([])
    setFilterChapter('')
    setFilterType('')
    setFilterDifficulty('')
  }

  const toggleQuestion = (questionId: string) => {
    setSelected((current) =>
      current.some((item) => item.questionId === questionId)
        ? current.filter((item) => item.questionId !== questionId)
        : [...current, { questionId, sectionTitle: 'Section A' }],
    )
  }

  const moveQuestion = (index: number, direction: -1 | 1) => {
    setSelected((current) => {
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= current.length) return current
      const next = [...current]
      ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
      return next
    })
  }

  const setQuestionSection = (questionId: string, sectionTitle: string) => {
    setSelected((current) =>
      current.map((item) =>
        item.questionId === questionId ? { ...item, sectionTitle } : item,
      ),
    )
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (selectedQuestions.length === 0) {
      onNotice({
        type: 'error',
        message: 'Select at least one active question for the paper.',
      })
      return
    }
    try {
      setIsSaving(true)
      const input: CreateQuestionPaperInput = {
        ...form,
        items: selectedQuestions.map((item, index) => ({
          questionId: item.question.id,
          sectionTitle: item.selection.sectionTitle,
          displayOrder: index + 1,
        })),
      }
      const api = getQuestionPaperErpApi()
      const saved = editingPaper
        ? await api.updateQuestionPaper(editingPaper.id, input)
        : await api.createQuestionPaper(input)
      await onRefresh()
      setPreviewPaper(saved)
      onNotice({
        type: 'success',
        message: `${saved.paperNo} was ${editingPaper ? 'updated' : 'created'} with ${saved.itemCount} question(s) and ${saved.totalMarks} marks.`,
      })
      reset()
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const viewPaper = async (paper: QuestionPaper, print = false) => {
    try {
      const fullPaper =
        await getQuestionPaperErpApi().getQuestionPaperById(paper.id)
      if (!fullPaper) throw new Error('Question paper was not found.')
      setPreviewPaper(fullPaper)
      if (print) window.setTimeout(() => window.print(), 80)
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const editPaper = async (paper: QuestionPaper) => {
    try {
      const fullPaper =
        await getQuestionPaperErpApi().getQuestionPaperById(paper.id)
      if (!fullPaper) throw new Error('Question paper was not found.')
      setEditingPaper(fullPaper)
      setForm(buildPaperForm(data, fullPaper))
      setSelected(
        fullPaper.items.map((item) => ({
          questionId: item.questionId,
          sectionTitle: item.sectionTitle,
        })),
      )
      setPreviewPaper(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const deletePaper = async (paper: QuestionPaper) => {
    if (!window.confirm(`Delete ${paper.paperNo}, "${paper.title}"?`)) return
    try {
      const result =
        await getQuestionPaperErpApi().deleteQuestionPaper(paper.id)
      if (!result.success) throw new Error('Question paper was not found.')
      if (editingPaper?.id === paper.id) reset()
      if (previewPaper?.id === paper.id) setPreviewPaper(null)
      await onRefresh()
      onNotice({
        type: 'success',
        message: `${paper.paperNo} was removed.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const exportPaper = async (paper: QuestionPaper) => {
    try {
      const fullPaper =
        await getQuestionPaperErpApi().getQuestionPaperById(paper.id)
      if (!fullPaper) throw new Error('Question paper was not found.')
      exportCsv(
        `${fullPaper.paperNo.toLowerCase()}-question-paper.csv`,
        ['Order', 'Section', 'Question Type', 'Question', 'Marks'],
        fullPaper.items.map((item) => [
          item.displayOrder,
          item.sectionTitle,
          item.questionType,
          item.questionText,
          item.marks,
        ]),
      )
      onNotice({
        type: 'success',
        message: `${fullPaper.paperNo} was exported.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const columns: TableColumn<QuestionPaper>[] = [
    {
      key: 'number',
      header: 'Paper No.',
      render: (paper) => (
        <strong className="receipt-number">{paper.paperNo}</strong>
      ),
    },
    {
      key: 'title',
      header: 'Paper',
      render: (paper) => (
        <div className="primary-cell">
          <strong>{paper.title}</strong>
          <span>
            {paper.subjectName} · Class {paper.className}
            {paper.section ? `-${paper.section}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'exam',
      header: 'Exam',
      render: (paper) => paper.examName || '—',
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (paper) =>
        paper.durationMinutes ? `${paper.durationMinutes} min` : '—',
    },
    {
      key: 'marks',
      header: 'Questions / Marks',
      render: (paper) => `${paper.itemCount} / ${paper.totalMarks}`,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (paper) => (
        <div className="table-actions">
          <button
            className="table-action-button"
            onClick={() => void viewPaper(paper)}
            type="button"
          >
            View
          </button>
          <button
            className="table-action-button"
            onClick={() => void viewPaper(paper, true)}
            type="button"
          >
            <Icon name="print" size={13} />
            Print
          </button>
          <button
            className="table-action-button"
            onClick={() => void exportPaper(paper)}
            type="button"
          >
            <Icon name="download" size={13} />
            CSV
          </button>
          <button
            className="table-action-button"
            onClick={() => void editPaper(paper)}
            type="button"
          >
            Edit
          </button>
          <button
            className="table-action-button table-action-button--danger"
            onClick={() => void deletePaper(paper)}
            type="button"
          >
            <Icon name="trash" size={13} />
            Delete
          </button>
        </div>
      ),
    },
  ]

  const groupedItems = useMemo(() => {
    if (!previewPaper) return []
    return sections
      .map((sectionTitle) => ({
        sectionTitle,
        items: previewPaper.items.filter(
          (item) => item.sectionTitle === sectionTitle,
        ),
      }))
      .filter((group) => group.items.length > 0)
  }, [previewPaper])

  return (
    <div className="question-paper-composer-stack">
      <form className="panel paper-composer-form" onSubmit={submit}>
        <div className="panel-heading">
          <div>
            <h3>{editingPaper ? 'Edit Question Paper' : 'Create Question Paper'}</h3>
            <p>Select bank questions, order them and assign paper sections.</p>
          </div>
          <div className="paper-total-badge">
            <span>{selected.length} questions</span>
            <strong>{totalMarks} marks</strong>
          </div>
        </div>
        <div className="paper-metadata-grid">
          <label className="form-field paper-field--wide">
            <span>Paper Title</span>
            <input
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="e.g. Mid-Term Mathematics Question Paper"
              required
              value={form.title}
            />
          </label>
          <label className="form-field">
            <span>Class</span>
            <select
              onChange={(event) => {
                const className = event.target.value
                setForm((current) => ({
                  ...current,
                  className,
                  section: '',
                  subjectId:
                    data.subjects.find(
                      (item) =>
                        item.status === 'Active' &&
                        item.className === className,
                    )?.id ?? '',
                }))
                setSelected([])
                setFilterChapter('')
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
            <span>Section</span>
            <select
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  section: event.target.value,
                }))
              }
              value={form.section}
            >
              <option value="">All Sections</option>
              {classSections.map((item) => (
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
                setForm((current) => ({
                  ...current,
                  subjectId: event.target.value,
                }))
                setSelected([])
                setFilterChapter('')
              }}
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
            <span>Exam Name</span>
            <input
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  examName: event.target.value,
                }))
              }
              placeholder="e.g. Mid-Term Exam"
              value={form.examName}
            />
          </label>
          <label className="form-field">
            <span>Duration (minutes)</span>
            <input
              min="0"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  durationMinutes: Number(event.target.value),
                }))
              }
              type="number"
              value={form.durationMinutes}
            />
          </label>
          <label className="form-field paper-field--instructions">
            <span>Instructions</span>
            <textarea
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  instructions: event.target.value,
                }))
              }
              rows={2}
              value={form.instructions}
            />
          </label>
        </div>

        <div className="paper-builder-grid">
          <section className="paper-question-picker">
            <div className="paper-builder-heading">
              <div>
                <h4>Question Bank</h4>
                <p>Select questions for this paper.</p>
              </div>
              <div className="paper-bank-filters">
                <select
                  aria-label="Filter questions by chapter"
                  onChange={(event) => setFilterChapter(event.target.value)}
                  value={filterChapter}
                >
                  <option value="">All Chapters</option>
                  {chapters.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.chapterName}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filter questions by type"
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
                <select
                  aria-label="Filter questions by difficulty"
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
              </div>
            </div>
            <div className="paper-question-list">
              {availableQuestions.length > 0 ? (
                availableQuestions.map((question) => (
                  <label className="paper-question-option" key={question.id}>
                    <input
                      checked={selected.some(
                        (item) => item.questionId === question.id,
                      )}
                      onChange={() => toggleQuestion(question.id)}
                      type="checkbox"
                    />
                    <div>
                      <strong>{question.questionText}</strong>
                      <span>
                        {question.questionType} · {question.difficulty} ·{' '}
                        {question.marks} mark{question.marks === 1 ? '' : 's'}
                      </span>
                    </div>
                  </label>
                ))
              ) : (
                <div className="paper-builder-empty">
                  No active questions match these filters.
                </div>
              )}
            </div>
          </section>

          <section className="paper-selected-questions">
            <div className="paper-builder-heading">
              <div>
                <h4>Paper Order</h4>
                <p>Assign sections and arrange questions.</p>
              </div>
            </div>
            <div className="paper-selected-list">
              {selectedQuestions.length > 0 ? (
                selectedQuestions.map((item, index) => (
                  <article className="paper-selected-item" key={item.question.id}>
                    <span className="paper-question-number">{index + 1}</span>
                    <div className="paper-selected-content">
                      <strong>{item.question.questionText}</strong>
                      <small>
                        {item.question.questionType} · {item.question.marks}{' '}
                        marks
                      </small>
                      <select
                        aria-label={`Section for question ${index + 1}`}
                        onChange={(event) =>
                          setQuestionSection(
                            item.question.id,
                            event.target.value,
                          )
                        }
                        value={item.selection.sectionTitle}
                      >
                        {sections.map((sectionTitle) => (
                          <option key={sectionTitle} value={sectionTitle}>
                            {sectionTitle}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="paper-order-actions">
                      <button
                        aria-label="Move question up"
                        disabled={index === 0}
                        onClick={() => moveQuestion(index, -1)}
                        type="button"
                      >
                        ↑
                      </button>
                      <button
                        aria-label="Move question down"
                        disabled={index === selectedQuestions.length - 1}
                        onClick={() => moveQuestion(index, 1)}
                        type="button"
                      >
                        ↓
                      </button>
                      <button
                        aria-label="Remove question"
                        onClick={() => toggleQuestion(item.question.id)}
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="paper-builder-empty">
                  Select questions from the bank.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="paper-composer-footer">
          {editingPaper && (
            <button className="secondary-button" onClick={reset} type="button">
              Cancel edit
            </button>
          )}
          <button
            className="primary-button"
            disabled={
              isSaving ||
              !form.subjectId ||
              selectedQuestions.length === 0
            }
            type="submit"
          >
            <Icon name={editingPaper ? 'check' : 'plus'} size={16} />
            {isSaving
              ? 'Saving...'
              : editingPaper
                ? 'Update Question Paper'
                : 'Save Question Paper'}
          </button>
        </div>
      </form>

      <section className="panel saved-paper-list">
        <div className="panel-heading">
          <div>
            <h3>Saved Question Papers</h3>
            <p>View, print, export or revise locally saved papers.</p>
          </div>
          <span className="record-count">{data.papers.length} papers</span>
        </div>
        <DataTable
          columns={columns}
          emptyMessage="No question papers have been created."
          getRowKey={(paper) => paper.id}
          rows={data.papers}
        />
      </section>

      {previewPaper && (
        <section className="panel paper-preview-shell">
          <div className="paper-preview-toolbar">
            <div>
              <h3>Question Paper Preview</h3>
              <p>{previewPaper.paperNo}</p>
            </div>
            <div>
              <button
                className="secondary-button"
                onClick={() => setPreviewPaper(null)}
                type="button"
              >
                Close Preview
              </button>
              <button
                className="primary-button"
                onClick={() => window.setTimeout(() => window.print(), 50)}
                type="button"
              >
                <Icon name="print" size={15} />
                Print Question Paper
              </button>
            </div>
          </div>
          <article className="question-paper-print-area">
            <header className="question-paper-print-header">
              <div>
                <h1>
                  {data.settings.schoolName || 'Vidhya School ERP'}
                </h1>
                <p>{data.settings.address}</p>
                <span>
                  {[data.settings.phone, data.settings.email]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
              <small>{previewPaper.paperNo}</small>
            </header>
            <div className="question-paper-title">
              <h2>{previewPaper.title}</h2>
              {previewPaper.examName && <p>{previewPaper.examName}</p>}
            </div>
            <section className="question-paper-meta">
              <span>
                <strong>Class:</strong> {previewPaper.className}
                {previewPaper.section ? `-${previewPaper.section}` : ''}
              </span>
              <span>
                <strong>Subject:</strong> {previewPaper.subjectName}
              </span>
              <span>
                <strong>Duration:</strong>{' '}
                {previewPaper.durationMinutes
                  ? `${previewPaper.durationMinutes} minutes`
                  : '—'}
              </span>
              <span>
                <strong>Maximum Marks:</strong> {previewPaper.totalMarks}
              </span>
            </section>
            {previewPaper.instructions && (
              <section className="question-paper-instructions">
                <strong>Instructions</strong>
                <p>{previewPaper.instructions}</p>
              </section>
            )}
            <div className="question-paper-sections">
              {groupedItems.map((group) => (
                <section key={group.sectionTitle}>
                  <h3>{group.sectionTitle}</h3>
                  {group.items.map((item) => (
                    <article className="printed-question" key={item.id}>
                      <div>
                        <span>{item.displayOrder}.</span>
                        <div>
                          <p>{item.questionText}</p>
                          {optionsForItem(item).length > 0 && (
                            <div className="printed-question-options">
                              {optionsForItem(item).map(([label, value]) => (
                                <span key={label}>
                                  ({label}) {value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <strong>[{item.marks}]</strong>
                    </article>
                  ))}
                </section>
              ))}
            </div>
            <footer className="question-paper-footer">
              <span>Prepared by: {previewPaper.createdBy || 'Teacher'}</span>
              <span>Examiner Signature</span>
            </footer>
            <small className="question-paper-generated">
              Generated {formatGeneratedAt()}
            </small>
          </article>
        </section>
      )}
    </div>
  )
}
