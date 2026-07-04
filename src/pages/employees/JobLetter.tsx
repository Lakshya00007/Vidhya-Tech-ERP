import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { formatCurrency } from '../../lib/reportUtils'
import {
  formatDocumentDate,
  getTodayDateInput,
} from '../../lib/studentDocuments'
import type { Employee, SchoolSettings } from '../../types'

interface JobLetterProps {
  employees: Employee[]
  settings: SchoolSettings
}

export function JobLetter({ employees, settings }: JobLetterProps) {
  const activeEmployees = employees.filter(
    (employee) => employee.status === 'Active',
  )
  const [employeeId, setEmployeeId] = useState(activeEmployees[0]?.id ?? '')
  const [letterDate, setLetterDate] = useState(getTodayDateInput)
  const selectedEmployee = activeEmployees.find(
    (employee) => employee.id === employeeId,
  )

  return (
    <div className="employee-document-workspace">
      <section className="panel document-toolbar employee-document-toolbar">
        <div className="document-toolbar__heading">
          <span className="document-toolbar__icon">
            <Icon name="reports" size={20} />
          </span>
          <div>
            <h3>Appointment / Job Letter</h3>
            <p>Generate a formal appointment letter from the employee record.</p>
          </div>
        </div>
        <div className="document-filter-grid document-filter-grid--letter">
          <label className="form-field">
            <span>Employee</span>
            <select
              disabled={activeEmployees.length === 0}
              onChange={(event) => setEmployeeId(event.target.value)}
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
            <span>Letter date</span>
            <input
              onChange={(event) => setLetterDate(event.target.value)}
              type="date"
              value={letterDate}
            />
          </label>
          <button
            className="primary-button document-print-button"
            disabled={!selectedEmployee}
            onClick={() => window.setTimeout(() => window.print(), 50)}
            type="button"
          >
            <Icon name="print" size={16} />
            Print Job Letter
          </button>
        </div>
      </section>

      {!selectedEmployee ? (
        <section className="panel document-empty-state">
          <Icon name="user" size={28} />
          <h3>Add an employee first.</h3>
          <p>A job letter requires an active employee record.</p>
        </section>
      ) : (
        <section className="panel document-preview-shell document-preview-shell--paper">
          <div className="document-preview-label">
            <span>A4 print preview</span>
            <strong>{selectedEmployee.employeeNo}</strong>
          </div>
          <article className="job-letter-print-area">
            <header className="official-document-header">
              <span className="official-document-mark">
                <Icon name="school" size={30} />
              </span>
              <div>
                <h1>{settings.schoolName}</h1>
                {settings.address && <p>{settings.address}</p>}
                {(settings.phone || settings.email) && (
                  <span>
                    {[settings.phone, settings.email].filter(Boolean).join(' · ')}
                  </span>
                )}
              </div>
            </header>
            <div className="official-document-title">
              <span>Human Resources</span>
              <h2>Appointment Letter</h2>
            </div>
            <div className="official-document-meta">
              <span>
                <strong>Reference:</strong> HR/{selectedEmployee.employeeNo}
              </span>
              <span>
                <strong>Date:</strong> {formatDocumentDate(letterDate)}
              </span>
            </div>
            <div className="job-letter__body">
              <p>To,</p>
              <p>
                <strong>{selectedEmployee.name}</strong>
                <br />
                {selectedEmployee.address || 'Address as per employee record'}
              </p>
              <h3>
                Subject: Appointment as{' '}
                {selectedEmployee.designation || 'Staff Member'}
              </h3>
              <p>Dear {selectedEmployee.name},</p>
              <p>
                We are pleased to appoint you as{' '}
                <strong>
                  {selectedEmployee.designation || 'Staff Member'}
                </strong>{' '}
                in the{' '}
                <strong>
                  {selectedEmployee.department || 'School Administration'}
                </strong>{' '}
                department at {settings.schoolName}.
              </p>
              <p>
                Your joining date is{' '}
                <strong>
                  {formatDocumentDate(selectedEmployee.joiningDate)}
                </strong>
                {selectedEmployee.salaryAmount > 0 && (
                  <>
                    , with a recorded monthly salary of{' '}
                    <strong>
                      {formatCurrency(selectedEmployee.salaryAmount)}
                    </strong>
                  </>
                )}
                . Your employment will be governed by the school’s applicable
                service rules, policies and professional conduct requirements.
              </p>
              <p>
                Please sign and return a copy of this letter as confirmation of
                acceptance. We look forward to your contribution to the school.
              </p>
              <p>Yours sincerely,</p>
            </div>
            <footer className="official-document-signatures job-letter-signatures">
              <div>
                <span />
                <strong>Employee Signature</strong>
              </div>
              <div>
                <span />
                <strong>Principal / Director</strong>
              </div>
            </footer>
          </article>
        </section>
      )}
    </div>
  )
}
