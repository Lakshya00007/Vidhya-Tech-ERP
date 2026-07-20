import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import type {
  AcademicSession,
  DiscountMode,
  DiscountType,
  FeeHead,
  MasterStatus,
  Student,
  StudentDiscount,
} from '../../types'

const formatDiscountValue = (mode: DiscountMode, value: number) =>
  mode === 'Percentage'
    ? `${value}%`
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(value)

interface DiscountForm {
  studentId: string
  discountTypeId: string
  discountMode: DiscountMode
  discountValue: string
  feeHeadId: string
  academicSessionId: string
  startDate: string
  endDate: string
  reason: string
  status: MasterStatus
  approvedBy: string
}

const emptyForm: DiscountForm = {
  studentId: '',
  discountTypeId: '',
  discountMode: 'Fixed',
  discountValue: '0',
  feeHeadId: '',
  academicSessionId: '',
  startDate: '',
  endDate: '',
  reason: '',
  status: 'Active',
  approvedBy: '',
}

export function StudentDiscounts() {
  const [students, setStudents] = useState<Student[]>([])
  const [discountTypes, setDiscountTypes] = useState<DiscountType[]>([])
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([])
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [discounts, setDiscounts] = useState<StudentDiscount[]>([])
  const [form, setForm] = useState<DiscountForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const activeDiscountTypes = useMemo(
    () => discountTypes.filter((item) => item.status === 'Active'),
    [discountTypes],
  )
  const activeFeeHeads = useMemo(
    () => feeHeads.filter((item) => item.status === 'Active'),
    [feeHeads],
  )
  const activeSessions = useMemo(
    () => sessions.filter((item) => item.status !== 'Closed'),
    [sessions],
  )

  const refreshDiscounts = async () => {
    setDiscounts(await getErpApi().getStudentDiscounts())
  }

  useEffect(() => {
    let isCurrent = true

    Promise.resolve()
      .then(() =>
        Promise.all([
          getErpApi().getStudents(),
          getErpApi().getDiscountTypes(),
          getErpApi().getFeeHeads(),
          getErpApi().getAcademicSessions(),
          getErpApi().getStudentDiscounts(),
        ]),
      )
      .then(([studentRows, typeRows, headRows, sessionRows, discountRows]) => {
        if (!isCurrent) return

        const firstType = typeRows.find((item) => item.status === 'Active')
        setStudents(studentRows)
        setDiscountTypes(typeRows)
        setFeeHeads(headRows)
        setSessions(sessionRows)
        setDiscounts(discountRows)
        setForm((current) => ({
          ...current,
          studentId: current.studentId || studentRows[0]?.id || '',
          discountTypeId: current.discountTypeId || firstType?.id || '',
          discountMode: current.discountTypeId
            ? current.discountMode
            : firstType?.discountMode || 'Fixed',
          discountValue: current.discountTypeId
            ? current.discountValue
            : String(firstType?.defaultValue ?? 0),
        }))
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setError(getErrorMessage(loadError))
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [])

  const resetForm = () => {
    const firstType = activeDiscountTypes[0]
    setEditingId(null)
    setForm({
      ...emptyForm,
      studentId: students[0]?.id ?? '',
      discountTypeId: firstType?.id ?? '',
      discountMode: firstType?.discountMode ?? 'Fixed',
      discountValue: String(firstType?.defaultValue ?? 0),
    })
  }

  const applyDiscountType = (discountTypeId: string) => {
    const selectedType = discountTypes.find((item) => item.id === discountTypeId)
    setForm({
      ...form,
      discountTypeId,
      discountMode: selectedType?.discountMode ?? form.discountMode,
      discountValue: String(selectedType?.defaultValue ?? 0),
    })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const discountValue = Number(form.discountValue)
    if (
      !Number.isInteger(discountValue) ||
      discountValue < 0 ||
      (form.discountMode === 'Percentage' && discountValue > 100)
    ) {
      setError('Enter a valid discount value.')
      setMessage('')
      return
    }

    setIsSaving(true)
    try {
      const input = {
        studentId: form.studentId,
        discountTypeId: form.discountTypeId,
        discountMode: form.discountMode,
        discountValue,
        feeHeadId: form.feeHeadId,
        academicSessionId: form.academicSessionId,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
        status: form.status,
        approvedBy: form.approvedBy,
      }
      if (editingId) {
        await getErpApi().updateStudentDiscount(editingId, input)
        setMessage('Student discount updated.')
      } else {
        await getErpApi().createStudentDiscount(input)
        setMessage('Student discount assigned.')
      }
      await refreshDiscounts()
      resetForm()
      setError('')
    } catch (saveError) {
      setError(getErrorMessage(saveError))
      setMessage('')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (discount: StudentDiscount) => {
    if (!window.confirm(`Remove ${discount.discountTypeName} for ${discount.studentName}?`)) {
      return
    }
    try {
      await getErpApi().deleteStudentDiscount(discount.id)
      await refreshDiscounts()
      setMessage('Student discount removed.')
      setError('')
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
      setMessage('')
    }
  }

  const columns: TableColumn<StudentDiscount>[] = [
    {
      key: 'student',
      header: 'Student',
      render: (item) => (
        <div>
          <strong className="table-block">{item.studentName}</strong>
          <span className="table-secondary">{item.admissionNo || '-'}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Discount',
      render: (item) => (
        <div>
          <strong className="table-block">{item.discountTypeName}</strong>
          <span className="table-secondary">
            {formatDiscountValue(item.discountMode, item.discountValue)}
          </span>
        </div>
      ),
    },
    {
      key: 'restriction',
      header: 'Restriction',
      render: (item) => item.feeHeadName || 'All fee heads',
    },
    {
      key: 'session',
      header: 'Session',
      render: (item) => item.academicSessionName || 'All sessions',
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span className={`status-badge status-badge--${item.status.toLowerCase()}`}>
          {item.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'align-right',
      render: (item) => (
        <div className="row-action-group">
          <button
            aria-label={`Edit discount for ${item.studentName}`}
            className="row-action"
            onClick={() => {
              setEditingId(item.id)
              setForm({
                studentId: item.studentId,
                discountTypeId: item.discountTypeId,
                discountMode: item.discountMode,
                discountValue: String(item.discountValue),
                feeHeadId: item.feeHeadId,
                academicSessionId: item.academicSessionId,
                startDate: item.startDate,
                endDate: item.endDate,
                reason: item.reason,
                status: item.status,
                approvedBy: item.approvedBy,
              })
            }}
            type="button"
          >
            <Icon name="edit" size={14} />
          </button>
          <button
            aria-label={`Delete discount for ${item.studentName}`}
            className="row-action row-action--danger"
            onClick={() => void handleDelete(item)}
            type="button"
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      ),
    },
  ]

  const canSave = students.length > 0 && activeDiscountTypes.length > 0

  return (
    <section className="page-stack">
      <section className="page-header page-header--compact">
        <div>
          <h2>Student Discounts</h2>
          <p>Assign concessions that are snapshotted into fee invoices</p>
        </div>
      </section>

      {message && (
        <div className="inline-message">
          <Icon name="check" size={17} />
          <span>{message}</span>
          <button type="button" onClick={() => setMessage('')} aria-label="Dismiss message">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="inline-message inline-message--error">
          <Icon name="close" size={17} />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      <section className="master-page-grid master-page-grid--structure">
        <form className="panel master-form-card" onSubmit={(event) => void handleSubmit(event)}>
          <div className="panel-heading">
            <div>
              <h3>{editingId ? 'Edit Discount' : 'Assign Discount'}</h3>
              <p>Restrict by fee head, session or date when needed</p>
            </div>
          </div>
          <div className="master-form-fields">
            {!canSave && !isLoading && (
              <div className="form-note form-note--warning">
                <Icon name="clock" size={17} />
                Add students and active discount types before assigning concessions.
              </div>
            )}
            <label className="form-field">
              <span>Student</span>
              <select
                disabled={students.length === 0}
                required
                value={form.studentId}
                onChange={(event) => setForm({ ...form, studentId: event.target.value })}
              >
                {students.length === 0 && <option value="">No students</option>}
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.admissionNo})
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Discount Type</span>
              <select
                disabled={activeDiscountTypes.length === 0}
                required
                value={form.discountTypeId}
                onChange={(event) => applyDiscountType(event.target.value)}
              >
                {activeDiscountTypes.length === 0 && (
                  <option value="">No discount types</option>
                )}
                {activeDiscountTypes.map((discountType) => (
                  <option key={discountType.id} value={discountType.id}>
                    {discountType.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-row">
              <label className="form-field">
                <span>Mode</span>
                <select
                  value={form.discountMode}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      discountMode: event.target.value as DiscountMode,
                    })
                  }
                >
                  <option>Fixed</option>
                  <option>Percentage</option>
                </select>
              </label>
              <label className="form-field">
                <span>Value</span>
                <input
                  max={form.discountMode === 'Percentage' ? 100 : undefined}
                  min="0"
                  required
                  step="1"
                  type="number"
                  value={form.discountValue}
                  onChange={(event) =>
                    setForm({ ...form, discountValue: event.target.value })
                  }
                />
              </label>
            </div>
            <label className="form-field">
              <span>Fee Head Restriction</span>
              <select
                value={form.feeHeadId}
                onChange={(event) => setForm({ ...form, feeHeadId: event.target.value })}
              >
                <option value="">All fee heads</option>
                {activeFeeHeads.map((feeHead) => (
                  <option key={feeHead.id} value={feeHead.id}>
                    {feeHead.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Academic Session</span>
              <select
                value={form.academicSessionId}
                onChange={(event) =>
                  setForm({ ...form, academicSessionId: event.target.value })
                }
              >
                <option value="">All sessions</option>
                {activeSessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.sessionName}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-row">
              <label className="form-field">
                <span>Start Date</span>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm({ ...form, startDate: event.target.value })
                  }
                />
              </label>
              <label className="form-field">
                <span>End Date</span>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(event) =>
                    setForm({ ...form, endDate: event.target.value })
                  }
                />
              </label>
            </div>
            <label className="form-field">
              <span>Reason</span>
              <textarea
                rows={3}
                value={form.reason}
                onChange={(event) => setForm({ ...form, reason: event.target.value })}
              />
            </label>
            <div className="form-row">
              <label className="form-field">
                <span>Approved By</span>
                <input
                  value={form.approvedBy}
                  onChange={(event) =>
                    setForm({ ...form, approvedBy: event.target.value })
                  }
                />
              </label>
              <label className="form-field">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value as MasterStatus })
                  }
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </label>
            </div>
            <div className="master-form-actions">
              {editingId && (
                <button className="secondary-button" onClick={resetForm} type="button">
                  Cancel
                </button>
              )}
              <button className="primary-button" disabled={!canSave || isSaving} type="submit">
                <Icon name="check" size={17} />
                {isSaving ? 'Saving...' : editingId ? 'Update' : 'Assign'}
              </button>
            </div>
          </div>
        </form>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Assigned Discounts</h3>
              <p>Active assignments are applied during invoice preview</p>
            </div>
          </div>
          <DataTable
            columns={columns}
            getRowKey={(item) => item.id}
            rows={discounts}
            emptyMessage={isLoading ? 'Loading student discounts...' : 'No student discounts assigned.'}
          />
        </section>
      </section>
    </section>
  )
}
