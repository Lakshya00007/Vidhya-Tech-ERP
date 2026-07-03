import { useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import { formatReportDate, getTodayValue } from '../../lib/reportUtils'
import type {
  ClassItem,
  Exam,
  MasterStatus,
  SchoolSettings,
  SectionItem,
} from '../../types'
import type { ExamTabNoticeProps } from './types'

interface ExamForm {
  name: string
  className: string
  section: string
  academicYear: string
  examDate: string
  status: MasterStatus
}

interface ExamsSetupTabProps extends ExamTabNoticeProps {
  classes: ClassItem[]
  sections: SectionItem[]
  exams: Exam[]
  settings: SchoolSettings
  onExamsChange: (exams: Exam[]) => void
}

const createEmptyForm = (
  className = '',
  academicYear = '',
): ExamForm => ({
  name: '',
  className,
  section: '',
  academicYear,
  examDate: getTodayValue(),
  status: 'Active',
})

export function ExamsSetupTab({
  classes,
  sections,
  exams,
  settings,
  onNotice,
  onExamsChange,
}: ExamsSetupTabProps) {
  const activeClasses = useMemo(
    () => classes.filter((item) => item.status === 'Active'),
    [classes],
  )
  const [form, setForm] = useState<ExamForm>(() =>
    createEmptyForm(
      classes.find((item) => item.status === 'Active')?.name ?? '',
      settings.academicYear,
    ),
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const availableSections = useMemo(
    () =>
      sections.filter(
        (item) =>
          item.status === 'Active' && item.className === form.className,
      ),
    [form.className, sections],
  )

  const resetForm = () => {
    setEditingId(null)
    setForm(
      createEmptyForm(activeClasses[0]?.name ?? '', settings.academicYear),
    )
  }

  const refreshExams = async () => {
    onExamsChange(await getErpApi().getExams())
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      if (editingId) {
        await getErpApi().updateExam(editingId, form)
        onNotice({ type: 'success', message: 'Exam updated successfully.' })
      } else {
        await getErpApi().createExam(form)
        onNotice({ type: 'success', message: 'Exam created successfully.' })
      }
      await refreshExams()
      resetForm()
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (exam: Exam) => {
    if (
      !window.confirm(
        `Delete "${exam.name}" for Class ${exam.className}? Existing marks will be retained.`,
      )
    ) {
      return
    }
    try {
      await getErpApi().deleteExam(exam.id)
      await refreshExams()
      if (editingId === exam.id) resetForm()
      onNotice({ type: 'success', message: `${exam.name} was removed.` })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const columns: TableColumn<Exam>[] = [
    {
      key: 'exam',
      header: 'Exam',
      render: (exam) => (
        <div>
          <strong className="table-block">{exam.name}</strong>
          <span className="table-secondary">
            {exam.academicYear || 'Academic year not set'}
          </span>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class / Section',
      render: (exam) =>
        `Class ${exam.className}${exam.section ? `-${exam.section}` : ' · All sections'}`,
    },
    {
      key: 'date',
      header: 'Exam Date',
      render: (exam) => formatReportDate(exam.examDate),
    },
    {
      key: 'status',
      header: 'Status',
      render: (exam) => (
        <span
          className={`status-badge status-badge--${exam.status.toLowerCase()}`}
        >
          {exam.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'align-right',
      render: (exam) => (
        <div className="row-action-group">
          <button
            aria-label={`Edit ${exam.name}`}
            className="row-action"
            type="button"
            onClick={() => {
              setEditingId(exam.id)
              setForm({
                name: exam.name,
                className: exam.className,
                section: exam.section,
                academicYear: exam.academicYear,
                examDate: exam.examDate,
                status: exam.status,
              })
            }}
          >
            <Icon name="edit" size={14} />
          </button>
          <button
            aria-label={`Delete ${exam.name}`}
            className="row-action row-action--danger"
            type="button"
            onClick={() => void handleDelete(exam)}
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
            <h3>{editingId ? 'Edit Exam' : 'Create Exam'}</h3>
            <p>Schedule a class or section examination</p>
          </div>
        </div>
        <div className="master-form-fields">
          {activeClasses.length === 0 && (
            <div className="form-note form-note--warning">
              <Icon name="clock" size={17} />
              Create an active class from Settings before creating an exam.
            </div>
          )}
          <label className="form-field">
            <span>Exam Name</span>
            <input
              placeholder="Example: Mid-Term Examination"
              required
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
          </label>
          <div className="form-row">
            <label className="form-field">
              <span>Class</span>
              <select
                disabled={activeClasses.length === 0}
                required
                value={form.className}
                onChange={(event) =>
                  setForm({
                    ...form,
                    className: event.target.value,
                    section: '',
                  })
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
            <label className="form-field">
              <span>Section</span>
              <select
                disabled={availableSections.length === 0}
                value={form.section}
                onChange={(event) =>
                  setForm({ ...form, section: event.target.value })
                }
              >
                <option value="">All sections</option>
                {availableSections.map((item) => (
                  <option key={item.id} value={item.name}>
                    Section {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label className="form-field">
              <span>Academic Year</span>
              <input
                placeholder="Example: 2026–2027"
                value={form.academicYear}
                onChange={(event) =>
                  setForm({ ...form, academicYear: event.target.value })
                }
              />
            </label>
            <label className="form-field">
              <span>Exam Date</span>
              <input
                required
                type="date"
                value={form.examDate}
                onChange={(event) =>
                  setForm({ ...form, examDate: event.target.value })
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
              {editingId ? 'Update Exam' : 'Create Exam'}
            </button>
          </div>
        </div>
      </form>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Exams</h3>
            <p>{exams.length} examinations configured</p>
          </div>
        </div>
        <DataTable
          columns={columns}
          emptyMessage="No examinations configured yet."
          getRowKey={(exam) => exam.id}
          rows={exams}
        />
      </div>
    </section>
  )
}
