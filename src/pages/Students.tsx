import { useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../components/DataTable'
import { Icon } from '../components/Icon'
import { classOptions, sectionOptions, students as initialStudents } from '../data/mockData'
import type { Student } from '../types'

const emptyForm = {
  admissionNo: '',
  name: '',
  className: '1',
  section: 'A',
  guardian: '',
  mobile: '',
}

export function Students() {
  const [studentRows, setStudentRows] = useState(initialStudents)
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return studentRows

    return studentRows.filter((student) =>
      [
        student.admissionNo,
        student.name,
        student.guardian,
        student.mobile,
        `${student.className}-${student.section}`,
      ].some((value) => value.toLowerCase().includes(query)),
    )
  }, [search, studentRows])

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
    {
      key: 'class',
      header: 'Class',
      render: (student) => student.className,
    },
    { key: 'section', header: 'Section', render: (student) => student.section },
    { key: 'guardian', header: 'Guardian', render: (student) => student.guardian },
    { key: 'mobile', header: 'Mobile', render: (student) => student.mobile },
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
      render: () => (
        <button className="row-action" type="button" aria-label="Open student details">
          <Icon name="chevron" size={16} />
        </button>
      ),
    },
  ]

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const newStudent: Student = {
      id: `student-${Date.now()}`,
      ...form,
      admissionNo: form.admissionNo || `VSE-2026-${String(studentRows.length + 143).padStart(4, '0')}`,
      status: 'Active',
    }
    setStudentRows((current) => [newStudent, ...current])
    setForm(emptyForm)
    setIsFormOpen(false)
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
          emptyMessage="No students match your search"
        />
        <div className="table-footer">
          <span>
            Showing {filteredStudents.length} of {studentRows.length} students
          </span>
          <div className="pagination">
            <button disabled type="button">Previous</button>
            <button className="pagination__active" type="button">1</button>
            <button type="button">2</button>
            <button type="button">Next</button>
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
            <form className="drawer-form" onSubmit={handleSubmit}>
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
                  <span>Section *</span>
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
                <span>Guardian Name *</span>
                <input
                  onChange={(event) => setForm({ ...form, guardian: event.target.value })}
                  placeholder="Parent or guardian name"
                  required
                  value={form.guardian}
                />
              </label>
              <label className="form-field">
                <span>Mobile Number *</span>
                <input
                  onChange={(event) => setForm({ ...form, mobile: event.target.value })}
                  placeholder="10-digit mobile number"
                  required
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
                <button className="primary-button" type="submit">Save Student</button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  )
}
