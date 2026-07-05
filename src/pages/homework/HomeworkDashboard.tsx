import { useMemo, useState } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { formatReportDate, getTodayValue } from '../../lib/reportUtils'
import type { Homework } from '../../types'
import type { HomeworkChildProps } from './types'

interface HomeworkDashboardProps extends HomeworkChildProps {
  onEdit: (homework: Homework) => void
}

export function HomeworkDashboard({
  data,
  onEdit,
}: HomeworkDashboardProps) {
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [homeworkDate, setHomeworkDate] = useState('')
  const today = getTodayValue()
  const sections = data.sections.filter(
    (item) => item.status === 'Active' && item.className === className,
  )
  const subjects = data.subjects.filter(
    (item) =>
      item.status === 'Active' && (!className || item.className === className),
  )
  const filtered = useMemo(
    () =>
      data.homework.filter(
        (item) =>
          (!className || item.className === className) &&
          (!section || !item.section || item.section === section) &&
          (!subjectId || item.subjectId === subjectId) &&
          (!homeworkDate || item.homeworkDate === homeworkDate),
      ),
    [className, data.homework, homeworkDate, section, subjectId],
  )
  const summary = {
    total: filtered.length,
    active: filtered.filter((item) => item.status === 'Active').length,
    dueToday: filtered.filter((item) => item.dueDate === today).length,
    pending: filtered.reduce(
      (total, item) => total + item.pendingSubmissionCount,
      0,
    ),
  }

  const columns: TableColumn<Homework>[] = [
    {
      key: 'title',
      header: 'Homework',
      render: (item) => (
        <div className="primary-cell">
          <strong>{item.title}</strong>
          <span>{item.subjectName}</span>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class / Section',
      render: (item) =>
        `${item.className} / ${item.section || 'All Sections'}`,
    },
    {
      key: 'teacher',
      header: 'Teacher',
      render: (item) => item.teacherName,
    },
    {
      key: 'date',
      header: 'Assigned',
      render: (item) => formatReportDate(item.homeworkDate),
    },
    {
      key: 'due',
      header: 'Due Date',
      render: (item) =>
        item.dueDate ? formatReportDate(item.dueDate) : 'Not set',
    },
    {
      key: 'submissions',
      header: 'Pending',
      render: (item) => (
        <span className="homework-pending-count">
          {item.pendingSubmissionCount} / {item.submissionCount}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span
          className={`status-badge${
            item.status === 'Active' ? '' : ' status-badge--inactive'
          }`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (item) => (
        <button
          className="table-action-button"
          onClick={() => onEdit(item)}
          type="button"
        >
          <Icon name="edit" size={13} />
          Edit
        </button>
      ),
    },
  ]

  return (
    <div className="homework-dashboard">
      <section className="stats-grid homework-stats">
        <article className="stat-card">
          <div className="stat-icon stat-icon--blue">
            <Icon name="exams" size={20} />
          </div>
          <div className="stat-content">
            <p>Total Homework</p>
            <strong>{summary.total}</strong>
            <span>Matching current filters</span>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon stat-icon--green">
            <Icon name="check" size={20} />
          </div>
          <div className="stat-content">
            <p>Active Homework</p>
            <strong>{summary.active}</strong>
            <span>Available assignments</span>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon stat-icon--amber">
            <Icon name="calendar" size={20} />
          </div>
          <div className="stat-content">
            <p>Due Today</p>
            <strong>{summary.dueToday}</strong>
            <span>{formatReportDate(today)}</span>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon stat-icon--violet">
            <Icon name="clock" size={20} />
          </div>
          <div className="stat-content">
            <p>Pending Submissions</p>
            <strong>{summary.pending}</strong>
            <span>Pending or missing</span>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="homework-filter-bar">
          <div>
            <h3>Recent Homework</h3>
            <p>Filter assignments by class, subject or assigned date.</p>
          </div>
          <div className="homework-filter-fields">
            <label className="form-field">
              <span>Class</span>
              <select
                onChange={(event) => {
                  setClassName(event.target.value)
                  setSection('')
                  setSubjectId('')
                }}
                value={className}
              >
                <option value="">All Classes</option>
                {data.classes
                  .filter((item) => item.status === 'Active')
                  .map((item) => (
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
                onChange={(event) => setSection(event.target.value)}
                value={section}
              >
                <option value="">All Sections</option>
                {sections.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Subject</span>
              <select
                onChange={(event) => setSubjectId(event.target.value)}
                value={subjectId}
              >
                <option value="">All Subjects</option>
                {subjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Assigned Date</span>
              <input
                onChange={(event) => setHomeworkDate(event.target.value)}
                type="date"
                value={homeworkDate}
              />
            </label>
          </div>
        </div>
        <DataTable
          columns={columns}
          emptyMessage="No homework matches the selected filters."
          getRowKey={(item) => item.id}
          rows={filtered.slice(0, 20)}
        />
      </section>
    </div>
  )
}
