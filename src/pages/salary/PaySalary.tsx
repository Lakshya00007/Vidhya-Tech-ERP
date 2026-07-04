import { useMemo, useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { getErrorMessage, getSalaryErpApi } from '../../lib/erpApi'
import {
  formatCurrency,
  formatReportDate,
  formatReportMonth,
  getCurrentMonthValue,
  getTodayValue,
} from '../../lib/reportUtils'
import type {
  Employee,
  SalaryPayment,
  SalaryPaymentMode,
} from '../../types'
import type { SalaryNoticeProps } from './types'

interface PaySalaryProps extends SalaryNoticeProps {
  employees: Employee[]
  initialEmployeeId?: string
  initialMonth?: string
  onPaymentCreated: (payment: SalaryPayment) => void
  payments: SalaryPayment[]
}

const paymentModes: SalaryPaymentMode[] = [
  'Cash',
  'UPI',
  'Bank Transfer',
  'Cheque',
]

export function PaySalary({
  employees,
  initialEmployeeId,
  initialMonth,
  onNotice,
  onPaymentCreated,
  payments,
}: PaySalaryProps) {
  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === 'Active'),
    [employees],
  )
  const firstEmployee =
    activeEmployees.find((employee) => employee.id === initialEmployeeId) ??
    activeEmployees[0]
  const [employeeId, setEmployeeId] = useState(firstEmployee?.id ?? '')
  const [salaryMonth, setSalaryMonth] = useState(
    initialMonth || getCurrentMonthValue(),
  )
  const [baseSalary, setBaseSalary] = useState(firstEmployee?.salaryAmount ?? 0)
  const [allowances, setAllowances] = useState(0)
  const [deductions, setDeductions] = useState(0)
  const [paymentMode, setPaymentMode] =
    useState<SalaryPaymentMode>('Bank Transfer')
  const [paymentDate, setPaymentDate] = useState(getTodayValue)
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const selectedEmployee = activeEmployees.find(
    (employee) => employee.id === employeeId,
  )
  const duplicatePayment = payments.find(
    (payment) =>
      payment.employeeId === employeeId &&
      payment.salaryMonth === salaryMonth,
  )
  const netSalary = baseSalary + allowances - deductions

  const selectEmployee = (id: string) => {
    const employee = activeEmployees.find((item) => item.id === id)
    setEmployeeId(id)
    setBaseSalary(employee?.salaryAmount ?? 0)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedEmployee || duplicatePayment || netSalary < 0) return
    try {
      setIsSaving(true)
      const payment = await getSalaryErpApi().createSalaryPayment({
        employeeId: selectedEmployee.id,
        salaryMonth,
        baseSalary,
        allowances,
        deductions,
        paymentMode,
        paymentDate,
        notes,
      })
      onPaymentCreated(payment)
      onNotice({
        type: 'success',
        message: `${payment.salaryNo} was created for ${payment.employeeName}.`,
      })
      setAllowances(0)
      setDeductions(0)
      setNotes('')
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="salary-pay-layout">
      <form className="panel salary-payment-form" onSubmit={submit}>
        <div className="panel-heading">
          <div>
            <h3>Pay Salary</h3>
            <p>Record one verified payroll payment for an employee and month.</p>
          </div>
          <span className="neutral-badge">{formatReportMonth(salaryMonth)}</span>
        </div>
        <div className="salary-form-fields">
          <label className="form-field salary-form-full">
            <span>Employee</span>
            <select
              disabled={activeEmployees.length === 0}
              onChange={(event) => selectEmployee(event.target.value)}
              required
              value={employeeId}
            >
              {activeEmployees.length === 0 && (
                <option value="">No active employees available</option>
              )}
              {activeEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.employeeNo} · {employee.name} ·{' '}
                  {employee.designation || 'Staff'}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Salary Month</span>
            <input
              onChange={(event) => setSalaryMonth(event.target.value)}
              required
              type="month"
              value={salaryMonth}
            />
          </label>
          <label className="form-field">
            <span>Payment Date</span>
            <input
              onChange={(event) => setPaymentDate(event.target.value)}
              required
              type="date"
              value={paymentDate}
            />
          </label>
          <label className="form-field">
            <span>Base Salary</span>
            <input
              min="0"
              onChange={(event) =>
                setBaseSalary(Number(event.target.value) || 0)
              }
              required
              step="1"
              type="number"
              value={baseSalary}
            />
          </label>
          <label className="form-field">
            <span>Allowances</span>
            <input
              min="0"
              onChange={(event) =>
                setAllowances(Number(event.target.value) || 0)
              }
              step="1"
              type="number"
              value={allowances}
            />
          </label>
          <label className="form-field">
            <span>Deductions</span>
            <input
              min="0"
              onChange={(event) =>
                setDeductions(Number(event.target.value) || 0)
              }
              step="1"
              type="number"
              value={deductions}
            />
          </label>
          <label className="form-field">
            <span>Payment Mode</span>
            <select
              onChange={(event) =>
                setPaymentMode(event.target.value as SalaryPaymentMode)
              }
              value={paymentMode}
            >
              {paymentModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field salary-form-full">
            <span>Notes</span>
            <textarea
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional payment reference or payroll note"
              rows={3}
              value={notes}
            />
          </label>
        </div>

        {duplicatePayment && (
          <div className="salary-warning">
            <Icon name="clock" size={17} />
            <div>
              <strong>Salary for this employee and month is already paid.</strong>
              <span>
                {duplicatePayment.salaryNo} · Paid{' '}
                {formatReportDate(duplicatePayment.paymentDate)}
              </span>
            </div>
          </div>
        )}
        {netSalary < 0 && (
          <div className="salary-warning salary-warning--error">
            Deductions cannot exceed base salary and allowances.
          </div>
        )}

        <div className="salary-form-footer">
          <div>
            <span>Net Salary</span>
            <strong>{formatCurrency(Math.max(0, netSalary))}</strong>
          </div>
          <button
            className="primary-button"
            disabled={
              !selectedEmployee ||
              Boolean(duplicatePayment) ||
              netSalary < 0 ||
              isSaving
            }
            type="submit"
          >
            <Icon name="check" size={16} />
            {isSaving ? 'Saving Payment...' : 'Save Salary Payment'}
          </button>
        </div>
      </form>

      <aside className="panel salary-employee-summary">
        <div className="panel-heading">
          <div>
            <h3>Employee Details</h3>
            <p>Live information from the employee master.</p>
          </div>
        </div>
        {selectedEmployee ? (
          <>
            <div className="salary-employee-identity">
              <span>
                {selectedEmployee.name
                  .split(/\s+/)
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <div>
                <strong>{selectedEmployee.name}</strong>
                <small>{selectedEmployee.employeeNo}</small>
              </div>
            </div>
            <dl className="salary-employee-details">
              <div>
                <dt>Designation</dt>
                <dd>{selectedEmployee.designation || '—'}</dd>
              </div>
              <div>
                <dt>Department</dt>
                <dd>{selectedEmployee.department || '—'}</dd>
              </div>
              <div>
                <dt>Master Base Salary</dt>
                <dd>{formatCurrency(selectedEmployee.salaryAmount)}</dd>
              </div>
              <div>
                <dt>Joining Date</dt>
                <dd>
                  {selectedEmployee.joiningDate
                    ? formatReportDate(selectedEmployee.joiningDate)
                    : '—'}
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <div className="salary-side-empty">Create an active employee first.</div>
        )}
      </aside>
    </div>
  )
}
