import { useMemo, useState } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import {
  formatCurrency,
  formatGeneratedAt,
  formatReportDate,
  formatReportMonth,
  getCurrentMonthValue,
} from '../../lib/reportUtils'
import type { Employee, SalaryPayment, SchoolSettings } from '../../types'

interface SalarySheetProps {
  employees: Employee[]
  onPayEmployee: (employee: Employee, salaryMonth: string) => void
  payments: SalaryPayment[]
  settings: SchoolSettings
}

interface SalarySheetRow {
  employee: Employee
  payment: SalaryPayment | null
}

export function SalarySheet({
  employees,
  onPayEmployee,
  payments,
  settings,
}: SalarySheetProps) {
  const [salaryMonth, setSalaryMonth] = useState(getCurrentMonthValue)
  const rows = useMemo<SalarySheetRow[]>(
    () =>
      employees
        .filter((employee) => employee.status === 'Active')
        .map((employee) => ({
          employee,
          payment:
            payments.find(
              (payment) =>
                payment.employeeId === employee.id &&
                payment.salaryMonth === salaryMonth,
            ) ?? null,
        })),
    [employees, payments, salaryMonth],
  )
  const paidRows = rows.filter((row) => row.payment)
  const totalPaid = paidRows.reduce(
    (total, row) => total + (row.payment?.netSalary ?? 0),
    0,
  )

  const columns: TableColumn<SalarySheetRow>[] = [
    {
      key: 'employeeNo',
      header: 'Employee No.',
      render: (row) => (
        <strong className="table-primary">{row.employee.employeeNo}</strong>
      ),
    },
    {
      key: 'employee',
      header: 'Employee',
      render: (row) => (
        <div className="primary-cell">
          <strong>{row.employee.name}</strong>
          <span>
            {row.employee.designation || 'Staff'} ·{' '}
            {row.employee.department || 'No department'}
          </span>
        </div>
      ),
    },
    {
      key: 'base',
      header: 'Base Salary',
      className: 'align-right',
      render: (row) => formatCurrency(row.employee.salaryAmount),
    },
    {
      key: 'paid',
      header: 'Paid Amount',
      className: 'align-right',
      render: (row) =>
        row.payment ? formatCurrency(row.payment.netSalary) : '—',
    },
    {
      key: 'date',
      header: 'Payment Date',
      render: (row) =>
        row.payment ? formatReportDate(row.payment.paymentDate) : '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={`salary-sheet-status salary-sheet-status--${
            row.payment ? 'paid' : 'unpaid'
          }`}
        >
          {row.payment ? 'Paid' : 'Unpaid'}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      className: 'salary-sheet-action',
      render: (row) =>
        row.payment ? (
          <span className="salary-sheet-reference">{row.payment.salaryNo}</span>
        ) : (
          <button
            className="table-action-button"
            onClick={() => onPayEmployee(row.employee, salaryMonth)}
            type="button"
          >
            Pay Salary
          </button>
        ),
    },
  ]

  return (
    <div className="salary-sheet-workspace">
      <section className="panel salary-sheet-toolbar">
        <div>
          <h3>Monthly Salary Sheet</h3>
          <p>Review paid and unpaid employees for a payroll month.</p>
        </div>
        <label className="form-field form-field--compact">
          <span>Salary Month</span>
          <input
            onChange={(event) => setSalaryMonth(event.target.value)}
            type="month"
            value={salaryMonth}
          />
        </label>
        <button
          className="secondary-button"
          disabled={rows.length === 0}
          onClick={() => window.setTimeout(() => window.print(), 50)}
          type="button"
        >
          <Icon name="print" size={15} />
          Print Salary Sheet
        </button>
      </section>

      <section className="panel salary-sheet-print-area">
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
            <h1>Salary Sheet</h1>
            <p>{formatReportMonth(salaryMonth)}</p>
            <span>Generated {formatGeneratedAt()}</span>
          </div>
        </header>
        <div className="salary-sheet-summary">
          <div>
            <span>Active Employees</span>
            <strong>{rows.length}</strong>
          </div>
          <div>
            <span>Paid</span>
            <strong>{paidRows.length}</strong>
          </div>
          <div>
            <span>Unpaid</span>
            <strong>{rows.length - paidRows.length}</strong>
          </div>
          <div>
            <span>Net Paid</span>
            <strong>{formatCurrency(totalPaid)}</strong>
          </div>
        </div>
        <DataTable
          columns={columns}
          emptyMessage="No active employees found."
          getRowKey={(row) => row.employee.id}
          rows={rows}
        />
        <footer className="salary-report-footer">
          <span>{paidRows.length} paid employee(s)</span>
          <strong>Total paid: {formatCurrency(totalPaid)}</strong>
        </footer>
      </section>
    </div>
  )
}
