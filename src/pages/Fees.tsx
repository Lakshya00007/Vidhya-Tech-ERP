import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../components/DataTable'
import { Icon } from '../components/Icon'
import { getErpApi, getErrorMessage } from '../lib/erpApi'
import type { FeePayment, PaymentMode, Student } from '../types'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

const formatPaymentDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date)
}

const formatPaymentTime = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
}

export function Fees() {
  const [studentRows, setStudentRows] = useState<Student[]>([])
  const [paymentRows, setPaymentRows] = useState<FeePayment[]>([])
  const [search, setSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [amount, setAmount] = useState('')
  const [feeType, setFeeType] = useState('Tuition Fee')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    Promise.resolve()
      .then(() =>
        Promise.all([getErpApi().getStudents(), getErpApi().getFeePayments()]),
      )
      .then(([students, payments]) => {
        if (isCurrent) {
          setStudentRows(students)
          setPaymentRows(payments)
          setSelectedStudentId(students[0]?.id ?? '')
          setError('')
        }
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

  const columns: TableColumn<FeePayment>[] = [
    {
      key: 'receipt',
      header: 'Receipt No.',
      render: (payment) => <span className="table-primary">{payment.receiptNo}</span>,
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
    { key: 'class', header: 'Class', render: (payment) => payment.className || '—' },
    { key: 'fee', header: 'Fee Type', render: (payment) => payment.feeType || '—' },
    {
      key: 'date',
      header: 'Date & Time',
      render: (payment) => (
        <div>
          <span className="table-block">{formatPaymentDate(payment.paymentDate)}</span>
          <span className="table-secondary">{formatPaymentTime(payment.paymentDate)}</span>
        </div>
      ),
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
      key: 'print',
      header: '',
      className: 'align-right',
      render: (payment) => (
        <button
          className="row-action row-action--print"
          type="button"
          title="Print receipt"
          onClick={() => setMessage(`${payment.receiptNo} is ready for printing.`)}
        >
          <Icon name="print" size={16} />
        </button>
      ),
    },
  ]

  const handlePayment = async (event: FormEvent) => {
    event.preventDefault()
    const numericAmount = Number(amount)
    if (!selectedStudent || !Number.isInteger(numericAmount) || numericAmount <= 0) {
      setError('Select a student and enter a valid whole-number amount.')
      return
    }

    setIsSaving(true)
    try {
      const payment = await getErpApi().createFeePayment({
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        className: `${selectedStudent.className}-${selectedStudent.section}`,
        feeType,
        amount: numericAmount,
        paymentMode,
        notes,
      })
      setPaymentRows(await getErpApi().getFeePayments())
      setAmount('')
      setNotes('')
      setMessage(`Payment recorded. Receipt ${payment.receiptNo} is ready.`)
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
          <p>Find a student, review dues and record a payment.</p>
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
                onClick={() => setSelectedStudentId(student.id)}
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
                Class {selectedStudent.className}-{selectedStudent.section}
              </span>
            )}
          </div>
          <div className="fee-summary-grid">
            <div>
              <span>Total Fee</span>
              <strong>₹42,000</strong>
            </div>
            <div>
              <span>Paid</span>
              <strong className="text-success">₹29,500</strong>
            </div>
            <div>
              <span>Balance Due</span>
              <strong className="text-danger">₹12,500</strong>
            </div>
          </div>
          <form className="payment-form" onSubmit={(event) => void handlePayment(event)}>
            <div className="form-row form-row--three">
              <label className="form-field">
                <span>Fee Type</span>
                <select
                  disabled={!selectedStudent}
                  value={feeType}
                  onChange={(event) => setFeeType(event.target.value)}
                >
                  <option>Tuition Fee</option>
                  <option>Quarterly Fee</option>
                  <option>Transport Fee</option>
                  <option>Annual Fee</option>
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
                </select>
              </label>
            </div>
            <label className="form-field">
              <span>Payment Note</span>
              <input
                disabled={!selectedStudent}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional note or transaction reference"
                value={notes}
              />
            </label>
            <div className="payment-actions">
              <span>Receipt number is generated automatically when payment is saved.</span>
              <button
                className="primary-button"
                disabled={!selectedStudent || isSaving}
                type="submit"
              >
                <Icon name="wallet" size={17} />
                {isSaving ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Recent Receipts</h3>
            <p>Latest payments recorded in the local database</p>
          </div>
          <button className="text-button" type="button">
            View all receipts
            <Icon name="arrow" size={16} />
          </button>
        </div>
        <DataTable
          columns={columns}
          getRowKey={(payment) => payment.id}
          rows={paymentRows.slice(0, 5)}
          emptyMessage={
            isLoading ? 'Loading fee payments...' : 'No fee payments recorded yet.'
          }
        />
      </section>
    </div>
  )
}
