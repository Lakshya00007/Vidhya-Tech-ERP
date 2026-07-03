import { useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import type {
  ClassItem,
  MasterStatus,
  Subject,
} from '../../types'
import type { ExamTabNoticeProps } from './types'

interface SubjectForm {
  name: string
  code: string
  className: string
  maxMarks: string
  passingMarks: string
  status: MasterStatus
}

interface SubjectsTabProps extends ExamTabNoticeProps {
  classes: ClassItem[]
  subjects: Subject[]
  onSubjectsChange: (subjects: Subject[]) => void
}

const createEmptyForm = (className = ''): SubjectForm => ({
  name: '',
  code: '',
  className,
  maxMarks: '100',
  passingMarks: '33',
  status: 'Active',
})

export function SubjectsTab({
  classes,
  subjects,
  onNotice,
  onSubjectsChange,
}: SubjectsTabProps) {
  const activeClasses = useMemo(
    () => classes.filter((item) => item.status === 'Active'),
    [classes],
  )
  const [form, setForm] = useState<SubjectForm>(() =>
    createEmptyForm(
      classes.find((item) => item.status === 'Active')?.name ?? '',
    ),
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const resetForm = () => {
    setEditingId(null)
    setForm(createEmptyForm(activeClasses[0]?.name ?? ''))
  }

  const refreshSubjects = async () => {
    onSubjectsChange(await getErpApi().getSubjects())
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      const input = {
        name: form.name,
        code: form.code,
        className: form.className,
        maxMarks: Number(form.maxMarks),
        passingMarks: Number(form.passingMarks),
        status: form.status,
      }
      if (editingId) {
        await getErpApi().updateSubject(editingId, input)
        onNotice({ type: 'success', message: 'Subject updated successfully.' })
      } else {
        await getErpApi().createSubject(input)
        onNotice({ type: 'success', message: 'Subject added successfully.' })
      }
      await refreshSubjects()
      resetForm()
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (subject: Subject) => {
    if (
      !window.confirm(
        `Delete ${subject.name} for Class ${subject.className}? Existing marks will be retained.`,
      )
    ) {
      return
    }
    try {
      await getErpApi().deleteSubject(subject.id)
      await refreshSubjects()
      if (editingId === subject.id) resetForm()
      onNotice({ type: 'success', message: `${subject.name} was removed.` })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const columns: TableColumn<Subject>[] = [
    {
      key: 'subject',
      header: 'Subject',
      render: (subject) => (
        <div>
          <strong className="table-block">{subject.name}</strong>
          <span className="table-secondary">{subject.code || 'No code'}</span>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class',
      render: (subject) => `Class ${subject.className}`,
    },
    {
      key: 'marks',
      header: 'Maximum / Passing',
      render: (subject) => `${subject.maxMarks} / ${subject.passingMarks}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (subject) => (
        <span
          className={`status-badge status-badge--${subject.status.toLowerCase()}`}
        >
          {subject.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'align-right',
      render: (subject) => (
        <div className="row-action-group">
          <button
            aria-label={`Edit ${subject.name}`}
            className="row-action"
            type="button"
            onClick={() => {
              setEditingId(subject.id)
              setForm({
                name: subject.name,
                code: subject.code,
                className: subject.className,
                maxMarks: String(subject.maxMarks),
                passingMarks: String(subject.passingMarks),
                status: subject.status,
              })
            }}
          >
            <Icon name="edit" size={14} />
          </button>
          <button
            aria-label={`Delete ${subject.name}`}
            className="row-action row-action--danger"
            type="button"
            onClick={() => void handleDelete(subject)}
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <section className="master-page-grid exam-master-grid">
      <form
        className="panel master-form-card"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className="panel-heading">
          <div>
            <h3>{editingId ? 'Edit Subject' : 'Add Subject'}</h3>
            <p>Configure class-wise subjects and marking limits</p>
          </div>
        </div>
        <div className="master-form-fields">
          {activeClasses.length === 0 && (
            <div className="form-note form-note--warning">
              <Icon name="clock" size={17} />
              Create an active class from Settings before adding subjects.
            </div>
          )}
          <div className="form-row">
            <label className="form-field">
              <span>Subject Name</span>
              <input
                placeholder="Example: Mathematics"
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
            </label>
            <label className="form-field">
              <span>Subject Code</span>
              <input
                placeholder="Example: MATH"
                value={form.code}
                onChange={(event) =>
                  setForm({ ...form, code: event.target.value })
                }
              />
            </label>
          </div>
          <label className="form-field">
            <span>Class</span>
            <select
              disabled={activeClasses.length === 0}
              required
              value={form.className}
              onChange={(event) =>
                setForm({ ...form, className: event.target.value })
              }
            >
              {activeClasses.length === 0 && (
                <option value="">No classes available</option>
              )}
              {activeClasses.map((item) => (
                <option key={item.id} value={item.name}>
                  Class {item.name}
                </option>
              ))}
            </select>
          </label>
          <div className="form-row">
            <label className="form-field">
              <span>Maximum Marks</span>
              <input
                min="1"
                required
                type="number"
                value={form.maxMarks}
                onChange={(event) =>
                  setForm({ ...form, maxMarks: event.target.value })
                }
              />
            </label>
            <label className="form-field">
              <span>Passing Marks</span>
              <input
                min="0"
                required
                type="number"
                value={form.passingMarks}
                onChange={(event) =>
                  setForm({ ...form, passingMarks: event.target.value })
                }
              />
            </label>
          </div>
          <label className="form-field">
            <span>Status</span>
            <select
              value={form.status}
              onChange={(event) =>
                setForm({
                  ...form,
                  status: event.target.value as MasterStatus,
                })
              }
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </label>
          <div className="master-form-actions">
            {editingId && (
              <button
                className="secondary-button"
                type="button"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
            <button
              className="primary-button"
              disabled={activeClasses.length === 0 || isSaving}
              type="submit"
            >
              <Icon name={editingId ? 'check' : 'plus'} size={16} />
              {editingId ? 'Update Subject' : 'Add Subject'}
            </button>
          </div>
        </div>
      </form>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Subjects</h3>
            <p>{subjects.length} subjects configured</p>
          </div>
        </div>
        <DataTable
          columns={columns}
          emptyMessage="No subjects configured yet."
          getRowKey={(subject) => subject.id}
          rows={subjects}
        />
      </div>
    </section>
  )
}
