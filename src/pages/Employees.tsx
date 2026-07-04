import { useEffect, useState } from 'react'
import { Icon, type IconName } from '../components/Icon'
import { getEmployeesErpApi, getErrorMessage } from '../lib/erpApi'
import type { Employee, SchoolSettings } from '../types'
import { EmployeeForm } from './employees/EmployeeForm'
import { EmployeeList } from './employees/EmployeeList'
import { JobLetter } from './employees/JobLetter'
import { StaffIdCards } from './employees/StaffIdCards'
import type { EmployeeNotice } from './employees/types'

export type EmployeesView = 'all' | 'add' | 'id-cards' | 'job-letter'

interface EmployeesProps {
  initialView?: EmployeesView
}

const tabs: { id: EmployeesView; label: string; icon: IconName }[] = [
  { id: 'all', label: 'All Employees', icon: 'user' },
  { id: 'add', label: 'Add New', icon: 'plus' },
  { id: 'id-cards', label: 'Staff ID Cards', icon: 'students' },
  { id: 'job-letter', label: 'Job Letter', icon: 'reports' },
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

export function Employees({ initialView = 'all' }: EmployeesProps) {
  const [activeView, setActiveView] = useState<EmployeesView>(initialView)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [settings, setSettings] = useState<SchoolSettings>(fallbackSettings)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [notice, setNotice] = useState<EmployeeNotice | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCurrent = true
    Promise.resolve()
      .then(() => {
        const api = getEmployeesErpApi()
        return Promise.all([api.getEmployees(), api.getSchoolSettings()])
      })
      .then(([employeeRows, schoolSettings]) => {
        if (!isCurrent) return
        setEmployees(employeeRows)
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

  const changeView = (view: EmployeesView) => {
    setActiveView(view)
    setNotice(null)
    if (view === 'add') setEditingEmployee(null)
  }

  const editEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setActiveView('add')
    setNotice(null)
  }

  const handleSaved = async () => {
    try {
      setEmployees(await getEmployeesErpApi().getEmployees())
      setEditingEmployee(null)
      setActiveView('all')
    } catch (error) {
      setNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  return (
    <div className="page-stack employees-page">
      <section className="page-header">
        <div>
          <h2>Employees</h2>
          <p>Manage staff records, printable identity cards and job letters.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => changeView('add')}
          type="button"
        >
          <Icon name="plus" size={16} />
          Add Employee
        </button>
      </section>

      <nav className="settings-tabs employee-tabs" aria-label="Employee sections">
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
          <h3>Loading employee records...</h3>
        </section>
      ) : (
        <>
          {activeView === 'all' && (
            <EmployeeList
              employees={employees}
              onEdit={editEmployee}
              onEmployeesChange={setEmployees}
              onNotice={setNotice}
            />
          )}
          {activeView === 'add' && (
            <EmployeeForm
              employee={editingEmployee}
              key={editingEmployee?.id ?? 'new-employee'}
              onCancelEdit={() => {
                setEditingEmployee(null)
                setActiveView('all')
              }}
              onNotice={setNotice}
              onSaved={() => void handleSaved()}
            />
          )}
          {activeView === 'id-cards' && (
            <StaffIdCards employees={employees} settings={settings} />
          )}
          {activeView === 'job-letter' && (
            <JobLetter employees={employees} settings={settings} />
          )}
        </>
      )}
    </div>
  )
}
