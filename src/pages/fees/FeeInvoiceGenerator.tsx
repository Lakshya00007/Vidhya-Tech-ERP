import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import type {
  AcademicSession,
  BillingPeriod,
  FeeInvoice,
  FeeInvoicePreview,
  FeeInvoicePreviewItem,
  Student,
} from '../../types'

const billingPeriods: BillingPeriod[] = [
  'Monthly',
  'Quarterly',
  'Term',
  'Annual',
  'Custom',
]

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

const getTodayValue = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface FeeInvoiceGeneratorProps {
  onCreated: (invoice: FeeInvoice) => void
}

export function FeeInvoiceGenerator({ onCreated }: FeeInvoiceGeneratorProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [studentId, setStudentId] = useState('')
  const [academicSessionId, setAcademicSessionId] = useState('')
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('Monthly')
  const [invoiceDate, setInvoiceDate] = useState(getTodayValue)
  const [dueDate, setDueDate] = useState('')
  const [includePreviousDue, setIncludePreviousDue] = useState(true)
  const [lateFee, setLateFee] = useState('0')
  const [adjustmentAmount, setAdjustmentAmount] = useState('0')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [notes, setNotes] = useState('')
  const [allowDuplicate, setAllowDuplicate] = useState(false)
  const [preview, setPreview] = useState<FeeInvoicePreview | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    let isCurrent = true

    Promise.resolve()
      .then(() =>
        Promise.all([
          getErpApi().getStudents(),
          getErpApi().getAcademicSessions(),
          getErpApi().getCurrentAcademicSession(),
        ]),
      )
      .then(([studentRows, sessionRows, currentSession]) => {
        if (!isCurrent) return

        setStudents(studentRows)
        setSessions(sessionRows)
        setStudentId(studentRows[0]?.id ?? '')
        setAcademicSessionId(currentSession?.id ?? sessionRows[0]?.id ?? '')
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

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === studentId),
    [studentId, students],
  )

  const previewColumns: TableColumn<FeeInvoicePreviewItem>[] = [
    { key: 'head', header: 'Fee Head', render: (item) => item.feeHeadName },
    {
      key: 'gross',
      header: 'Gross',
      className: 'align-right',
      render: (item) => formatCurrency(item.grossAmount),
    },
    {
      key: 'discount',
      header: 'Discount',
      className: 'align-right',
      render: (item) => formatCurrency(item.discountAmount),
    },
    {
      key: 'net',
      header: 'Net',
      className: 'align-right',
      render: (item) => <strong>{formatCurrency(item.netAmount)}</strong>,
    },
  ]

  const buildInput = () => ({
    studentId,
    academicSessionId,
    billingPeriod,
    invoiceDate,
    dueDate,
    includePreviousDue,
    lateFee: Number(lateFee || 0),
    adjustmentAmount: Number(adjustmentAmount || 0),
    adjustmentReason,
    notes,
  })

  const handlePreview = async (event?: FormEvent) => {
    event?.preventDefault()
    setIsPreviewing(true)
    setMessage('')
    try {
      const nextPreview = await getErpApi().getFeeInvoicePreview(buildInput())
      setPreview(nextPreview)
      setAllowDuplicate(false)
      setError('')
    } catch (previewError) {
      setPreview(null)
      setError(getErrorMessage(previewError))
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleCreate = async () => {
    if (!preview) return
    setIsCreating(true)
    setMessage('')
    try {
      const created = await getErpApi().createFeeInvoice({
        ...buildInput(),
        allowDuplicate,
      })
      setMessage(`Invoice ${created.invoiceNo} generated.`)
      setPreview(null)
      setAllowDuplicate(false)
      onCreated(created)
      setError('')
    } catch (createError) {
      setError(getErrorMessage(createError))
    } finally {
      setIsCreating(false)
    }
  }

  const duplicateCount = preview?.possibleDuplicates.length ?? 0
  const canCreate = preview && (duplicateCount === 0 || allowDuplicate)

  return (
    <section className="page-stack">
      <section className="page-header page-header--compact">
        <div>
          <h2>Generate Fee Invoice</h2>
          <p>Preview fee structure, concessions and dues before posting</p>
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

      <section className="master-page-grid master-page-grid--structure invoice-generator-grid">
        <form className="panel master-form-card" onSubmit={(event) => void handlePreview(event)}>
          <div className="panel-heading">
            <div>
              <h3>Invoice Details</h3>
              <p>Select student, session and billing period</p>
            </div>
          </div>
          <div className="master-form-fields">
            {students.length === 0 && !isLoading && (
              <div className="form-note form-note--warning">
                <Icon name="clock" size={17} />
                Add a student before generating invoices.
              </div>
            )}
            <label className="form-field">
              <span>Student</span>
              <select
                disabled={students.length === 0}
                required
                value={studentId}
                onChange={(event) => {
                  setStudentId(event.target.value)
                  setPreview(null)
                }}
              >
                {students.length === 0 && <option value="">No students</option>}
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.admissionNo})
                  </option>
                ))}
              </select>
            </label>
            {selectedStudent && (
              <div className="selected-student-details selected-student-details--compact">
                <div><span>Class</span><strong>{selectedStudent.className}</strong></div>
                <div><span>Section</span><strong>{selectedStudent.section || '-'}</strong></div>
                <div><span>Admission</span><strong>{selectedStudent.admissionNo}</strong></div>
              </div>
            )}
            <label className="form-field">
              <span>Academic Session</span>
              <select
                disabled={sessions.length === 0}
                required
                value={academicSessionId}
                onChange={(event) => {
                  setAcademicSessionId(event.target.value)
                  setPreview(null)
                }}
              >
                {sessions.length === 0 && <option value="">No sessions</option>}
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.sessionName}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-row">
              <label className="form-field">
                <span>Billing Period</span>
                <select
                  value={billingPeriod}
                  onChange={(event) => {
                    setBillingPeriod(event.target.value as BillingPeriod)
                    setPreview(null)
                  }}
                >
                  {billingPeriods.map((period) => (
                    <option key={period}>{period}</option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Invoice Date</span>
                <input
                  required
                  type="date"
                  value={invoiceDate}
                  onChange={(event) => {
                    setInvoiceDate(event.target.value)
                    setPreview(null)
                  }}
                />
              </label>
            </div>
            <div className="form-row">
              <label className="form-field">
                <span>Due Date</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => {
                    setDueDate(event.target.value)
                    setPreview(null)
                  }}
                />
              </label>
              <label className="form-field">
                <span>Late Fee</span>
                <input
                  min="0"
                  step="1"
                  type="number"
                  value={lateFee}
                  onChange={(event) => {
                    setLateFee(event.target.value)
                    setPreview(null)
                  }}
                />
              </label>
            </div>
            <label className="toggle-row">
              <input
                checked={includePreviousDue}
                type="checkbox"
                onChange={(event) => {
                  setIncludePreviousDue(event.target.checked)
                  setPreview(null)
                }}
              />
              <span>Include carry-forward previous dues</span>
            </label>
            <div className="form-row">
              <label className="form-field">
                <span>Manual Adjustment</span>
                <input
                  step="1"
                  type="number"
                  value={adjustmentAmount}
                  onChange={(event) => {
                    setAdjustmentAmount(event.target.value)
                    setPreview(null)
                  }}
                />
              </label>
              <label className="form-field">
                <span>Adjustment Reason</span>
                <input
                  required={Number(adjustmentAmount || 0) !== 0}
                  value={adjustmentReason}
                  onChange={(event) => {
                    setAdjustmentReason(event.target.value)
                    setPreview(null)
                  }}
                />
              </label>
            </div>
            <label className="form-field">
              <span>Notes</span>
              <textarea
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
            <div className="master-form-actions">
              <button
                className="secondary-button"
                disabled={!studentId || !academicSessionId || isPreviewing}
                type="submit"
              >
                <Icon name="reports" size={17} />
                {isPreviewing ? 'Loading...' : 'Preview'}
              </button>
            </div>
          </div>
        </form>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Invoice Preview</h3>
              <p>Discount snapshots are stored with generated invoices</p>
            </div>
          </div>
          {preview ? (
            <div className="invoice-preview-stack">
              {duplicateCount > 0 && (
                <div className="form-note form-note--warning">
                  <Icon name="clock" size={17} />
                  <span>
                    {duplicateCount} matching invoice already exists for this student,
                    session and billing period.
                  </span>
                </div>
              )}
              <DataTable
                columns={previewColumns}
                getRowKey={(item) => `${item.feeHeadId}-${item.displayOrder}`}
                rows={preview.items}
              />
              <div className="invoice-totals-grid">
                <div><span>Subtotal</span><strong>{formatCurrency(preview.subtotal)}</strong></div>
                <div><span>Discount</span><strong>{formatCurrency(preview.discountAmount)}</strong></div>
                <div><span>Previous Due</span><strong>{formatCurrency(preview.previousDue)}</strong></div>
                <div><span>Late Fee</span><strong>{formatCurrency(preview.lateFee)}</strong></div>
                <div><span>Adjustment</span><strong>{formatCurrency(preview.adjustmentAmount)}</strong></div>
                <div><span>Grand Total</span><strong>{formatCurrency(preview.grandTotal)}</strong></div>
              </div>
              {preview.discounts.length > 0 && (
                <div className="discount-chip-row">
                  {preview.discounts.map((discount) => (
                    <span className="neutral-badge" key={discount.id}>
                      {discount.discountTypeName}: {discount.discountMode === 'Percentage'
                        ? `${discount.discountValue}%`
                        : formatCurrency(discount.discountValue)}
                    </span>
                  ))}
                </div>
              )}
              {duplicateCount > 0 && (
                <label className="toggle-row">
                  <input
                    checked={allowDuplicate}
                    type="checkbox"
                    onChange={(event) => setAllowDuplicate(event.target.checked)}
                  />
                  <span>Confirm duplicate invoice generation</span>
                </label>
              )}
              <div className="payment-actions">
                <span>Invoice generation does not create cash income.</span>
                <button
                  className="primary-button"
                  disabled={!canCreate || isCreating}
                  onClick={() => void handleCreate()}
                  type="button"
                >
                  <Icon name="check" size={17} />
                  {isCreating ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>
            </div>
          ) : (
            <p className="empty-table">
              {isLoading ? 'Loading invoice data...' : 'Preview an invoice to continue.'}
            </p>
          )}
        </section>
      </section>
    </section>
  )
}
