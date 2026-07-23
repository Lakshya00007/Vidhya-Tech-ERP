import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { ManagedImagePreview } from '../../components/ManagedImage'
import { getStudentInitials } from '../../lib/studentDocuments'
import type {
  ClassItem,
  SchoolSettings,
  SectionItem,
  Student,
} from '../../types'

interface StudentIdCardsProps {
  classes: ClassItem[]
  sections: SectionItem[]
  settings: SchoolSettings
  students: Student[]
}

function StudentIdCard({
  settings,
  student,
}: {
  settings: SchoolSettings
  student: Student
}) {
  return (
    <article className="student-id-card">
      <header className="student-id-card__header">
        <span className="student-id-card__school-mark">
          <ManagedImagePreview
            alt="School logo"
            assetKey={settings.logoAssetKey}
            fallback={<Icon name="school" size={18} />}
          />
        </span>
        <div>
          <strong>{settings.schoolName}</strong>
          <span>Student Identity Card</span>
        </div>
      </header>
      <div className="student-id-card__body">
        <div className="student-id-card__photo">
          <ManagedImagePreview
            alt={`${student.name} photo`}
            assetKey={student.photoAssetKey}
            fallback={
              <>
                <span>{getStudentInitials(student.name) || 'ST'}</span>
                <small>Photo</small>
              </>
            }
          />
        </div>
        <div className="student-id-card__details">
          <h3>{student.name}</h3>
          <dl>
            <div>
              <dt>Admission No.</dt>
              <dd>{student.admissionNo}</dd>
            </div>
            <div>
              <dt>Class / Section</dt>
              <dd>
                {student.className}
                {student.section ? ` / ${student.section}` : ''}
              </dd>
            </div>
            <div>
              <dt>Guardian</dt>
              <dd>{student.guardianName || '—'}</dd>
            </div>
            <div>
              <dt>Mobile</dt>
              <dd>{student.mobile || '—'}</dd>
            </div>
          </dl>
        </div>
      </div>
      {student.address && (
        <p className="student-id-card__address">
          <strong>Address:</strong> {student.address}
        </p>
      )}
      <footer className="student-id-card__footer">
        <span>Academic Year: {settings.academicYear || '—'}</span>
        <strong>Principal</strong>
      </footer>
    </article>
  )
}

export function StudentIdCards({
  classes,
  sections,
  settings,
  students,
}: StudentIdCardsProps) {
  const activeClasses = classes.filter((item) => item.status === 'Active')
  const [className, setClassName] = useState(activeClasses[0]?.name ?? '')
  const [section, setSection] = useState('')
  const [studentId, setStudentId] = useState('all')

  const availableSections = useMemo(
    () =>
      sections.filter(
        (item) =>
          item.status === 'Active' &&
          item.className === className,
      ),
    [className, sections],
  )
  const availableStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          student.status === 'Active' &&
          student.className === className &&
          (!section || student.section === section),
      ),
    [className, section, students],
  )
  const printableStudents =
    studentId === 'all'
      ? availableStudents
      : availableStudents.filter((student) => student.id === studentId)

  const selectClass = (value: string) => {
    setClassName(value)
    setSection('')
    setStudentId('all')
  }

  const selectSection = (value: string) => {
    setSection(value)
    setStudentId('all')
  }

  return (
    <div className="document-workspace">
      <section className="panel document-toolbar">
        <div className="document-toolbar__heading">
          <span className="document-toolbar__icon">
            <Icon name="students" size={20} />
          </span>
          <div>
            <h3>Student ID Cards</h3>
            <p>Print one card or arrange all selected students on an A4 sheet.</p>
          </div>
        </div>
        <div className="document-filter-grid">
          <label className="form-field">
            <span>Class</span>
            <select
              disabled={activeClasses.length === 0}
              onChange={(event) => selectClass(event.target.value)}
              value={className}
            >
              {activeClasses.length === 0 && (
                <option value="">No classes available</option>
              )}
              {activeClasses.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Section</span>
            <select
              disabled={!className}
              onChange={(event) => selectSection(event.target.value)}
              value={section}
            >
              <option value="">All sections</option>
              {availableSections.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Student</span>
            <select
              disabled={availableStudents.length === 0}
              onChange={(event) => setStudentId(event.target.value)}
              value={studentId}
            >
              <option value="all">All students ({availableStudents.length})</option>
              {availableStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.admissionNo} · {student.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="primary-button document-print-button"
            disabled={printableStudents.length === 0}
            onClick={() => window.setTimeout(() => window.print(), 50)}
            type="button"
          >
            <Icon name="print" size={16} />
            Print ID Card{printableStudents.length === 1 ? '' : 's'}
          </button>
        </div>
      </section>

      {activeClasses.length === 0 ? (
        <section className="panel document-empty-state">
          <Icon name="building" size={28} />
          <h3>Create classes from Settings first.</h3>
          <p>ID cards can be generated after students are assigned to a class.</p>
        </section>
      ) : printableStudents.length === 0 ? (
        <section className="panel document-empty-state">
          <Icon name="students" size={28} />
          <h3>No students found</h3>
          <p>No active students match the selected class and section.</p>
        </section>
      ) : (
        <section className="panel document-preview-shell">
          <div className="document-preview-label">
            <span>Print preview</span>
            <strong>{printableStudents.length} card(s)</strong>
          </div>
          <div className="id-card-print-area">
            {printableStudents.map((student) => (
              <StudentIdCard
                key={student.id}
                settings={settings}
                student={student}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
