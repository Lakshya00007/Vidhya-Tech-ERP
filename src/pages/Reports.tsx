import { useState } from 'react'
import { Icon, type IconName } from '../components/Icon'

const reportCards: {
  title: string
  description: string
  icon: IconName
  tone: string
  format: string
}[] = [
  {
    title: 'Student List Report',
    description: 'Class-wise student directory with admission and guardian details.',
    icon: 'students',
    tone: 'blue',
    format: 'PDF / Excel',
  },
  {
    title: 'Fee Due Report',
    description: 'Outstanding fees grouped by class, student and fee period.',
    icon: 'clock',
    tone: 'amber',
    format: 'PDF / Excel',
  },
  {
    title: 'Daily Collection Report',
    description: 'Payment collections and receipt summary for a selected date.',
    icon: 'wallet',
    tone: 'green',
    format: 'PDF / Print',
  },
  {
    title: 'Monthly Collection Report',
    description: 'Monthly fee collection totals with payment mode breakdown.',
    icon: 'calendar',
    tone: 'violet',
    format: 'PDF / Excel',
  },
  {
    title: 'Attendance Report',
    description: 'Daily or monthly attendance summary by class and student.',
    icon: 'attendance',
    tone: 'cyan',
    format: 'PDF / Excel',
  },
  {
    title: 'Result Report',
    description: 'Exam results, grades and subject-wise performance summary.',
    icon: 'exams',
    tone: 'rose',
    format: 'PDF / Print',
  },
]

export function Reports() {
  const [message, setMessage] = useState('')

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h2>Reports</h2>
          <p>Generate and export operational school reports.</p>
        </div>
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

      <section className="reports-grid">
        {reportCards.map((report) => (
          <article className="report-card" key={report.title}>
            <div className={`report-icon report-icon--${report.tone}`}>
              <Icon name={report.icon} size={23} />
            </div>
            <div className="report-card__content">
              <h3>{report.title}</h3>
              <p>{report.description}</p>
              <span>{report.format}</span>
            </div>
            <button
              className="secondary-button report-button"
              type="button"
              onClick={() => setMessage(`${report.title} is ready to configure and export.`)}
            >
              Generate Report
              <Icon name="arrow" size={16} />
            </button>
          </article>
        ))}
      </section>

      <section className="panel report-note">
        <span className="report-note__icon"><Icon name="building" size={20} /></span>
        <div>
          <strong>Reports use local school records</strong>
          <p>All report generation will run on this device. No school data is sent to a cloud service.</p>
        </div>
      </section>
    </div>
  )
}
