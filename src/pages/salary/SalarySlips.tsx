import { useState } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getErrorMessage, getSalaryErpApi } from '../../lib/erpApi'
import {
  formatCurrency,
  formatReportDate,
  formatReportMonth,
} from '../../lib/reportUtils'
import type { SalaryPayment, SchoolSettings } from '../../types'
import type { SalaryNoticeProps } from './types'

interface SalarySlipsProps extends SalaryNoticeProps {
  onPaymentsChange: (payments: SalaryPayment[]) => void
  payments: SalaryPayment[]
  settings: SchoolSettings
}

export function SalarySlips({
  onNotice,
  onPaymentsChange,
  payments,
  settings,
}: SalarySlipsProps) {
  const [selectedPayment, setSelectedPayment] =
    useState<SalaryPayment | null>(null)

  const printPayment = (payment: SalaryPayment) => {
    setSelectedPayment(payment)
    window.setTimeout(() => window.print(), 80)
  }

  const deletePayment = async (payment: SalaryPayment) => {
    if (
      !window.confirm(
        `Delete ${payment.salaryNo}? The audit entry and salary number will remain reserved.`,
      )
    ) {
      return
    }
    try {
      const api = getSalaryErpApi()
      const result = await api.deleteSalaryPayment(payment.id)
      if (!result.success) throw new Error('Salary payment was not found.')
      if (selectedPayment?.id === payment.id) setSelectedPayment(null)
      onPaymentsChange(await api.getSalaryPayments())
      onNotice({
        type: 'success',
        message: `${payment.salaryNo} was removed from active salary records.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const columns: TableColumn<SalaryPayment>[] = [
    {
      key: 'salaryNo',
      header: 'Salary No',
      render: (payment) => (
        <strong className="receipt-number">{payment.salaryNo}</strong>
      ),
    },
    {
      key: 'employee',
      header: 'Employee',
      render: (payment) => (
        <div className="primary-cell">
          <strong>{payment.employeeName}</strong>
          <span>
            {payment.employeeNo} · {payment.designation || 'Staff'}
          </span>
        </div>
      ),
    },
    {
      key: 'month',
      header: 'Month',
      render: (payment) => formatReportMonth(payment.salaryMonth),
    },
    {
      key: 'base',
      header: 'Base',
      className: 'align-right',
      render: (payment) => formatCurrency(payment.baseSalary),
    },
    {
      key: 'allowances',
      header: 'Allowances',
      className: 'align-right',
      render: (payment) => formatCurrency(payment.allowances),
    },
    {
      key: 'deductions',
      header: 'Deductions',
      className: 'align-right',
      render: (payment) => formatCurrency(payment.deductions),
    },
    {
      key: 'net',
      header: 'Net Salary',
      className: 'align-right',
      render: (payment) => (
        <strong className="salary-net-cell">
          {formatCurrency(payment.netSalary)}
        </strong>
      ),
    },
    {
      key: 'mode',
      header: 'Mode',
      render: (payment) => payment.paymentMode,
    },
    {
      key: 'date',
      header: 'Date',
      render: (payment) => formatReportDate(payment.paymentDate),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (payment) => (
        <div className="table-actions">
          <button
            className="table-action-button"
            onClick={() => setSelectedPayment(payment)}
            type="button"
          >
            View
          </button>
          <button
            className="table-action-button"
            onClick={() => printPayment(payment)}
            type="button"
          >
            <Icon name="print" size={13} />
            Print
          </button>
          <button
            className="table-action-button table-action-button--danger"
            onClick={() => void deletePayment(payment)}
            type="button"
          >
            <Icon name="trash" size={13} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <section className="panel salary-slip-list">
        <div className="panel-heading">
          <div>
            <h3>Salary Paid Slips</h3>
            <p>Recent saved salary payments and printable payroll slips.</p>
          </div>
          <span className="neutral-badge">{payments.length} payments</span>
        </div>
        <DataTable
          columns={columns}
          emptyMessage="No salary payments have been recorded yet."
          getRowKey={(payment) => payment.id}
          rows={payments}
        />
      </section>

      {selectedPayment && (
        <div
          className="salary-slip-backdrop"
          onMouseDown={() => setSelectedPayment(null)}
          role="presentation"
        >
          <section
            aria-modal="true"
            className="salary-slip-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="salary-slip-toolbar">
              <div>
                <h2>Salary Paid Slip</h2>
                <p>{selectedPayment.salaryNo}</p>
              </div>
              <div>
                <button
                  className="secondary-button"
                  onClick={() => window.setTimeout(() => window.print(), 50)}
                  type="button"
                >
                  <Icon name="print" size={15} />
                  Print
                </button>
                <button
                  aria-label="Close salary slip"
                  className="icon-button"
                  onClick={() => setSelectedPayment(null)}
                  type="button"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            </div>
            <article className="salary-slip-print-area">
              <header className="official-document-header">
                <span className="official-document-mark">
                  <Icon name="school" size={28} />
                </span>
                <div>
                  <h1>{settings.schoolName}</h1>
                  {settings.address && <p>{settings.address}</p>}
                  {(settings.phone || settings.email) && (
                    <span>
                      {[settings.phone, settings.email]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  )}
                </div>
              </header>
              <div className="salary-slip-title">
                <div>
                  <span>Payroll</span>
                  <h2>Salary Paid Slip</h2>
                </div>
                <strong>{selectedPayment.salaryNo}</strong>
              </div>
              <dl className="salary-slip-details">
                <div>
                  <dt>Employee</dt>
                  <dd>{selectedPayment.employeeName}</dd>
                </div>
                <div>
                  <dt>Employee No.</dt>
                  <dd>{selectedPayment.employeeNo}</dd>
                </div>
                <div>
                  <dt>Designation</dt>
                  <dd>{selectedPayment.designation || '—'}</dd>
                </div>
                <div>
                  <dt>Department</dt>
                  <dd>{selectedPayment.department || '—'}</dd>
                </div>
                <div>
                  <dt>Salary Month</dt>
                  <dd>{formatReportMonth(selectedPayment.salaryMonth)}</dd>
                </div>
                <div>
                  <dt>Payment Date</dt>
                  <dd>{formatReportDate(selectedPayment.paymentDate)}</dd>
                </div>
              </dl>
              <table className="salary-slip-breakdown">
                <thead>
                  <tr>
                    <th>Particular</th>
                    <th>Type</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Base Salary</td>
                    <td>Earning</td>
                    <td>{formatCurrency(selectedPayment.baseSalary)}</td>
                  </tr>
                  <tr>
                    <td>Allowances</td>
                    <td>Earning</td>
                    <td>{formatCurrency(selectedPayment.allowances)}</td>
                  </tr>
                  <tr>
                    <td>Deductions</td>
                    <td>Deduction</td>
                    <td>− {formatCurrency(selectedPayment.deductions)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>Net Salary Paid</td>
                    <td>{formatCurrency(selectedPayment.netSalary)}</td>
                  </tr>
                </tfoot>
              </table>
              <div className="salary-slip-payment-meta">
                <span>
                  Payment Mode: <strong>{selectedPayment.paymentMode}</strong>
                </span>
                <span>
                  Paid By: <strong>{selectedPayment.paidBy || 'Admin'}</strong>
                </span>
              </div>
              {selectedPayment.notes && (
                <p className="salary-slip-notes">
                  <strong>Notes:</strong> {selectedPayment.notes}
                </p>
              )}
              <footer className="official-document-signatures salary-slip-signature">
                <div>
                  <span />
                  <strong>Employee Signature</strong>
                </div>
                <div>
                  <span />
                  <strong>Authorised Signatory</strong>
                </div>
              </footer>
            </article>
          </section>
        </div>
      )}
    </>
  )
}
