import { useEffect, useMemo, useState } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getErrorMessage, getSalaryErpApi } from '../../lib/erpApi'
import {
  exportCsv,
  formatCurrency,
  formatGeneratedAt,
  formatReportDate,
  formatReportMonth,
  getCurrentMonthValue,
  getMonthDateRange,
} from '../../lib/reportUtils'
import type {
  SalaryPayment,
  SalaryPaymentMode,
  SchoolSettings,
} from '../../types'
import type { SalaryNoticeProps } from './types'

interface SalaryReportProps extends SalaryNoticeProps {
  settings: SchoolSettings
}

const paymentModes: SalaryPaymentMode[] = [
  'Cash',
  'UPI',
  'Bank Transfer',
  'Cheque',
]

export function SalaryReport({
  onNotice,
  settings,
}: SalaryReportProps) {
  const currentRange = getMonthDateRange(getCurrentMonthValue())
  const [startDate, setStartDate] = useState(currentRange?.startDate ?? '')
  const [endDate, setEndDate] = useState(currentRange?.endDate ?? '')
  const [department, setDepartment] = useState('')
  const [payments, setPayments] = useState<SalaryPayment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!startDate || !endDate) return
    let isCurrent = true
    Promise.resolve()
      .then(() =>
        getSalaryErpApi().getSalaryPaymentsByDateRange(startDate, endDate),
      )
      .then((rows) => {
        if (isCurrent) setPayments(rows)
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setPayments([])
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => {
      isCurrent = false
    }
  }, [endDate, onNotice, startDate])

  const departments = useMemo(
    () =>
      [...new Set(payments.map((payment) => payment.department).filter(Boolean))]
        .sort((left, right) => left.localeCompare(right)),
    [payments],
  )
  const visiblePayments = useMemo(
    () =>
      payments.filter(
        (payment) => !department || payment.department === department,
      ),
    [department, payments],
  )
  const totals = visiblePayments.reduce(
    (summary, payment) => ({
      base: summary.base + payment.baseSalary,
      allowances: summary.allowances + payment.allowances,
      deductions: summary.deductions + payment.deductions,
      net: summary.net + payment.netSalary,
    }),
    { base: 0, allowances: 0, deductions: 0, net: 0 },
  )

  const columns: TableColumn<SalaryPayment>[] = [
    {
      key: 'salaryNo',
      header: 'Salary No.',
      render: (payment) => (
        <strong className="table-primary">{payment.salaryNo}</strong>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (payment) => formatReportDate(payment.paymentDate),
    },
    {
      key: 'employee',
      header: 'Employee',
      render: (payment) => (
        <div className="primary-cell">
          <strong>{payment.employeeName}</strong>
          <span>{payment.employeeNo}</span>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (payment) => payment.department || '—',
    },
    {
      key: 'month',
      header: 'Salary Month',
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
      header: 'Net Paid',
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
  ]

  const exportReport = () => {
    exportCsv(
      `salary-report-${startDate}-to-${endDate}.csv`,
      [
        'Salary No',
        'Payment Date',
        'Employee No',
        'Employee Name',
        'Designation',
        'Department',
        'Salary Month',
        'Base Salary',
        'Allowances',
        'Deductions',
        'Net Salary',
        'Payment Mode',
        'Paid By',
      ],
      visiblePayments.map((payment) => [
        payment.salaryNo,
        payment.paymentDate,
        payment.employeeNo,
        payment.employeeName,
        payment.designation,
        payment.department,
        payment.salaryMonth,
        payment.baseSalary,
        payment.allowances,
        payment.deductions,
        payment.netSalary,
        payment.paymentMode,
        payment.paidBy,
      ]),
    )
  }

  return (
    <div className="salary-report-workspace">
      <section className="panel salary-report-toolbar">
        <div>
          <h3>Salary Report</h3>
          <p>Review payroll totals by payment date and department.</p>
        </div>
        <div className="salary-report-filters">
          <label className="form-field form-field--compact">
            <span>Start Date</span>
            <input
              onChange={(event) => {
                setIsLoading(true)
                setStartDate(event.target.value)
              }}
              type="date"
              value={startDate}
            />
          </label>
          <label className="form-field form-field--compact">
            <span>End Date</span>
            <input
              onChange={(event) => {
                setIsLoading(true)
                setEndDate(event.target.value)
              }}
              type="date"
              value={endDate}
            />
          </label>
          <label className="form-field form-field--compact">
            <span>Department</span>
            <select
              onChange={(event) => setDepartment(event.target.value)}
              value={department}
            >
              <option value="">All departments</option>
              {departments.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="salary-report-actions">
          <button
            className="secondary-button"
            disabled={visiblePayments.length === 0}
            onClick={exportReport}
            type="button"
          >
            <Icon name="download" size={15} />
            Export CSV
          </button>
          <button
            className="secondary-button"
            disabled={visiblePayments.length === 0}
            onClick={() => window.setTimeout(() => window.print(), 50)}
            type="button"
          >
            <Icon name="print" size={15} />
            Print
          </button>
        </div>
      </section>

      <section className="panel salary-report-print-area">
        <header className="salary-report-header">
          <div>
            <span className="salary-report-mark">
              <Icon name="school" size={22} />
            </span>
            <div>
              <h2>{settings.schoolName}</h2>
              <p>{settings.address}</p>
            </div>
          </div>
          <div>
            <h1>Salary Report</h1>
            <p>
              {formatReportDate(startDate)} to {formatReportDate(endDate)}
              {department ? ` · ${department}` : ' · All departments'}
            </p>
            <span>Generated {formatGeneratedAt()}</span>
          </div>
        </header>
        <div className="salary-report-metrics">
          <div>
            <span>Total Salary Paid</span>
            <strong>{formatCurrency(totals.base)}</strong>
          </div>
          <div>
            <span>Total Allowances</span>
            <strong>{formatCurrency(totals.allowances)}</strong>
          </div>
          <div>
            <span>Total Deductions</span>
            <strong>{formatCurrency(totals.deductions)}</strong>
          </div>
          <div>
            <span>Net Total</span>
            <strong>{formatCurrency(totals.net)}</strong>
          </div>
        </div>
        <div className="salary-mode-breakdown">
          {paymentModes.map((mode) => (
            <span key={mode}>
              {mode}
              <strong>
                {formatCurrency(
                  visiblePayments
                    .filter((payment) => payment.paymentMode === mode)
                    .reduce((total, payment) => total + payment.netSalary, 0),
                )}
              </strong>
            </span>
          ))}
        </div>
        <DataTable
          columns={columns}
          emptyMessage={
            isLoading
              ? 'Loading salary payments...'
              : 'No salary payments found for this date range.'
          }
          getRowKey={(payment) => payment.id}
          rows={visiblePayments}
        />
        <footer className="salary-report-footer">
          <span>{visiblePayments.length} salary payment(s)</span>
          <strong>Net total: {formatCurrency(totals.net)}</strong>
        </footer>
      </section>
    </div>
  )
}
