import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import {
  getBehaviourSkillsErpApi,
  getErrorMessage,
} from '../../lib/erpApi'
import {
  formatGeneratedAt,
  formatReportDate,
  getTodayValue,
} from '../../lib/reportUtils'
import type {
  ObservationStatus,
  ObservationType,
  StudentObservation,
} from '../../types'
import type { BehaviourSkillsChildProps } from './types'

const observationTypes: ObservationType[] = [
  'Academic',
  'Behaviour',
  'Discipline',
  'Health',
  'General',
]
const observationStatuses: ObservationStatus[] = [
  'Open',
  'Follow Up',
  'Closed',
]

interface ObservationsProps extends BehaviourSkillsChildProps {
  canDelete: boolean
}

const emptyForm = {
  observationDate: getTodayValue(),
  observationType: 'General' as ObservationType,
  observationText: '',
  actionTaken: '',
  followUpDate: '',
  status: 'Open' as ObservationStatus,
}

export function Observations({
  canDelete,
  data,
  onNotice,
}: ObservationsProps) {
  const activeClasses = data.classes.filter((item) => item.status === 'Active')
  const [className, setClassName] = useState(activeClasses[0]?.name ?? '')
  const [section, setSection] = useState('')
  const [studentId, setStudentId] = useState('')
  const [observations, setObservations] = useState<StudentObservation[]>([])
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const sections = data.sections.filter(
    (item) => item.status === 'Active' && item.className === className,
  )
  const students = useMemo(
    () =>
      data.students.filter(
        (student) =>
          student.status === 'Active' &&
          student.className === className &&
          (!section || student.section === section),
    ),
    [className, data.students, section],
  )
  const effectiveStudentId = students.some(
    (student) => student.id === studentId,
  )
    ? studentId
    : students[0]?.id ?? ''
  const selectedStudent = data.students.find(
    (item) => item.id === effectiveStudentId,
  )
  const schoolContact = [
    data.settings.address,
    data.settings.phone,
    data.settings.email,
  ]
    .filter(Boolean)
    .join(' · ')

  useEffect(() => {
    let current = true
    if (!effectiveStudentId) {
      void Promise.resolve().then(() => {
        if (current) setObservations([])
      })
      return () => {
        current = false
      }
    }
    void Promise.resolve().then(() => {
      if (current) setIsLoading(true)
    })
    void getBehaviourSkillsErpApi()
      .getStudentObservations({ studentId: effectiveStudentId })
      .then((rows) => {
        if (current) setObservations(rows)
      })
      .catch((error: unknown) => {
        if (current) {
          setObservations([])
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (current) setIsLoading(false)
      })
    return () => {
      current = false
    }
  }, [effectiveStudentId, onNotice])

  const resetForm = () => {
    setEditingId('')
    setForm({ ...emptyForm, observationDate: getTodayValue() })
  }

  const refresh = async () => {
    if (!effectiveStudentId) return
    const rows = await getBehaviourSkillsErpApi().getStudentObservations({
      studentId: effectiveStudentId,
    })
    setObservations(rows)
  }

  const saveObservation = async () => {
    if (!effectiveStudentId || !form.observationText.trim()) {
      onNotice({
        type: 'error',
        message: 'Select a student and enter the observation text.',
      })
      return
    }
    setIsSaving(true)
    try {
      const api = getBehaviourSkillsErpApi()
      const input = { studentId: effectiveStudentId, ...form }
      if (editingId) {
        await api.updateStudentObservation(editingId, input)
      } else {
        await api.createStudentObservation(input)
      }
      await refresh()
      const action = editingId ? 'updated' : 'created'
      resetForm()
      onNotice({
        type: 'success',
        message: `Student observation ${action} successfully.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const editObservation = (observation: StudentObservation) => {
    setEditingId(observation.id)
    setForm({
      observationDate: observation.observationDate,
      observationType: observation.observationType,
      observationText: observation.observationText,
      actionTaken: observation.actionTaken,
      followUpDate: observation.followUpDate,
      status: observation.status,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteObservation = async (observation: StudentObservation) => {
    if (!window.confirm('Delete this observation? This action is recorded.')) {
      return
    }
    try {
      const result =
        await getBehaviourSkillsErpApi().deleteStudentObservation(observation.id)
      if (!result.success) throw new Error('Observation was not found.')
      await refresh()
      if (editingId === observation.id) resetForm()
      onNotice({
        type: 'success',
        message: 'Observation deleted. The record was soft-deleted.',
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  if (activeClasses.length === 0) {
    return (
      <section className="panel document-empty-state">
        <Icon name="building" size={28} />
        <h3>Create classes from Settings first.</h3>
      </section>
    )
  }

  return (
    <div className="observation-layout">
      <section className="panel observation-form-panel">
        <div className="panel-heading">
          <div>
            <h3>{editingId ? 'Edit Observation' : 'Add Observation'}</h3>
            <p>Record a factual student observation and any follow-up action.</p>
          </div>
        </div>
        <div className="observation-student-filters">
          <label className="form-field">
            <span>Class</span>
            <select
              onChange={(event) => {
                setClassName(event.target.value)
                setSection('')
                resetForm()
              }}
              value={className}
            >
              {activeClasses.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Section</span>
            <select
              onChange={(event) => {
                setSection(event.target.value)
                resetForm()
              }}
              value={section}
            >
              <option value="">All Sections</option>
              {sections.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field observation-student-field">
            <span>Student</span>
            <select
              onChange={(event) => {
                setStudentId(event.target.value)
                resetForm()
              }}
              value={effectiveStudentId}
            >
              {students.length === 0 && (
                <option value="">No active students</option>
              )}
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.admissionNo} · {student.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="observation-form-grid">
          <label className="form-field">
            <span>Date</span>
            <input
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  observationDate: event.target.value,
                }))
              }
              type="date"
              value={form.observationDate}
            />
          </label>
          <label className="form-field">
            <span>Type</span>
            <select
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  observationType: event.target.value as ObservationType,
                }))
              }
              value={form.observationType}
            >
              {observationTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Status</span>
            <select
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as ObservationStatus,
                }))
              }
              value={form.status}
            >
              {observationStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Follow-up date</span>
            <input
              min={form.observationDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  followUpDate: event.target.value,
                }))
              }
              type="date"
              value={form.followUpDate}
            />
          </label>
          <label className="form-field form-field--full">
            <span>Observation</span>
            <textarea
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  observationText: event.target.value,
                }))
              }
              placeholder="Describe the observation clearly and objectively"
              rows={4}
              value={form.observationText}
            />
          </label>
          <label className="form-field form-field--full">
            <span>Action taken</span>
            <textarea
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  actionTaken: event.target.value,
                }))
              }
              placeholder="Optional action or follow-up note"
              rows={3}
              value={form.actionTaken}
            />
          </label>
        </div>
        <div className="observation-form-actions">
          {editingId && (
            <button
              className="secondary-button"
              onClick={resetForm}
              type="button"
            >
              Cancel
            </button>
          )}
          <button
            className="primary-button"
            disabled={isSaving || !effectiveStudentId}
            onClick={() => void saveObservation()}
            type="button"
          >
            <Icon name="check" size={16} />
            {isSaving
              ? 'Saving...'
              : editingId
                ? 'Update Observation'
                : 'Save Observation'}
          </button>
        </div>
      </section>

      <section className="panel observation-history-panel">
        <div className="observation-history-toolbar">
          <div>
            <h3>Observation History</h3>
            <p>
              {selectedStudent
                ? `${selectedStudent.admissionNo} · ${selectedStudent.name}`
                : 'Select a student to view observations.'}
            </p>
          </div>
          <button
            className="secondary-button"
            disabled={observations.length === 0}
            onClick={() => window.setTimeout(() => window.print(), 50)}
            type="button"
          >
            <Icon name="print" size={16} />
            Print Record
          </button>
        </div>

        <div className="observation-print-area">
          <header className="behaviour-print-header">
            <div>
              <span>Student Observation Record</span>
              <h2>{data.settings.schoolName || 'Vidhya School ERP'}</h2>
              <p>{schoolContact || 'Offline School Management System'}</p>
            </div>
            <div>
              <strong>{selectedStudent?.name || 'Student'}</strong>
              <span>
                {selectedStudent?.admissionNo || '—'} · Class{' '}
                {selectedStudent?.className || '—'}
                {selectedStudent?.section
                  ? ` / ${selectedStudent.section}`
                  : ''}
              </span>
              <small>Generated {formatGeneratedAt()}</small>
            </div>
          </header>
          <div className="table-scroll">
            <table className="data-table observation-history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Observation</th>
                  <th>Action Taken</th>
                  <th>Follow Up</th>
                  <th>Status</th>
                  <th className="observation-screen-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="empty-table" colSpan={7}>
                      Loading observations...
                    </td>
                  </tr>
                ) : observations.length === 0 ? (
                  <tr>
                    <td className="empty-table" colSpan={7}>
                      No observations recorded for this student.
                    </td>
                  </tr>
                ) : (
                  observations.map((observation) => (
                    <tr key={observation.id}>
                      <td>{formatReportDate(observation.observationDate)}</td>
                      <td>{observation.observationType}</td>
                      <td>{observation.observationText}</td>
                      <td>{observation.actionTaken || '—'}</td>
                      <td>
                        {observation.followUpDate
                          ? formatReportDate(observation.followUpDate)
                          : '—'}
                      </td>
                      <td>
                        <span className={`observation-status observation-status--${observation.status.toLowerCase().replace(' ', '-')}`}>
                          {observation.status}
                        </span>
                      </td>
                      <td className="observation-screen-actions">
                        <div className="table-actions">
                          <button
                            aria-label="Edit observation"
                            className="icon-button"
                            onClick={() => editObservation(observation)}
                            type="button"
                          >
                            <Icon name="edit" size={15} />
                          </button>
                          {canDelete && (
                            <button
                              aria-label="Delete observation"
                              className="icon-button icon-button--danger"
                              onClick={() =>
                                void deleteObservation(observation)
                              }
                              type="button"
                            >
                              <Icon name="trash" size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
