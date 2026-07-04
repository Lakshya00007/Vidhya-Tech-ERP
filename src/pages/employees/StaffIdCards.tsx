import { useState } from 'react'
import { Icon } from '../../components/Icon'
import {
  formatDocumentDate,
  getStudentInitials,
} from '../../lib/studentDocuments'
import type { Employee, SchoolSettings } from '../../types'

interface StaffIdCardsProps {
  employees: Employee[]
  settings: SchoolSettings
}

function StaffIdCard({
  employee,
  settings,
}: {
  employee: Employee
  settings: SchoolSettings
}) {
  return (
    <article className="staff-id-card">
      <header className="staff-id-card__header">
        <span className="staff-id-card__school-mark">
          <Icon name="school" size={18} />
        </span>
        <div>
          <strong>{settings.schoolName}</strong>
          <span>Staff Identity Card</span>
        </div>
      </header>
      <div className="staff-id-card__body">
        <div className="staff-id-card__photo">
          <span>{getStudentInitials(employee.name) || 'ST'}</span>
          <small>Photo</small>
        </div>
        <div className="staff-id-card__details">
          <h3>{employee.name}</h3>
          <strong>{employee.designation || 'Staff Member'}</strong>
          <dl>
            <div>
              <dt>Employee No.</dt>
              <dd>{employee.employeeNo}</dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>{employee.department || '—'}</dd>
            </div>
            <div>
              <dt>Mobile</dt>
              <dd>{employee.mobile || '—'}</dd>
            </div>
            <div>
              <dt>Joining Date</dt>
              <dd>{formatDocumentDate(employee.joiningDate)}</dd>
            </div>
          </dl>
        </div>
      </div>
      <footer className="staff-id-card__footer">
        <span>Academic Year: {settings.academicYear || '—'}</span>
        <strong>Authorised Signatory</strong>
      </footer>
    </article>
  )
}

export function StaffIdCards({
  employees,
  settings,
}: StaffIdCardsProps) {
  const activeEmployees = employees.filter(
    (employee) => employee.status === 'Active',
  )
  const [employeeId, setEmployeeId] = useState('all')
  const printableEmployees =
    employeeId === 'all'
      ? activeEmployees
      : activeEmployees.filter((employee) => employee.id === employeeId)

  return (
    <div className="employee-document-workspace">
      <section className="panel document-toolbar employee-document-toolbar">
        <div className="document-toolbar__heading">
          <span className="document-toolbar__icon">
            <Icon name="user" size={20} />
          </span>
          <div>
            <h3>Staff ID Cards</h3>
            <p>Print one staff card or arrange all active staff on A4 sheets.</p>
          </div>
        </div>
        <div className="employee-id-filter">
          <label className="form-field">
            <span>Employee</span>
            <select
              disabled={activeEmployees.length === 0}
              onChange={(event) => setEmployeeId(event.target.value)}
              value={employeeId}
            >
              <option value="all">
                All active employees ({activeEmployees.length})
              </option>
              {activeEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.employeeNo} · {employee.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="primary-button document-print-button"
            disabled={printableEmployees.length === 0}
            onClick={() => window.setTimeout(() => window.print(), 50)}
            type="button"
          >
            <Icon name="print" size={16} />
            Print Staff ID Card{printableEmployees.length === 1 ? '' : 's'}
          </button>
        </div>
      </section>

      {printableEmployees.length === 0 ? (
        <section className="panel document-empty-state">
          <Icon name="user" size={28} />
          <h3>No active employees found</h3>
          <p>Add an active employee before generating staff ID cards.</p>
        </section>
      ) : (
        <section className="panel document-preview-shell">
          <div className="document-preview-label">
            <span>Print preview</span>
            <strong>{printableEmployees.length} card(s)</strong>
          </div>
          <div className="staff-id-card-print-area">
            {printableEmployees.map((employee) => (
              <StaffIdCard
                employee={employee}
                key={employee.id}
                settings={settings}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
