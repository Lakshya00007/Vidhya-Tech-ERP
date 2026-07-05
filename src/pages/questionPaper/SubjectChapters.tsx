import { useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import {
  getErrorMessage,
  getQuestionPaperErpApi,
} from '../../lib/erpApi'
import type {
  CreateSubjectChapterInput,
  MasterStatus,
  SubjectChapter,
} from '../../types'
import type { QuestionPaperChildProps } from './types'

const buildForm = (
  data: QuestionPaperChildProps['data'],
  chapter?: SubjectChapter,
): CreateSubjectChapterInput => {
  if (chapter) {
    return {
      className: chapter.className,
      subjectId: chapter.subjectId,
      chapterName: chapter.chapterName,
      chapterNo: chapter.chapterNo,
      description: chapter.description,
      status: chapter.status,
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
    chapterName: '',
    chapterNo: '',
    description: '',
    status: 'Active',
  }
}

export function SubjectChapters({
  data,
  onNotice,
  onRefresh,
}: QuestionPaperChildProps) {
  const [editing, setEditing] = useState<SubjectChapter | null>(null)
  const [form, setForm] = useState<CreateSubjectChapterInput>(() =>
    buildForm(data),
  )
  const [isSaving, setIsSaving] = useState(false)
  const subjects = data.subjects.filter(
    (item) =>
      item.className === form.className &&
      (item.status === 'Active' || item.id === form.subjectId),
  )
  const visibleChapters = data.chapters.filter(
    (item) =>
      item.className === form.className &&
      (!form.subjectId || item.subjectId === form.subjectId),
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
        ? await api.updateSubjectChapter(editing.id, form)
        : await api.createSubjectChapter(form)
      await onRefresh()
      onNotice({
        type: 'success',
        message: `${saved.chapterName} was ${editing ? 'updated' : 'created'}.`,
      })
      reset()
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const edit = (chapter: SubjectChapter) => {
    setEditing(chapter)
    setForm(buildForm(data, chapter))
  }

  const remove = async (chapter: SubjectChapter) => {
    if (!window.confirm(`Delete chapter "${chapter.chapterName}"?`)) return
    try {
      const result =
        await getQuestionPaperErpApi().deleteSubjectChapter(chapter.id)
      if (!result.success) throw new Error('Subject chapter was not found.')
      if (editing?.id === chapter.id) reset()
      await onRefresh()
      onNotice({
        type: 'success',
        message: `${chapter.chapterName} was removed.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const columns: TableColumn<SubjectChapter>[] = [
    {
      key: 'number',
      header: 'Chapter No.',
      render: (chapter) => chapter.chapterNo || '—',
    },
    {
      key: 'name',
      header: 'Chapter',
      render: (chapter) => (
        <div className="primary-cell">
          <strong>{chapter.chapterName}</strong>
          <span>{chapter.description || 'No description'}</span>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (chapter) => chapter.subjectName,
    },
    {
      key: 'status',
      header: 'Status',
      render: (chapter) => (
        <span
          className={`status-badge${
            chapter.status === 'Active' ? '' : ' status-badge--inactive'
          }`}
        >
          {chapter.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (chapter) => (
        <div className="table-actions">
          <button
            className="table-action-button"
            onClick={() => edit(chapter)}
            type="button"
          >
            <Icon name="edit" size={13} />
            Edit
          </button>
          <button
            className="table-action-button table-action-button--danger"
            onClick={() => void remove(chapter)}
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
    <div className="question-paper-master-layout">
      <form className="panel question-paper-master-form" onSubmit={submit}>
        <div className="panel-heading">
          <div>
            <h3>{editing ? 'Edit Chapter' : 'Add Subject Chapter'}</h3>
            <p>Organize question-bank items by class and subject chapter.</p>
          </div>
          {editing && (
            <button className="text-button" onClick={reset} type="button">
              Cancel edit
            </button>
          )}
        </div>
        <div className="question-paper-form-fields">
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
            <span>Chapter No.</span>
            <input
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  chapterNo: event.target.value,
                }))
              }
              placeholder="e.g. 4"
              value={form.chapterNo}
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
          <label className="form-field">
            <span>Chapter Name</span>
            <input
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  chapterName: event.target.value,
                }))
              }
              placeholder="e.g. Linear Equations"
              required
              value={form.chapterName}
            />
          </label>
          <label className="form-field">
            <span>Description</span>
            <textarea
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Optional chapter scope"
              rows={3}
              value={form.description}
            />
          </label>
        </div>
        <div className="question-paper-form-footer">
          <button
            className="primary-button"
            disabled={isSaving || !form.subjectId}
            type="submit"
          >
            <Icon name={editing ? 'check' : 'plus'} size={16} />
            {isSaving ? 'Saving...' : editing ? 'Update Chapter' : 'Add Chapter'}
          </button>
        </div>
      </form>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Subject Chapters</h3>
            <p>The list follows the class and subject selected in the form.</p>
          </div>
          <span className="record-count">{visibleChapters.length} chapters</span>
        </div>
        <DataTable
          columns={columns}
          emptyMessage="No chapters found for the selected class and subject."
          getRowKey={(chapter) => chapter.id}
          rows={visibleChapters}
        />
      </section>
    </div>
  )
}
