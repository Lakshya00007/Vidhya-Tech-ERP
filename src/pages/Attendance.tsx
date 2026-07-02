import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { attendanceRecords, classOptions, sectionOptions } from '../data/mockData'
import type { AttendanceStatus } from '../types'

export function Attendance() {
  const [selectedClass, setSelectedClass] = useState('10')
  const [selectedSection, setSelectedSection] = useState('A')
  const [selectedDate, setSelectedDate] = useState('2026-07-03')
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(
    Object.fromEntries(attendanceRecords.map((record) => [record.id, record.status])),
  )
  const [saved, setSaved] = useState(false)

  const summary = useMemo(() => {
    const values = Object.values(statuses)
    return {
      present: values.filter((status) => status === 'Present').length,
      absent: values.filter((status) => status === 'Absent').length,
      leave: values.filter((status) => status === 'Leave').length,
    }
  }, [statuses])

  const setStatus = (id: string, status: AttendanceStatus) => {
    setStatuses((current) => ({ ...current, [id]: status }))
    setSaved(false)
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h2>Daily Attendance</h2>
          <p>Mark and review student attendance by class.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => setSaved(true)}>
          <Icon name="check" size={18} />
          Save Attendance
        </button>
      </section>

      {saved && (
        <div className="inline-message">
          <Icon name="check" size={17} />
          <span>Attendance saved for Class {selectedClass}-{selectedSection}.</span>
          <button type="button" onClick={() => setSaved(false)} aria-label="Dismiss message">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      <section className="panel filter-panel">
        <div className="filter-group">
          <label className="form-field form-field--compact">
            <span>Class</span>
            <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}>
              {classOptions.map((className) => (
                <option key={className} value={className}>Class {className}</option>
              ))}
            </select>
          </label>
          <label className="form-field form-field--compact">
            <span>Section</span>
            <select value={selectedSection} onChange={(event) => setSelectedSection(event.target.value)}>
              {sectionOptions.map((section) => (
                <option key={section} value={section}>Section {section}</option>
              ))}
            </select>
          </label>
          <label className="form-field form-field--date">
            <span>Date</span>
            <input value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} type="date" />
          </label>
        </div>
        <div className="attendance-summary">
          <span><i className="summary-dot summary-dot--present" />Present <strong>{summary.present}</strong></span>
          <span><i className="summary-dot summary-dot--absent" />Absent <strong>{summary.absent}</strong></span>
          <span><i className="summary-dot summary-dot--leave" />Leave <strong>{summary.leave}</strong></span>
        </div>
      </section>

      <section className="panel attendance-panel">
        <div className="panel-heading">
          <div>
            <h3>Class {selectedClass}-{selectedSection} Register</h3>
            <p>{attendanceRecords.length} students · Friday, 3 July 2026</p>
          </div>
          <button
            className="secondary-button secondary-button--small"
            type="button"
            onClick={() =>
              setStatuses(
                Object.fromEntries(attendanceRecords.map((record) => [record.id, 'Present'])),
              )
            }
          >
            Mark All Present
          </button>
        </div>
        <div className="table-scroll">
          <table className="data-table attendance-table">
            <thead>
              <tr>
                <th>Roll No.</th>
                <th>Admission No.</th>
                <th>Student Name</th>
                <th>Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map((record) => (
                <tr key={record.id}>
                  <td>{record.rollNo}</td>
                  <td><span className="table-primary">{record.admissionNo}</span></td>
                  <td>
                    <div className="person-cell">
                      <span className="person-avatar person-avatar--blue">
                        {record.studentName.split(' ').map((name) => name[0]).join('').slice(0, 2)}
                      </span>
                      <strong>{record.studentName}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="attendance-selector">
                      {(['Present', 'Absent', 'Leave'] as AttendanceStatus[]).map((status) => (
                        <button
                          className={`attendance-option attendance-option--${status.toLowerCase()}${statuses[record.id] === status ? ' attendance-option--selected' : ''}`}
                          key={status}
                          onClick={() => setStatus(record.id, status)}
                          type="button"
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
