import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../components/DataTable'
import { Icon } from '../components/Icon'
import { ReceiptPreview } from '../components/ReceiptPreview'
import { getErpApi, getErrorMessage } from '../lib/erpApi'
import type {
  FeeHead,
  FeePayment,
  FeeStructure,
  PaymentMode,
  SchoolSettings,
  Student,
} from '../types'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

const formatPaymentDate = (value: string) => {
  const dateText = value.slice(0, 10)
  const date = new Date(`${dateText}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date)
}

const getTodayValue = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getStructuredAmount = (
  structures: FeeStructure[],
  student: Student | undefined,
  feeType: string,
  academicYear: string,
) => {
  const matchingStructures = structures.filter(
    (structure) =>
      structure.status === 'Active' &&
      structure.className === student?.className &&
      structure.feeHeadName === feeType,
  )
  return (
    matchingStructures.find(
      (structure) => academicYear && structure.academicYear === academicYear,
    )?.amount ??
    matchingStructures.find((structure) => !structure.academicYear)?.amount ??
    matchingStructures[0]?.amount
  )
}

export function Fees() {
  const [studentRows, setStudentRows] = useState<Student[]>([])
  const [paymentRows, setPaymentRows] = useState<FeePayment[]>([])
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [settings, setSettings] = useState<SchoolSettings | null>(null)
  const [search, setSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [amount, setAmount] = useState('')
  const [feeType, setFeeType] = useState('')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash')
  const [paymentDate, setPaymentDate] = useState(getTodayValue)
  const [notes, setNotes] = useState('')
  const [selectedReceipt, setSelectedReceipt] = useState<FeePayment | null>(null)
  const [printRequested, setPrintRequested] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    Promise.resolve()
      .then(() =>
        Promise.all([
          getErpApi().getStudents(),
          getErpApi().getFeePayments(),
          getErpApi().getFeeHeads(),
          getErpApi().getFeeStructures(),
          getErpApi().getSchoolSettings(),
        ]),
      )
      .then(([students, payments, headRows, structureRows, schoolSettings]) => {
        if (!isCurrent) return

        const firstStudent = students[0]
        const firstFeeHead = headRows.find((feeHead) => feeHead.status === 'Active')
        const firstAmount = getStructuredAmount(
          structureRows,
          firstStudent,
          firstFeeHead?.name ?? '',
          schoolSettings.academicYear,
        )

        setStudentRows(students)
        setPaymentRows(payments)
        setFeeHeads(headRows)
        setFeeStructures(structureRows)
        setSettings(schoolSettings)
        setSelectedStudentId(firstStudent?.id ?? '')
        setFeeType(firstFeeHead?.name ?? '')
        setAmount(firstAmount ? String(firstAmount) : '')
        setError('')
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

  useEffect(() => {
    if (!printRequested || !selectedReceipt) return

    const printTimer = window.setTimeout(() => {
      window.print()
      setPrintRequested(false)
    }, 150)

    return () => window.clearTimeout(printTimer)
  }, [printRequested, selectedReceipt])

  const matchingStudents = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return studentRows.slice(0, 5)
    return studentRows.filter((student) =>
      [student.name, student.admissionNo, student.mobile].some((value) =>
        value.toLowerCase().includes(query),
      ),
    )
  }, [search, studentRows])

  const selectedStudent = studentRows.find((student) => student.id === selectedStudentId)
  const activeFeeHeads = useMemo(
    () => feeHeads.filter((feeHead) => feeHead.status === 'Active'),
    [feeHeads],
  )
  const configuredFee = useMemo(
    () =>
      selectedStudent
        ? feeStructures
            .filter(
              (structure) =>
                structure.status === 'Active' &&
                structure.className === selectedStudent.className &&
                (!settings?.academicYear ||
                  structure.academicYear === settings.academicYear),
            )
            .reduce((total, structure) => total + structure.amount, 0)
        : 0,
    [feeStructures, selectedStudent, settings],
  )
  const recordedPaid = useMemo(
    () =>
      selectedStudent
        ? paymentRows
            .filter((payment) => payment.studentId === selectedStudent.id)
            .reduce((total, payment) => total + payment.amount, 0)
        : 0,
    [paymentRows, selectedStudent],
  )

  const selectStudent = (student: Student) => {
    const structuredAmount = getStructuredAmount(
      feeStructures,
      student,
      feeType,
      settings?.academicYear ?? '',
    )
    setSelectedStudentId(student.id)
    setAmount(structuredAmount ? String(structuredAmount) : '')
  }

  const selectFeeType = (nextFeeType: string) => {
    const structuredAmount = getStructuredAmount(
      feeStructures,
      selectedStudent,
      nextFeeType,
      settings?.academicYear ?? '',
    )
    setFeeType(nextFeeType)
    setAmount(structuredAmount ? String(structuredAmount) : '')
  }

  const openReceipt = (payment: FeePayment) => {
    setPrintRequested(false)
    setSelectedReceipt(payment)
  }

  const printReceipt = (payment: FeePayment) => {
    setSelectedReceipt(payment)
    setPrintRequested(true)
  }

  const columns: TableColumn<FeePayment>[] = [
    {
      key: 'receipt',
      header: 'Receipt No.',
      render: (payment) => (
        <button
          className="receipt-link"
          type="button"
          onClick={() => openReceipt(payment)}
        >
          {payment.receiptNo}
        </button>
      ),
    },
    {
      key: 'student',
      header: 'Student',
      render: (payment) => (
        <div>
          <strong className="table-block">{payment.studentName}</strong>
          <span className="table-secondary">{payment.admissionNo || '—'}</span>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class / Section',
      render: (payment) =>
        `${payment.className || '—'}${payment.section ? `-${payment.section}` : ''}`,
    },
    { key: 'fee', header: 'Fee Head', render: (payment) => payment.feeType || '—' },
    {
      key: 'date',
      header: 'Date',
      render: (payment) => formatPaymentDate(payment.paymentDate),
    },
    {
      key: 'mode',
      header: 'Mode',
      render: (payment) => <span className="neutral-badge">{payment.paymentMode}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      className: 'align-right',
      render: (payment) => <strong>{formatCurrency(payment.amount)}</strong>,
    },
    {
      key: 'actions',
      header: '',
      className: 'align-right',
      render: (payment) => (
        <div className="receipt-row-actions">
          <button
            className="table-action-button"
            type="button"
            onClick={() => openReceipt(payment)}
          >
            View
          </button>
          <button
            className="table-action-button"
            type="button"
            onClick={() => printReceipt(payment)}
          >
            <Icon name="print" size={13} />
            Print
          </button>
        </div>
      ),
    },
  ]

  const handlePayment = async (event: FormEvent) => {
    event.preventDefault()
    const numericAmount = Number(amount)
    if (
      !selectedStudent ||
      !feeType ||
      !Number.isInteger(numericAmount) ||
      numericAmount <= 0
    ) {
      setError('Select a student and fee head, then enter a valid whole-number amount.')
      return
    }

    setIsSaving(true)
    try {
      const payment = await getErpApi().createFeePayment({
        studentId: selectedStudent.id,
        feeType,
        amount: numericAmount,
        paymentMode,
        paymentDate,
        notes,
      })
      setPaymentRows(await getErpApi().getFeePayments())
      setNotes('')
      setMessage(`Payment recorded. Receipt ${payment.receiptNo} was generated.`)
      setSelectedReceipt(payment)
      setError('')
    } catch (saveError) {
      setError(getErrorMessage(saveError))
      setMessage('')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h2>Fee Collection</h2>
          <p>Find a student, collect a configured fee and issue a receipt.</p>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={() => setMessage('Today’s collection is shown on the dashboard.')}
        >
          <Icon name="reports" size={17} />
          Today’s Summary
        </button>
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

      <section className="fee-workspace">
        <div className="panel student-finder">
          <div className="panel-heading">
            <div>
              <h3>Find Student</h3>
              <p>Search by name, admission number or mobile</p>
            </div>
          </div>
          <label className="search-field">
            <Icon name="search" size={18} />
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student..."
              type="search"
              value={search}
            />
          </label>
          <div className="student-results">
            {matchingStudents.map((student) => (
              <button
                className={`student-result${selectedStudent?.id === student.id ? ' student-result--active' : ''}`}
                key={student.id}
                onClick={() => selectStudent(student)}
                type="button"
              >
                <span className="person-avatar person-avatar--blue">
                  {student.name.split(' ').map((name) => name[0]).join('').slice(0, 2)}
                </span>
                <span>
                  <strong>{student.name}</strong>
                  <small>{student.admissionNo} · Class {student.className}-{student.section}</small>
                </span>
                {selectedStudent?.id === student.id && (
                  <span className="selected-check"><Icon name="check" size={14} /></span>
                )}
              </button>
            ))}
            {!isLoading && matchingStudents.length === 0 && (
              <p className="empty-result">
                {studentRows.length === 0
                  ? 'Add a student before recording a fee payment.'
                  : 'No student found.'}
              </p>
            )}
          </div>
        </div>

        <div className="panel fee-entry-panel">
          <div className="panel-heading">
            <div>
              <h3>Payment Entry</h3>
              <p>
                {selectedStudent
                  ? `Collecting for ${selectedStudent.name}`
                  : 'Select a student to begin'}
              </p>
            </div>
            {selectedStudent && (
              <span className="active-student-badge">
                <Icon name="user" size={15} />
                {selectedStudent.admissionNo}
              </span>
            )}
          </div>

          {selectedStudent && (
            <div className="selected-student-details">
              <div><span>Student</span><strong>{selectedStudent.name}</strong></div>
              <div><span>Admission No.</span><strong>{selectedStudent.admissionNo}</strong></div>
              <div><span>Class</span><strong>{selectedStudent.className}</strong></div>
              <div><span>Section</span><strong>{selectedStudent.section || '—'}</strong></div>
              <div><span>Guardian</span><strong>{selectedStudent.guardianName || '—'}</strong></div>
              <div><span>Mobile</span><strong>{selectedStudent.mobile || '—'}</strong></div>
            </div>
          )}

          <div className="fee-summary-grid">
            <div>
              <span>Configured Fee</span>
              <strong>{formatCurrency(configuredFee)}</strong>
            </div>
            <div>
              <span>Recorded Paid</span>
              <strong className="text-success">{formatCurrency(recordedPaid)}</strong>
            </div>
            <div>
              <span>Current Balance</span>
              <strong className="text-danger">
                {formatCurrency(Math.max(configuredFee - recordedPaid, 0))}
              </strong>
            </div>
          </div>

          <form className="payment-form" onSubmit={(event) => void handlePayment(event)}>
            {activeFeeHeads.length === 0 && !isLoading && (
              <div className="form-note form-note--warning">
                <Icon name="clock" size={17} />
                Create fee heads from Settings first.
              </div>
            )}
            <div className="form-row form-row--four">
              <label className="form-field">
                <span>Fee Head</span>
                <select
                  disabled={!selectedStudent || activeFeeHeads.length === 0}
                  required
                  value={feeType}
                  onChange={(event) => selectFeeType(event.target.value)}
                >
                  {activeFeeHeads.length === 0 && (
                    <option value="">No fee heads available</option>
                  )}
                  {activeFeeHeads.map((feeHead) => (
                    <option key={feeHead.id} value={feeHead.name}>
                      {feeHead.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Amount (₹)</span>
                <input
                  disabled={!selectedStudent}
                  min="1"
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Enter amount"
                  required
                  step="1"
                  type="number"
                  value={amount}
                />
              </label>
              <label className="form-field">
                <span>Payment Mode</span>
                <select
                  disabled={!selectedStudent}
                  value={paymentMode}
                  onChange={(event) => setPaymentMode(event.target.value as PaymentMode)}
                >
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Card</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                </select>
              </label>
              <label className="form-field">
                <span>Payment Date</span>
                <input
                  disabled={!selectedStudent}
                  required
                  type="date"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                />
              </label>
            </div>
            <label className="form-field">
              <span>Notes</span>
              <input
                disabled={!selectedStudent}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional note, cheque number or transaction reference"
                value={notes}
              />
            </label>
            <div className="payment-actions">
              <span>Receipt number is generated automatically when payment is saved.</span>
              <button
                className="primary-button"
                disabled={!selectedStudent || isSaving || activeFeeHeads.length === 0}
                type="submit"
              >
                <Icon name="wallet" size={17} />
                {isSaving ? 'Recording...' : 'Collect Fee & Generate Receipt'}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Recent Receipts</h3>
            <p>Latest persisted fee receipts</p>
          </div>
        </div>
        <DataTable
          columns={columns}
          getRowKey={(payment) => payment.id}
          rows={paymentRows.slice(0, 10)}
          emptyMessage={
            isLoading ? 'Loading fee receipts...' : 'No fee receipts recorded yet.'
          }
        />
      </section>

      {selectedReceipt && settings && (
        <ReceiptPreview
          payment={selectedReceipt}
          settings={settings}
          onClose={() => {
            setPrintRequested(false)
            setSelectedReceipt(null)
          }}
          onPrint={() => window.print()}
        />
      )}
    </div>
  )
}
