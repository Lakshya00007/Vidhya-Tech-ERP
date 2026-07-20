import { useEffect, useMemo, useState } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import type {
  AcademicSession,
  FeeInvoice,
  FeeInvoiceAccountsReport,
  FeeInvoiceFilter,
  FeeInvoiceStatus,
  FeeInvoiceSummary,
  SchoolSettings,
  Student,
} from '../../types'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

const formatDate = (value: string) => {
  if (!value) return '-'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date)
}

const invoiceStatuses: Array<FeeInvoiceStatus | 'All'> = [
  'All',
  'Unpaid',
  'Partially Paid',
  'Paid',
  'Overdue',
  'Cancelled',
]

interface FeeInvoiceListProps {
  canCancel: boolean
  onCollect: (studentId: string) => void
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(','),
    )
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function FeeInvoiceList({ canCancel, onCollect }: FeeInvoiceListProps) {
  const [invoices, setInvoices] = useState<FeeInvoice[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [settings, setSettings] = useState<SchoolSettings | null>(null)
  const [summary, setSummary] = useState<FeeInvoiceSummary | null>(null)
  const [accountsReport, setAccountsReport] =
    useState<FeeInvoiceAccountsReport | null>(null)
  const [filter, setFilter] = useState<FeeInvoiceFilter>({ status: 'All' })
  const [selectedInvoice, setSelectedInvoice] = useState<FeeInvoice | null>(null)
  const [printRequested, setPrintRequested] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const classNames = useMemo(
    () => [...new Set(students.map((student) => student.className).filter(Boolean))],
    [students],
  )
  const sections = useMemo(
    () =>
      [
        ...new Set(
          students
            .filter(
              (student) =>
                !filter.className ||
                filter.className === 'All' ||
                student.className === filter.className,
            )
            .map((student) => student.section)
            .filter(Boolean),
        ),
      ],
    [filter.className, students],
  )

  const refreshInvoices = async (nextFilter = filter) => {
    const [invoiceRows, nextSummary, nextAccountsReport] = await Promise.all([
      getErpApi().getFeeInvoices(nextFilter),
      getErpApi().getFeeInvoiceSummary(nextFilter),
      getErpApi().getFeeInvoiceAccountsReport(nextFilter),
    ])
    setInvoices(invoiceRows)
    setSummary(nextSummary)
    setAccountsReport(nextAccountsReport)
  }

  useEffect(() => {
    let isCurrent = true

    Promise.resolve()
      .then(() =>
        Promise.all([
          getErpApi().getStudents(),
          getErpApi().getAcademicSessions(),
          getErpApi().getSchoolSettings(),
          getErpApi().getFeeInvoices({ status: 'All' }),
          getErpApi().getFeeInvoiceSummary({ status: 'All' }),
          getErpApi().getFeeInvoiceAccountsReport({ status: 'All' }),
        ]),
      )
      .then(
        ([
          studentRows,
          sessionRows,
          schoolSettings,
          invoiceRows,
          invoiceSummary,
          invoiceAccountsReport,
        ]) => {
          if (!isCurrent) return

          setStudents(studentRows)
          setSessions(sessionRows)
          setSettings(schoolSettings)
          setInvoices(invoiceRows)
          setSummary(invoiceSummary)
          setAccountsReport(invoiceAccountsReport)
        },
      )
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
    if (!printRequested || !selectedInvoice) return

    const timer = window.setTimeout(() => {
      window.print()
      setPrintRequested(false)
    }, 150)
    return () => window.clearTimeout(timer)
  }, [printRequested, selectedInvoice])

  const applyFilter = async (nextFilter: FeeInvoiceFilter) => {
    setFilter(nextFilter)
    setIsLoading(true)
    try {
      await refreshInvoices(nextFilter)
      setError('')
    } catch (filterError) {
      setError(getErrorMessage(filterError))
    } finally {
      setIsLoading(false)
    }
  }

  const openInvoice = async (invoice: FeeInvoice, shouldPrint = false) => {
    try {
      const fullInvoice = await getErpApi().getFeeInvoiceById(invoice.id)
      if (!fullInvoice) {
        setError('Invoice was not found.')
        return
      }
      setSelectedInvoice(fullInvoice)
      setPrintRequested(shouldPrint)
      setError('')
    } catch (openError) {
      setError(getErrorMessage(openError))
    }
  }

  const cancelInvoice = async (invoice: FeeInvoice) => {
    const reason = window.prompt(`Cancellation reason for ${invoice.invoiceNo}`)
    if (!reason) return
    try {
      await getErpApi().cancelFeeInvoice(invoice.id, reason)
      await refreshInvoices()
      setMessage(`${invoice.invoiceNo} was cancelled.`)
      setError('')
    } catch (cancelError) {
      setError(getErrorMessage(cancelError))
      setMessage('')
    }
  }

  const exportRegister = () => {
    downloadCsv('fee-invoice-register.csv', [
      [
        'Invoice No',
        'Student',
        'Admission No',
        'Class',
        'Section',
        'Billing Period',
        'Invoice Date',
        'Due Date',
        'Grand Total',
        'Paid',
        'Balance',
        'Status',
      ],
      ...invoices.map((invoice) => [
        invoice.invoiceNo,
        invoice.studentName,
        invoice.admissionNo,
        invoice.className,
        invoice.section,
        invoice.billingPeriod,
        invoice.invoiceDate,
        invoice.dueDate,
        String(invoice.grandTotal),
        String(invoice.paidAmount),
        String(invoice.balanceAmount),
        invoice.status,
      ]),
    ])
  }

  const columns: TableColumn<FeeInvoice>[] = [
    {
      key: 'invoice',
      header: 'Invoice No',
      render: (invoice) => (
        <button
          className="receipt-link"
          onClick={() => void openInvoice(invoice)}
          type="button"
        >
          {invoice.invoiceNo}
        </button>
      ),
    },
    {
      key: 'student',
      header: 'Student',
      render: (invoice) => (
        <div>
          <strong className="table-block">{invoice.studentName}</strong>
          <span className="table-secondary">{invoice.admissionNo || '-'}</span>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class / Section',
      render: (invoice) =>
        `${invoice.className || '-'}${invoice.section ? `-${invoice.section}` : ''}`,
    },
    { key: 'period', header: 'Billing Period', render: (invoice) => invoice.billingPeriod },
    { key: 'date', header: 'Invoice Date', render: (invoice) => formatDate(invoice.invoiceDate) },
    { key: 'due', header: 'Due Date', render: (invoice) => formatDate(invoice.dueDate) },
    {
      key: 'total',
      header: 'Grand Total',
      className: 'align-right',
      render: (invoice) => formatCurrency(invoice.grandTotal),
    },
    {
      key: 'paid',
      header: 'Paid',
      className: 'align-right',
      render: (invoice) => formatCurrency(invoice.paidAmount),
    },
    {
      key: 'balance',
      header: 'Balance',
      className: 'align-right',
      render: (invoice) => <strong>{formatCurrency(invoice.balanceAmount)}</strong>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (invoice) => (
        <span className={`status-badge status-badge--${invoice.status.toLowerCase().replaceAll(' ', '-')}`}>
          {invoice.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'align-right',
      render: (invoice) => (
        <div className="receipt-row-actions">
          <button
            className="table-action-button"
            onClick={() => void openInvoice(invoice)}
            type="button"
          >
            View
          </button>
          <button
            className="table-action-button"
            onClick={() => void openInvoice(invoice, true)}
            type="button"
          >
            <Icon name="print" size={13} />
            Print
          </button>
          {invoice.status !== 'Cancelled' && invoice.balanceAmount > 0 && (
            <button
              className="table-action-button"
              onClick={() => onCollect(invoice.studentId)}
              type="button"
            >
              Collect
            </button>
          )}
          {canCancel && invoice.status !== 'Cancelled' && (
            <button
              className="table-action-button table-action-button--danger"
              onClick={() => void cancelInvoice(invoice)}
              type="button"
            >
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <section className="page-stack">
      <section className="page-header page-header--compact">
        <div>
          <h2>Fee Invoice List</h2>
          <p>Invoice register, outstanding balances and fee-head report</p>
        </div>
        <button className="secondary-button" onClick={exportRegister} type="button">
          <Icon name="download" size={17} />
          CSV
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

      <section className="panel invoice-filter-panel">
        <div className="form-row form-row--four">
          <label className="form-field">
            <span>Session</span>
            <select
              value={filter.academicSessionId ?? ''}
              onChange={(event) =>
                void applyFilter({
                  ...filter,
                  academicSessionId: event.target.value || undefined,
                })
              }
            >
              <option value="">All sessions</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.sessionName}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Class</span>
            <select
              value={filter.className ?? 'All'}
              onChange={(event) =>
                void applyFilter({
                  ...filter,
                  className: event.target.value,
                  section: 'All',
                })
              }
            >
              <option>All</option>
              {classNames.map((className) => (
                <option key={className}>{className}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Section</span>
            <select
              value={filter.section ?? 'All'}
              onChange={(event) =>
                void applyFilter({ ...filter, section: event.target.value })
              }
            >
              <option>All</option>
              {sections.map((section) => (
                <option key={section}>{section}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Status</span>
            <select
              value={filter.status ?? 'All'}
              onChange={(event) =>
                void applyFilter({
                  ...filter,
                  status: event.target.value as FeeInvoiceStatus | 'All',
                })
              }
            >
              {invoiceStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-row form-row--three">
          <label className="form-field">
            <span>Student</span>
            <select
              value={filter.studentId ?? ''}
              onChange={(event) =>
                void applyFilter({
                  ...filter,
                  studentId: event.target.value || undefined,
                })
              }
            >
              <option value="">All students</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.admissionNo})
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>From</span>
            <input
              type="date"
              value={filter.startDate ?? ''}
              onChange={(event) =>
                void applyFilter({
                  ...filter,
                  startDate: event.target.value || undefined,
                })
              }
            />
          </label>
          <label className="form-field">
            <span>To</span>
            <input
              type="date"
              value={filter.endDate ?? ''}
              onChange={(event) =>
                void applyFilter({
                  ...filter,
                  endDate: event.target.value || undefined,
                })
              }
            />
          </label>
        </div>
      </section>

      {summary && (
        <section className="invoice-summary-grid">
          <div><span>Invoiced</span><strong>{formatCurrency(summary.grandTotal)}</strong></div>
          <div><span>Collected</span><strong>{formatCurrency(summary.paidAmount)}</strong></div>
          <div><span>Outstanding</span><strong>{formatCurrency(summary.balanceAmount)}</strong></div>
          <div><span>Discounts</span><strong>{formatCurrency(summary.discountAmount)}</strong></div>
          <div><span>Overdue</span><strong>{summary.overdueInvoiceCount}</strong></div>
        </section>
      )}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Invoice Register</h3>
            <p>Open, print, collect against, or cancel safely</p>
          </div>
        </div>
        <DataTable
          columns={columns}
          getRowKey={(invoice) => invoice.id}
          rows={invoices}
          emptyMessage={isLoading ? 'Loading invoices...' : 'No fee invoices found.'}
        />
      </section>

      {accountsReport && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Fee-Head Collection vs Invoiced</h3>
              <p>Invoice reporting only; cash income still comes from receipts</p>
            </div>
          </div>
          <DataTable
            columns={[
              {
                key: 'head',
                header: 'Fee Head',
                render: (row) => row.feeHeadName,
              },
              {
                key: 'invoiced',
                header: 'Invoiced',
                className: 'align-right',
                render: (row) => formatCurrency(row.invoicedAmount),
              },
              {
                key: 'collected',
                header: 'Collected',
                className: 'align-right',
                render: (row) => formatCurrency(row.collectedAmount),
              },
              {
                key: 'outstanding',
                header: 'Outstanding',
                className: 'align-right',
                render: (row) => formatCurrency(row.outstandingAmount),
              },
              {
                key: 'discount',
                header: 'Discount',
                className: 'align-right',
                render: (row) => formatCurrency(row.discountAmount),
              },
            ]}
            getRowKey={(row) => row.feeHeadId || row.feeHeadName}
            rows={accountsReport.feeHeads}
            emptyMessage="No fee-head invoice data found."
          />
        </section>
      )}

      {selectedInvoice && settings && (
        <div className="receipt-backdrop">
          <div
            aria-labelledby="fee-invoice-preview-title"
            aria-modal="true"
            className="receipt-modal fee-invoice-modal"
            role="dialog"
          >
            <div className="receipt-modal__toolbar">
              <div>
                <h2 id="fee-invoice-preview-title">Fee Invoice Preview</h2>
                <p>{selectedInvoice.invoiceNo}</p>
              </div>
              <div className="receipt-toolbar-actions">
                <button
                  className="secondary-button"
                  onClick={() => window.print()}
                  type="button"
                >
                  <Icon name="print" size={16} />
                  Print
                </button>
                <button
                  aria-label="Close invoice preview"
                  className="icon-button"
                  onClick={() => {
                    setPrintRequested(false)
                    setSelectedInvoice(null)
                  }}
                  type="button"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            </div>
            <article className="receipt-print-area fee-invoice-print-area">
              <header className="receipt-header">
                <span className="receipt-school-mark">
                  <Icon name="school" size={26} />
                </span>
                <div>
                  <h1>{settings.schoolName}</h1>
                  <p>{settings.address || 'School address'}</p>
                  <p>{settings.phone || '-'} {settings.email ? `| ${settings.email}` : ''}</p>
                </div>
              </header>
              <section className="receipt-meta-grid">
                <div><span>Invoice No.</span><strong>{selectedInvoice.invoiceNo}</strong></div>
                <div><span>Invoice Date</span><strong>{formatDate(selectedInvoice.invoiceDate)}</strong></div>
                <div><span>Due Date</span><strong>{formatDate(selectedInvoice.dueDate)}</strong></div>
                <div><span>Status</span><strong>{selectedInvoice.status}</strong></div>
              </section>
              <section className="receipt-meta-grid">
                <div><span>Student</span><strong>{selectedInvoice.studentName}</strong></div>
                <div><span>Admission No.</span><strong>{selectedInvoice.admissionNo || '-'}</strong></div>
                <div><span>Class</span><strong>{selectedInvoice.className || '-'}</strong></div>
                <div><span>Section</span><strong>{selectedInvoice.section || '-'}</strong></div>
              </section>
              <table className="receipt-line-table">
                <thead>
                  <tr>
                    <th>Fee Head</th>
                    <th className="align-right">Gross</th>
                    <th className="align-right">Discount</th>
                    <th className="align-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.feeHeadName}</td>
                      <td className="align-right">{formatCurrency(item.grossAmount)}</td>
                      <td className="align-right">{formatCurrency(item.discountAmount)}</td>
                      <td className="align-right">{formatCurrency(item.netAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <section className="receipt-total-grid">
                <div><span>Subtotal</span><strong>{formatCurrency(selectedInvoice.subtotal)}</strong></div>
                <div><span>Discount</span><strong>{formatCurrency(selectedInvoice.discountAmount)}</strong></div>
                <div><span>Previous Due</span><strong>{formatCurrency(selectedInvoice.previousDue)}</strong></div>
                <div><span>Late Fee</span><strong>{formatCurrency(selectedInvoice.lateFee)}</strong></div>
                <div><span>Adjustment</span><strong>{formatCurrency(selectedInvoice.adjustmentAmount)}</strong></div>
                <div><span>Total</span><strong>{formatCurrency(selectedInvoice.grandTotal)}</strong></div>
                <div><span>Paid</span><strong>{formatCurrency(selectedInvoice.paidAmount)}</strong></div>
                <div><span>Balance</span><strong>{formatCurrency(selectedInvoice.balanceAmount)}</strong></div>
              </section>
              {selectedInvoice.notes && (
                <p className="receipt-note">{selectedInvoice.notes}</p>
              )}
              <footer className="receipt-footer">
                <span>Authorized Signature</span>
                <strong>{selectedInvoice.generatedBy || settings.schoolName}</strong>
              </footer>
            </article>
          </div>
        </div>
      )}
    </section>
  )
}
