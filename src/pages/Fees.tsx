import { useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../components/DataTable'
import { Icon } from '../components/Icon'
import { payments as initialPayments, students } from '../data/mockData'
import type { Payment } from '../types'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

export function Fees() {
  const [search, setSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState(students[0].id)
  const [paymentRows, setPaymentRows] = useState(initialPayments)
  const [amount, setAmount] = useState('12500')
  const [feeType, setFeeType] = useState('Tuition Fee')
  const [paymentMode, setPaymentMode] = useState<Payment['paymentMode']>('Cash')
  const [message, setMessage] = useState('')

  const matchingStudents = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return students.slice(0, 3)
    return students.filter((student) =>
      [student.name, student.admissionNo, student.mobile].some((value) =>
        value.toLowerCase().includes(query),
      ),
    )
  }, [search])

  const selectedStudent =
    students.find((student) => student.id === selectedStudentId) ?? students[0]

  const columns: TableColumn<Payment>[] = [
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
          <span className="table-secondary">{payment.admissionNo}</span>
        </div>
      ),
    },
    { key: 'class', header: 'Class', render: (payment) => payment.className },
    { key: 'fee', header: 'Fee Type', render: (payment) => payment.feeType },
    {
      key: 'date',
      header: 'Date & Time',
      render: (payment) => (
        <div>
          <span className="table-block">{payment.date}</span>
          <span className="table-secondary">{payment.time}</span>
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

  const handlePayment = (event: FormEvent) => {
    event.preventDefault()
    const numericAmount = Number(amount)
    if (!numericAmount) return

    const receiptNumber = 1049 + (paymentRows.length - initialPayments.length)
    const newPayment: Payment = {
      id: `payment-${Date.now()}`,
      receiptNo: `VSE-RC-${receiptNumber}`,
      studentName: selectedStudent.name,
      admissionNo: selectedStudent.admissionNo,
      className: `${selectedStudent.className}-${selectedStudent.section}`,
      feeType,
      amount: numericAmount,
      paymentMode,
      date: '03 Jul 2026',
      time: '11:10 AM',
    }
    setPaymentRows((current) => [newPayment, ...current])
    setMessage(`Payment recorded. Receipt ${newPayment.receiptNo} is ready.`)
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h2>Fee Collection</h2>
          <p>Find a student, review dues and record a payment.</p>
        </div>
        <button className="secondary-button" type="button" onClick={() => setMessage('Opening today’s collection summary.')}>
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
                className={`student-result${selectedStudent.id === student.id ? ' student-result--active' : ''}`}
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
                {selectedStudent.id === student.id && (
                  <span className="selected-check"><Icon name="check" size={14} /></span>
                )}
              </button>
            ))}
            {matchingStudents.length === 0 && <p className="empty-result">No student found.</p>}
          </div>
        </div>

        <div className="panel fee-entry-panel">
          <div className="panel-heading">
            <div>
              <h3>Payment Entry</h3>
              <p>Collecting for {selectedStudent.name}</p>
            </div>
            <span className="active-student-badge">
              <Icon name="user" size={15} />
              Class {selectedStudent.className}-{selectedStudent.section}
            </span>
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
          <form className="payment-form" onSubmit={handlePayment}>
            <div className="form-row form-row--three">
              <label className="form-field">
                <span>Fee Type</span>
                <select value={feeType} onChange={(event) => setFeeType(event.target.value)}>
                  <option>Tuition Fee</option>
                  <option>Quarterly Fee</option>
                  <option>Transport Fee</option>
                  <option>Annual Fee</option>
                </select>
              </label>
              <label className="form-field">
                <span>Amount (₹)</span>
                <input
                  min="1"
                  onChange={(event) => setAmount(event.target.value)}
                  required
                  type="number"
                  value={amount}
                />
              </label>
              <label className="form-field">
                <span>Payment Mode</span>
                <select
                  value={paymentMode}
                  onChange={(event) => setPaymentMode(event.target.value as Payment['paymentMode'])}
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
              <input placeholder="Optional note or transaction reference" />
            </label>
            <div className="payment-actions">
              <span>Receipt will be generated after payment is saved.</span>
              <button className="primary-button" type="submit">
                <Icon name="wallet" size={17} />
                Record Payment
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Recent Receipts</h3>
            <p>Latest payments recorded in the system</p>
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
        />
      </section>
    </div>
  )
}
