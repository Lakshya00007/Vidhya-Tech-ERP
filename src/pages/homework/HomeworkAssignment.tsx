import { useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getErrorMessage, getHomeworkErpApi } from '../../lib/erpApi'
import { formatReportDate, getTodayValue } from '../../lib/reportUtils'
import type {
  CreateHomeworkInput,
  Homework,
  HomeworkStatus,
} from '../../types'
import type { HomeworkChildProps } from './types'

interface HomeworkAssignmentProps extends HomeworkChildProps {
  editingHomework: Homework | null
  onEdit: (homework: Homework | null) => void
  onRefresh: () => Promise<void>
}

const buildForm = (
  data: HomeworkChildProps['data'],
  homework: Homework | null,
): CreateHomeworkInput => {
  if (homework) {
    return {
      title: homework.title,
      className: homework.className,
      section: homework.section,
      subjectId: homework.subjectId,
      teacherId: homework.teacherId,
      homeworkDate: homework.homeworkDate,
      dueDate: homework.dueDate,
      description: homework.description,
      instructions: homework.instructions,
      status: homework.status,
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
    teacherId:
      data.employees.find((item) => item.status === 'Active')?.id ?? '',
    homeworkDate: getTodayValue(),
    dueDate: getTodayValue(),
    description: '',
    instructions: '',
    status: 'Active',
  }
}

export function HomeworkAssignment({
  data,
  editingHomework,
  onEdit,
  onNotice,
  onRefresh,
}: HomeworkAssignmentProps) {
  const [form, setForm] = useState<CreateHomeworkInput>(() =>
    buildForm(data, editingHomework),
  )
  const [isSaving, setIsSaving] = useState(false)
  const sections = data.sections.filter(
    (item) => item.status === 'Active' && item.className === form.className,
  )
  const subjects = data.subjects.filter(
    (item) =>
      item.className === form.className &&
      (item.status === 'Active' || item.id === form.subjectId),
  )
  const teachers = data.employees.filter(
    (item) => item.status === 'Active' || item.id === form.teacherId,
  )

  const reset = () => {
    onEdit(null)
    setForm(buildForm(data, null))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setIsSaving(true)
      const api = getHomeworkErpApi()
      const saved = editingHomework
        ? await api.updateHomework(editingHomework.id, form)
        : await api.createHomework(form)
      await onRefresh()
      onNotice({
        type: 'success',
        message: editingHomework
          ? `${saved.title} was updated.`
          : `${saved.title} was assigned to ${saved.submissionCount} active student(s).`,
      })
      reset()
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const remove = async (homework: Homework) => {
    if (
      !window.confirm(
        `Delete "${homework.title}"? Submission history will remain stored locally.`,
      )
    ) {
      return
    }
    try {
      const result = await getHomeworkErpApi().deleteHomework(homework.id)
      if (!result.success) throw new Error('Homework record was not found.')
      if (editingHomework?.id === homework.id) reset()
      await onRefresh()
      onNotice({
        type: 'success',
        message: `${homework.title} was removed from active homework.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const columns: TableColumn<Homework>[] = [
    {
      key: 'title',
      header: 'Homework',
      render: (item) => (
        <div className="primary-cell">
          <strong>{item.title}</strong>
          <span>{item.subjectName}</span>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class / Section',
      render: (item) =>
        `${item.className} / ${item.section || 'All Sections'}`,
    },
    {
      key: 'teacher',
      header: 'Teacher',
      render: (item) => item.teacherName,
    },
    {
      key: 'dates',
      header: 'Assigned / Due',
      render: (item) => (
        <div className="primary-cell">
          <strong>{formatReportDate(item.homeworkDate)}</strong>
          <span>
            {item.dueDate
              ? `Due ${formatReportDate(item.dueDate)}`
              : 'No due date'}
          </span>
        </div>
      ),
    },
    {
      key: 'students',
      header: 'Students',
      render: (item) => item.submissionCount,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span
          className={`status-badge${
            item.status === 'Active' ? '' : ' status-badge--inactive'
          }`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="table-actions">
          <button
            className="table-action-button"
            onClick={() => {
              onEdit(item)
              setForm(buildForm(data, item))
            }}
            type="button"
          >
            <Icon name="edit" size={13} />
            Edit
          </button>
          <button
            className="table-action-button table-action-button--danger"
            onClick={() => void remove(item)}
            type="button"
          >
            <Icon name="trash" size={13} />
            Delete
          </button>
        </div>
      ),
    },
  ]

  if (!data.classes.some((item) => item.status === 'Active')) {
    return (
      <section className="panel document-empty-state">
        <Icon name="building" size={26} />
        <h3>Create classes from Settings first.</h3>
      </section>
    )
  }

  return (
    <div className="homework-assignment-layout">
      <form className="panel homework-form" onSubmit={submit}>
        <div className="panel-heading">
          <div>
            <h3>{editingHomework ? 'Edit Homework' : 'Assign Homework'}</h3>
            <p>
              Saving creates pending rows for matching active students.
            </p>
          </div>
          {editingHomework && (
            <button className="text-button" onClick={reset} type="button">
              Cancel edit
            </button>
          )}
        </div>
        <div className="homework-form-fields">
          <label className="form-field homework-field--full">
            <span>Homework Title</span>
            <input
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="e.g. Algebra practice exercise"
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
              }}
              required
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
              {sections.map((item) => (
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
                  {item.code ? ` (${item.code})` : ''}
                </option>
              ))}
            </select>
            {subjects.length === 0 && (
              <small>Create subjects for this class first.</small>
            )}
          </label>
          <label className="form-field">
            <span>Teacher</span>
            <select
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  teacherId: event.target.value,
                }))
              }
              required
              value={form.teacherId}
            >
              <option value="">Select teacher</option>
              {teachers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.designation ? ` · ${item.designation}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Homework Date</span>
            <input
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  homeworkDate: event.target.value,
                }))
              }
              required
              type="date"
              value={form.homeworkDate}
            />
          </label>
          <label className="form-field">
            <span>Due Date</span>
            <input
              min={form.homeworkDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dueDate: event.target.value,
                }))
              }
              type="date"
              value={form.dueDate}
            />
          </label>
          <label className="form-field">
            <span>Status</span>
            <select
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as HomeworkStatus,
                }))
              }
              value={form.status}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
          <label className="form-field homework-field--full">
            <span>Description</span>
            <textarea
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Describe the work students should complete"
              rows={4}
              value={form.description}
            />
          </label>
          <label className="form-field homework-field--full">
            <span>Instructions</span>
            <textarea
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  instructions: event.target.value,
                }))
              }
              placeholder="Optional submission or presentation instructions"
              rows={3}
              value={form.instructions}
            />
          </label>
        </div>
        <div className="homework-form-footer">
          <button
            className="primary-button"
            disabled={
              isSaving ||
              !form.subjectId ||
              !form.teacherId ||
              subjects.length === 0
            }
            type="submit"
          >
            <Icon name={editingHomework ? 'check' : 'plus'} size={16} />
            {isSaving
              ? 'Saving...'
              : editingHomework
                ? 'Update Homework'
                : 'Assign Homework'}
          </button>
        </div>
      </form>

      <section className="panel homework-list-panel">
        <div className="panel-heading">
          <div>
            <h3>Assigned Homework</h3>
            <p>Edit assignment details or soft-delete an assignment.</p>
          </div>
          <span className="record-count">
            {data.homework.length} assignments
          </span>
        </div>
        <DataTable
          columns={columns}
          emptyMessage="No homework has been assigned."
          getRowKey={(item) => item.id}
          rows={data.homework}
        />
      </section>
    </div>
  )
}
