import { useState } from 'react'
import { DataTable, type TableColumn } from '../components/DataTable'
import { Icon } from '../components/Icon'
import { exams, markEntries as initialMarkEntries } from '../data/mockData'
import type { Exam, MarkEntry } from '../types'

const examColumns: TableColumn<Exam>[] = [
  {
    key: 'exam',
    header: 'Examination',
    render: (exam) => (
      <div>
        <strong className="table-block">{exam.name}</strong>
        <span className="table-secondary">{exam.classes}</span>
      </div>
    ),
  },
  { key: 'start', header: 'Start Date', render: (exam) => exam.startDate },
  { key: 'end', header: 'End Date', render: (exam) => exam.endDate },
  {
    key: 'status',
    header: 'Status',
    render: (exam) => (
      <span className={`status-badge status-badge--${exam.status.toLowerCase().replace(' ', '-')}`}>
        {exam.status}
      </span>
    ),
  },
  {
    key: 'action',
    header: '',
    className: 'align-right',
    render: () => (
      <button className="row-action" type="button" aria-label="View examination">
        <Icon name="chevron" size={16} />
      </button>
    ),
  },
]

const getGrade = (marks: number) => {
  if (marks >= 90) return 'A+'
  if (marks >= 80) return 'A'
  if (marks >= 70) return 'B+'
  if (marks >= 60) return 'B'
  if (marks >= 50) return 'C'
  return 'D'
}

export function Exams() {
  const [markEntries, setMarkEntries] = useState(initialMarkEntries)
  const [subject, setSubject] = useState('Mathematics')
  const [message, setMessage] = useState('')

  const updateMarks = (id: string, marks: number) => {
    const safeMarks = Math.min(100, Math.max(0, marks))
    setMarkEntries((current) =>
      current.map((entry) =>
        entry.id === id
          ? { ...entry, marksObtained: safeMarks, grade: getGrade(safeMarks) }
          : entry,
      ),
    )
  }

  const markColumns: TableColumn<MarkEntry>[] = [
    { key: 'roll', header: 'Roll No.', render: (entry) => entry.rollNo },
    {
      key: 'student',
      header: 'Student Name',
      render: (entry) => (
        <div className="person-cell">
          <span className="person-avatar person-avatar--blue">
            {entry.studentName.split(' ').map((name) => name[0]).join('').slice(0, 2)}
          </span>
          <strong>{entry.studentName}</strong>
        </div>
      ),
    },
    {
      key: 'maximum',
      header: 'Maximum Marks',
      render: (entry) => entry.maximumMarks,
    },
    {
      key: 'obtained',
      header: 'Marks Obtained',
      render: (entry) => (
        <input
          aria-label={`Marks for ${entry.studentName}`}
          className="marks-input"
          max={entry.maximumMarks}
          min="0"
          onChange={(event) => updateMarks(entry.id, Number(event.target.value))}
          type="number"
          value={entry.marksObtained}
        />
      ),
    },
    {
      key: 'grade',
      header: 'Grade',
      render: (entry) => <span className="grade-badge">{entry.grade}</span>,
    },
  ]

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h2>Examinations</h2>
          <p>Manage examinations, marks entry and student results.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => setMessage('New examination setup will be available in the next stage.')}>
          <Icon name="plus" size={18} />
          Create Exam
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

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Exam Schedule</h3>
            <p>Current and recently completed examinations</p>
          </div>
        </div>
        <DataTable columns={examColumns} getRowKey={(exam) => exam.id} rows={exams} />
      </section>

      <section className="panel">
        <div className="panel-heading marks-heading">
          <div>
            <h3>Marks Entry</h3>
            <p>Unit Test I · Class 10-A</p>
          </div>
          <div className="marks-controls">
            <label className="inline-select">
              <span>Subject</span>
              <select value={subject} onChange={(event) => setSubject(event.target.value)}>
                <option>Mathematics</option>
                <option>Science</option>
                <option>English</option>
                <option>Social Science</option>
                <option>Hindi</option>
              </select>
            </label>
            <button
              className="secondary-button secondary-button--small"
              type="button"
              onClick={() => setMessage(`${subject} marks have been saved.`)}
            >
              Save Marks
            </button>
            <button
              className="primary-button primary-button--small"
              type="button"
              onClick={() => setMessage('Marksheet preview generated for Class 10-A.')}
            >
              <Icon name="download" size={16} />
              Generate Marksheet
            </button>
          </div>
        </div>
        <DataTable
          columns={markColumns}
          getRowKey={(entry) => entry.id}
          rows={markEntries}
        />
      </section>
    </div>
  )
}
