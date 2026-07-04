import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { formatDocumentDate, getTodayDateInput } from '../../lib/studentDocuments'
import type { SchoolSettings, Student } from '../../types'

interface AdmissionLetterProps {
  settings: SchoolSettings
  students: Student[]
}

export function AdmissionLetter({
  settings,
  students,
}: AdmissionLetterProps) {
  const activeStudents = students.filter((student) => student.status === 'Active')
  const [studentId, setStudentId] = useState(activeStudents[0]?.id ?? '')
  const [letterDate, setLetterDate] = useState(getTodayDateInput)
  const selectedStudent = activeStudents.find(
    (student) => student.id === studentId,
  )

  return (
    <div className="document-workspace">
      <section className="panel document-toolbar">
        <div className="document-toolbar__heading">
          <span className="document-toolbar__icon">
            <Icon name="reports" size={20} />
          </span>
          <div>
            <h3>Admission Letter</h3>
            <p>Generate a formal admission confirmation from the student record.</p>
          </div>
        </div>
        <div className="document-filter-grid document-filter-grid--letter">
          <label className="form-field">
            <span>Student</span>
            <select
              disabled={activeStudents.length === 0}
              onChange={(event) => setStudentId(event.target.value)}
              value={studentId}
            >
              {activeStudents.length === 0 && (
                <option value="">No active students available</option>
              )}
              {activeStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.admissionNo} · {student.name} · {student.className}
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
            disabled={!selectedStudent}
            onClick={() => window.setTimeout(() => window.print(), 50)}
            type="button"
          >
            <Icon name="print" size={16} />
            Print Admission Letter
          </button>
        </div>
      </section>

      {!selectedStudent ? (
        <section className="panel document-empty-state">
          <Icon name="students" size={28} />
          <h3>Create students first.</h3>
          <p>An admission letter requires an active student record.</p>
        </section>
      ) : (
        <section className="panel document-preview-shell document-preview-shell--paper">
          <div className="document-preview-label">
            <span>A4 print preview</span>
            <strong>{selectedStudent.admissionNo}</strong>
          </div>
          <article className="admission-letter-print-area">
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
              <span>Admission Confirmation</span>
              <h2>Admission Letter</h2>
            </div>
            <div className="official-document-meta">
              <span>
                <strong>Reference:</strong> ADM/{selectedStudent.admissionNo}
              </span>
              <span>
                <strong>Date:</strong> {formatDocumentDate(letterDate)}
              </span>
            </div>
            <div className="admission-letter__body">
              <p>To,</p>
              <p>
                <strong>{selectedStudent.guardianName || 'Parent / Guardian'}</strong>
                <br />
                {selectedStudent.address || 'Address as per school record'}
              </p>
              <h3>Subject: Confirmation of Admission</h3>
              <p>Dear Parent / Guardian,</p>
              <p>
                We are pleased to confirm the admission of{' '}
                <strong>{selectedStudent.name}</strong>, Admission No.{' '}
                <strong>{selectedStudent.admissionNo}</strong>, to Class{' '}
                <strong>
                  {selectedStudent.className}
                  {selectedStudent.section
                    ? `, Section ${selectedStudent.section}`
                    : ''}
                </strong>{' '}
                at {settings.schoolName}.
              </p>
              <p>
                The admission is recorded from{' '}
                <strong>
                  {formatDocumentDate(selectedStudent.admissionDate)}
                </strong>{' '}
                for the academic year{' '}
                <strong>{settings.academicYear || 'as recorded'}</strong>.
                Please retain this letter for your records and contact the school
                office if any student details require correction.
              </p>
              <p>We welcome the student and family to our school community.</p>
              <p>Yours sincerely,</p>
            </div>
            <footer className="official-document-signatures">
              <div>
                <span />
                <strong>Admissions Office</strong>
              </div>
              <div>
                <span />
                <strong>Principal</strong>
              </div>
            </footer>
          </article>
        </section>
      )}
    </div>
  )
}
