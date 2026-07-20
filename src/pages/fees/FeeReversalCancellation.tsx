import { useEffect, useMemo, useState } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import type { FeeInvoice, FeePayment } from '../../types'

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

export function FeeReversalCancellation() {
  const [invoices, setInvoices] = useState<FeeInvoice[]>([])
  const [payments, setPayments] = useState<FeePayment[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const activePayments = useMemo(
    () => payments.filter((payment) => payment.status !== 'Reversed'),
    [payments],
  )

  const refresh = async () => {
    const [invoiceRows, paymentRows] = await Promise.all([
      getErpApi().getFeeInvoices(),
      getErpApi().getFeePayments(),
    ])
    setInvoices(invoiceRows)
    setPayments(paymentRows)
  }

  useEffect(() => {
    let isCurrent = true

    Promise.resolve()
      .then(() => refresh())
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

  const cancelInvoice = async (invoice: FeeInvoice) => {
    const reason = window.prompt(`Cancellation reason for ${invoice.invoiceNo}`)
    if (!reason) return
    try {
      await getErpApi().cancelFeeInvoice(invoice.id, reason)
      await refresh()
      setMessage(`${invoice.invoiceNo} was cancelled.`)
      setError('')
    } catch (cancelError) {
      setError(getErrorMessage(cancelError))
      setMessage('')
    }
  }

  const reversePayment = async (payment: FeePayment) => {
    const reason = window.prompt(`Reversal reason for ${payment.receiptNo}`)
    if (!reason) return
    try {
      await getErpApi().reverseFeePayment(payment.id, reason)
      await refresh()
      setMessage(`${payment.receiptNo} was reversed.`)
      setError('')
    } catch (reverseError) {
      setError(getErrorMessage(reverseError))
      setMessage('')
    }
  }

  const invoiceColumns: TableColumn<FeeInvoice>[] = [
    { key: 'invoice', header: 'Invoice No', render: (invoice) => invoice.invoiceNo },
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
      key: 'amount',
      header: 'Balance',
      className: 'align-right',
      render: (invoice) => formatCurrency(invoice.balanceAmount),
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
      key: 'action',
      header: '',
      className: 'align-right',
      render: (invoice) => (
        <button
          className="table-action-button table-action-button--danger"
          disabled={invoice.status === 'Cancelled' || invoice.paidAmount > 0}
          onClick={() => void cancelInvoice(invoice)}
          type="button"
        >
          Cancel
        </button>
      ),
    },
  ]

  const paymentColumns: TableColumn<FeePayment>[] = [
    { key: 'receipt', header: 'Receipt No', render: (payment) => payment.receiptNo },
    {
      key: 'student',
      header: 'Student',
      render: (payment) => (
        <div>
          <strong className="table-block">{payment.studentName}</strong>
          <span className="table-secondary">{payment.admissionNo || '-'}</span>
        </div>
      ),
    },
    { key: 'date', header: 'Payment Date', render: (payment) => formatDate(payment.paymentDate) },
    {
      key: 'amount',
      header: 'Amount',
      className: 'align-right',
      render: (payment) => formatCurrency(payment.amount),
    },
    {
      key: 'status',
      header: 'Status',
      render: (payment) => (
        <span className={`status-badge status-badge--${payment.status.toLowerCase()}`}>
          {payment.status}
        </span>
      ),
    },
    {
      key: 'action',
      header: '',
      className: 'align-right',
      render: (payment) => (
        <button
          className="table-action-button table-action-button--danger"
          onClick={() => void reversePayment(payment)}
          type="button"
        >
          Reverse
        </button>
      ),
    },
  ]

  return (
    <section className="page-stack">
      <section className="page-header page-header--compact">
        <div>
          <h2>Fee Reversal & Cancellation</h2>
          <p>Cancel unpaid invoices or reverse receipts without deleting records</p>
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

      <div className="form-note">
        <Icon name="lock" size={17} />
        Paid invoices must be handled by reversing the related receipt first. Receipt
        numbers are preserved and never reused.
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Invoice Cancellation</h3>
            <p>Only invoices without active payment allocations can be cancelled</p>
          </div>
        </div>
        <DataTable
          columns={invoiceColumns}
          getRowKey={(invoice) => invoice.id}
          rows={invoices}
          emptyMessage={isLoading ? 'Loading invoices...' : 'No invoices found.'}
        />
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Payment Reversal</h3>
            <p>Reversal updates invoice allocations and reverses linked account entries</p>
          </div>
        </div>
        <DataTable
          columns={paymentColumns}
          getRowKey={(payment) => payment.id}
          rows={activePayments}
          emptyMessage={isLoading ? 'Loading receipts...' : 'No active receipts found.'}
        />
      </section>
    </section>
  )
}
