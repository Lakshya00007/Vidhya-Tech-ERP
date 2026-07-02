import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../components/DataTable'
import { Icon } from '../components/Icon'
import { classOptions, sectionOptions } from '../data/mockData'
import { getErpApi, getErrorMessage } from '../lib/erpApi'
import type { CreateStudentInput, Student } from '../types'

const emptyForm: CreateStudentInput = {
  admissionNo: '',
  name: '',
  className: '1',
  section: 'A',
  guardianName: '',
  mobile: '',
}

export function Students() {
  const [studentRows, setStudentRows] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<CreateStudentInput>(emptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadStudents = useCallback(async () => {
    try {
      setStudentRows(await getErpApi().getStudents())
      setError('')
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isCurrent = true

    Promise.resolve()
      .then(() => getErpApi().getStudents())
      .then((students) => {
        if (isCurrent) {
          setStudentRows(students)
          setError('')
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setError(getErrorMessage(loadError))
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [])

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return studentRows

    return studentRows.filter((student) =>
      [
        student.admissionNo,
        student.name,
        student.guardianName,
        student.mobile,
        `${student.className}-${student.section}`,
      ].some((value) => value.toLowerCase().includes(query)),
    )
  }, [search, studentRows])

  const handleDelete = async (student: Student) => {
    if (!window.confirm(`Remove ${student.name} from the active student list?`)) {
      return
    }

    try {
      const result = await getErpApi().deleteStudent(student.id)
      if (!result.success) {
        throw new Error('The student record could not be removed.')
      }
      setMessage(`${student.name} was removed from the active student list.`)
      setError('')
      await loadStudents()
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
      setMessage('')
    }
  }

  const columns: TableColumn<Student>[] = [
    {
      key: 'admission',
      header: 'Admission No.',
      render: (student) => <span className="table-primary">{student.admissionNo}</span>,
    },
    {
      key: 'student',
      header: 'Student Name',
      render: (student) => (
        <div className="person-cell">
          <span className="person-avatar person-avatar--blue">
            {student.name
              .split(' ')
              .map((name) => name[0])
              .join('')
              .slice(0, 2)}
          </span>
          <strong>{student.name}</strong>
        </div>
      ),
    },
    { key: 'class', header: 'Class', render: (student) => student.className },
    { key: 'section', header: 'Section', render: (student) => student.section || '—' },
    {
      key: 'guardian',
      header: 'Guardian',
      render: (student) => student.guardianName || '—',
    },
    { key: 'mobile', header: 'Mobile', render: (student) => student.mobile || '—' },
    {
      key: 'status',
      header: 'Status',
      render: (student) => (
        <span className={`status-badge status-badge--${student.status.toLowerCase()}`}>
          {student.status}
        </span>
      ),
    },
    {
      key: 'action',
      header: '',
      className: 'align-right',
      render: (student) => (
        <button
          className="row-action row-action--danger"
          type="button"
          aria-label={`Delete ${student.name}`}
          title="Delete student"
          onClick={() => void handleDelete(student)}
        >
          <Icon name="trash" size={15} />
        </button>
      ),
    },
  ]

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      const createdStudent = await getErpApi().createStudent(form)
      await loadStudents()
      setForm(emptyForm)
      setIsFormOpen(false)
      setMessage(`${createdStudent.name} was added successfully.`)
      setError('')
    } catch (saveError) {
      setError(getErrorMessage(saveError))
      setMessage('')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h2>Students</h2>
          <p>Manage admission records and student information.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => setIsFormOpen(true)}>
          <Icon name="plus" size={18} />
          Add Student
        </button>
      </section>

      {message && (
        <div className="inline-message">
          <Icon name="check" size={17} />
          <span>{message}</span>
          <button type="button" onClick={() => setMessage('')} aria-label="Dismiss message">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="inline-message inline-message--error">
          <Icon name="close" size={17} />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      <section className="panel">
        <div className="list-toolbar">
          <label className="search-field search-field--wide">
            <Icon name="search" size={18} />
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, admission number, guardian or mobile"
              type="search"
              value={search}
            />
          </label>
          <div className="record-count">
            <span>{filteredStudents.length}</span> students
          </div>
        </div>
        <DataTable
          columns={columns}
          getRowKey={(student) => student.id}
          rows={filteredStudents}
          emptyMessage={
            isLoading
              ? 'Loading student records...'
              : search
                ? 'No students match your search'
                : 'No students yet. Add the first admission record.'
          }
        />
        <div className="table-footer">
          <span>
            Showing {filteredStudents.length} of {studentRows.length} students
          </span>
          <div className="pagination">
            <button disabled type="button">Previous</button>
            <button className="pagination__active" type="button">1</button>
            <button disabled type="button">Next</button>
          </div>
        </div>
      </section>

      {isFormOpen && (
        <div className="drawer-backdrop" role="presentation" onMouseDown={() => setIsFormOpen(false)}>
          <aside
            aria-labelledby="add-student-title"
            className="form-drawer"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="drawer-header">
              <div>
                <h2 id="add-student-title">Add New Student</h2>
                <p>Enter basic admission and guardian details.</p>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setIsFormOpen(false)}
                aria-label="Close form"
              >
                <Icon name="close" size={19} />
              </button>
            </div>
            <form className="drawer-form" onSubmit={(event) => void handleSubmit(event)}>
              <label className="form-field">
                <span>Admission Number</span>
                <input
                  onChange={(event) => setForm({ ...form, admissionNo: event.target.value })}
                  placeholder="Auto-generated if left blank"
                  value={form.admissionNo}
                />
              </label>
              <label className="form-field">
                <span>Student Name *</span>
                <input
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Full name"
                  required
                  value={form.name}
                />
              </label>
              <div className="form-row">
                <label className="form-field">
                  <span>Class *</span>
                  <select
                    onChange={(event) => setForm({ ...form, className: event.target.value })}
                    value={form.className}
                  >
                    {classOptions.map((className) => (
                      <option key={className} value={className}>Class {className}</option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>Section</span>
                  <select
                    onChange={(event) => setForm({ ...form, section: event.target.value })}
                    value={form.section}
                  >
                    {sectionOptions.map((section) => (
                      <option key={section} value={section}>Section {section}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="form-field">
                <span>Guardian Name</span>
                <input
                  onChange={(event) => setForm({ ...form, guardianName: event.target.value })}
                  placeholder="Parent or guardian name"
                  value={form.guardianName}
                />
              </label>
              <label className="form-field">
                <span>Mobile Number</span>
                <input
                  onChange={(event) => setForm({ ...form, mobile: event.target.value })}
                  placeholder="10-digit mobile number"
                  type="tel"
                  value={form.mobile}
                />
              </label>
              <div className="form-note">
                <Icon name="check" size={17} />
                Additional student details can be added after creating the record.
              </div>
              <div className="drawer-actions">
                <button className="secondary-button" type="button" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </button>
                <button className="primary-button" disabled={isSaving} type="submit">
                  {isSaving ? 'Saving...' : 'Save Student'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  )
}
