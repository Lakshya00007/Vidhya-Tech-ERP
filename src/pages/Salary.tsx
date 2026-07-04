import { useEffect, useState } from 'react'
import { Icon, type IconName } from '../components/Icon'
import { getErrorMessage, getSalaryErpApi } from '../lib/erpApi'
import type {
  Employee,
  SalaryPayment,
  SchoolSettings,
} from '../types'
import { PaySalary } from './salary/PaySalary'
import { SalaryReport } from './salary/SalaryReport'
import { SalarySheet } from './salary/SalarySheet'
import { SalarySlips } from './salary/SalarySlips'
import type { SalaryNotice } from './salary/types'

export type SalaryView = 'pay' | 'slips' | 'sheet' | 'report'

interface SalaryProps {
  initialView?: SalaryView
}

interface PayContext {
  employeeId: string
  salaryMonth: string
}

const tabs: { id: SalaryView; label: string; icon: IconName }[] = [
  { id: 'pay', label: 'Pay Salary', icon: 'wallet' },
  { id: 'slips', label: 'Salary Paid Slip', icon: 'reports' },
  { id: 'sheet', label: 'Salary Sheet', icon: 'students' },
  { id: 'report', label: 'Salary Report', icon: 'dashboard' },
]

const fallbackSettings: SchoolSettings = {
  id: 'school-profile',
  schoolName: 'Vidhya School ERP',
  address: '',
  phone: '',
  email: '',
  academicYear: '',
  receiptPrefix: '',
  createdAt: '',
  updatedAt: '',
}

export function Salary({ initialView = 'pay' }: SalaryProps) {
  const [activeView, setActiveView] = useState<SalaryView>(initialView)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payments, setPayments] = useState<SalaryPayment[]>([])
  const [settings, setSettings] = useState<SchoolSettings>(fallbackSettings)
  const [payContext, setPayContext] = useState<PayContext | null>(null)
  const [payRevision, setPayRevision] = useState(0)
  const [notice, setNotice] = useState<SalaryNotice | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCurrent = true
    Promise.resolve()
      .then(() => {
        const api = getSalaryErpApi()
        return Promise.all([
          api.getEmployees(),
          api.getSalaryPayments(),
          api.getSchoolSettings(),
        ])
      })
      .then(([employeeRows, salaryRows, schoolSettings]) => {
        if (!isCurrent) return
        setEmployees(employeeRows)
        setPayments(salaryRows)
        setSettings(schoolSettings)
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => {
      isCurrent = false
    }
  }, [])

  const changeView = (view: SalaryView) => {
    setActiveView(view)
    setNotice(null)
    if (view === 'pay') {
      setPayContext(null)
      setPayRevision((revision) => revision + 1)
    }
  }

  const payEmployee = (employee: Employee, salaryMonth: string) => {
    setPayContext({ employeeId: employee.id, salaryMonth })
    setPayRevision((revision) => revision + 1)
    setActiveView('pay')
    setNotice(null)
  }

  const addPayment = (payment: SalaryPayment) => {
    setPayments((current) => [
      payment,
      ...current.filter((item) => item.id !== payment.id),
    ])
  }

  return (
    <div className="page-stack salary-page">
      <section className="page-header">
        <div>
          <h2>Salary & Payroll</h2>
          <p>Record salary payments, print slips and review monthly payroll.</p>
        </div>
      </section>

      <nav className="settings-tabs salary-tabs" aria-label="Salary sections">
        {tabs.map((tab) => (
          <button
            className={`settings-tab${
              activeView === tab.id ? ' settings-tab--active' : ''
            }`}
            key={tab.id}
            onClick={() => changeView(tab.id)}
            type="button"
          >
            <Icon name={tab.icon} size={17} />
            {tab.label}
          </button>
        ))}
      </nav>

      {notice && (
        <div
          className={`inline-message${
            notice.type === 'error' ? ' inline-message--error' : ''
          }`}
        >
          <Icon name={notice.type === 'error' ? 'close' : 'check'} size={17} />
          <span>{notice.message}</span>
          <button
            aria-label="Dismiss message"
            onClick={() => setNotice(null)}
            type="button"
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      {isLoading ? (
        <section className="panel document-empty-state">
          <span className="loading-spinner" />
          <h3>Loading payroll records...</h3>
        </section>
      ) : (
        <>
          {activeView === 'pay' && (
            <PaySalary
              employees={employees}
              initialEmployeeId={payContext?.employeeId}
              initialMonth={payContext?.salaryMonth}
              key={`pay-${payRevision}`}
              onNotice={setNotice}
              onPaymentCreated={addPayment}
              payments={payments}
            />
          )}
          {activeView === 'slips' && (
            <SalarySlips
              onNotice={setNotice}
              onPaymentsChange={setPayments}
              payments={payments}
              settings={settings}
            />
          )}
          {activeView === 'sheet' && (
            <SalarySheet
              employees={employees}
              onPayEmployee={payEmployee}
              payments={payments}
              settings={settings}
            />
          )}
          {activeView === 'report' && (
            <SalaryReport onNotice={setNotice} settings={settings} />
          )}
        </>
      )}
    </div>
  )
}
