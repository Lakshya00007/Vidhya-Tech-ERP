import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import {
  getBehaviourSkillsErpApi,
  getErrorMessage,
} from '../../lib/erpApi'
import {
  exportCsv,
  formatGeneratedAt,
  formatReportDate,
} from '../../lib/reportUtils'
import type { SkillDomain, SkillRating, StudentRating } from '../../types'
import type { BehaviourSkillsChildProps } from './types'

const ratingOrder: StudentRating[] = [
  'Excellent',
  'Very Good',
  'Good',
  'Average',
  'Needs Improvement',
]

interface DomainReportProps extends BehaviourSkillsChildProps {
  domain: SkillDomain
}

export function DomainReport({
  domain,
  data,
  onNotice,
}: DomainReportProps) {
  const activeClasses = data.classes.filter((item) => item.status === 'Active')
  const [className, setClassName] = useState(activeClasses[0]?.name ?? '')
  const [section, setSection] = useState('')
  const [studentId, setStudentId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [ratings, setRatings] = useState<SkillRating[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sections = data.sections.filter(
    (item) => item.status === 'Active' && item.className === className,
  )
  const students = useMemo(
    () =>
      data.students.filter(
        (student) =>
          student.status === 'Active' &&
          student.className === className &&
          (!section || student.section === section),
    ),
    [className, data.students, section],
  )
  const effectiveStudentId = students.some(
    (student) => student.id === studentId,
  )
    ? studentId
    : ''
  const summary = Object.fromEntries(
    ratingOrder.map((rating) => [
      rating,
      ratings.filter((item) => item.rating === rating).length,
    ]),
  ) as Record<StudentRating, number>
  const schoolContact = [
    data.settings.address,
    data.settings.phone,
    data.settings.email,
  ]
    .filter(Boolean)
    .join(' · ')

  useEffect(() => {
    let current = true
    if (!className) {
      void Promise.resolve().then(() => {
        if (current) setRatings([])
      })
      return () => {
        current = false
      }
    }
    void Promise.resolve().then(() => {
      if (current) setIsLoading(true)
    })
    void getBehaviourSkillsErpApi()
      .getSkillRatings({
        domain,
        className,
        section,
        studentId: effectiveStudentId,
        startDate,
        endDate,
      })
      .then((rows) => {
        if (current) setRatings(rows)
      })
      .catch((error: unknown) => {
        if (current) {
          setRatings([])
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (current) setIsLoading(false)
      })
    return () => {
      current = false
    }
  }, [
    className,
    domain,
    endDate,
    onNotice,
    section,
    startDate,
    effectiveStudentId,
  ])

  const exportReport = () => {
    exportCsv(
      `${domain.toLowerCase()}-domain-rating-report.csv`,
      [
        'Date',
        'Admission No',
        'Student Name',
        'Class',
        'Section',
        'Skill',
        'Rating',
        'Remarks',
        'Rated By',
      ],
      ratings.map((rating) => [
        rating.ratingDate,
        rating.admissionNo,
        rating.studentName,
        rating.className,
        rating.section,
        rating.skillName,
        rating.rating,
        rating.remarks,
        rating.ratedBy,
      ]),
    )
    onNotice({
      type: 'success',
      message: `${ratings.length} ${domain.toLowerCase()} rating row(s) exported.`,
    })
  }

  if (activeClasses.length === 0) {
    return (
      <section className="panel document-empty-state">
        <Icon name="building" size={28} />
        <h3>Create classes from Settings first.</h3>
      </section>
    )
  }

  return (
    <section className="panel domain-report-panel">
      <div className="domain-report-toolbar">
        <div>
          <h3>{domain} Domain Rating Report</h3>
          <p>Review student skill ratings and rating distribution.</p>
        </div>
        <div className="domain-report-actions">
          <button
            className="secondary-button"
            disabled={ratings.length === 0}
            onClick={exportReport}
            type="button"
          >
            <Icon name="download" size={16} />
            Export CSV
          </button>
          <button
            className="primary-button"
            disabled={ratings.length === 0}
            onClick={() => window.setTimeout(() => window.print(), 50)}
            type="button"
          >
            <Icon name="print" size={16} />
            Print Report
          </button>
        </div>
      </div>

      <div className="domain-report-filters">
        <label className="form-field">
          <span>Class</span>
          <select
            onChange={(event) => {
              setClassName(event.target.value)
              setSection('')
              setStudentId('')
            }}
            value={className}
          >
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
            onChange={(event) => {
              setSection(event.target.value)
              setStudentId('')
            }}
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
        <label className="form-field domain-report-student-filter">
          <span>Student</span>
          <select
            onChange={(event) => setStudentId(event.target.value)}
            value={effectiveStudentId}
          >
            <option value="">All Students</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.admissionNo} · {student.name}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Start date</span>
          <input
            max={endDate || undefined}
            onChange={(event) => setStartDate(event.target.value)}
            type="date"
            value={startDate}
          />
        </label>
        <label className="form-field">
          <span>End date</span>
          <input
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
            type="date"
            value={endDate}
          />
        </label>
      </div>

      <div className="domain-report-print-area">
        <header className="behaviour-print-header">
          <div>
            <span>{domain} Domain Rating Report</span>
            <h2>{data.settings.schoolName || 'Vidhya School ERP'}</h2>
            <p>{schoolContact || 'Offline School Management System'}</p>
          </div>
          <div>
            <strong>
              Class {className}
              {section ? ` / ${section}` : ' / All Sections'}
            </strong>
            <span>
              {startDate || endDate
                ? `${startDate ? formatReportDate(startDate) : 'Beginning'} – ${
                    endDate ? formatReportDate(endDate) : 'Present'
                  }`
                : 'All recorded dates'}
            </span>
            <small>Generated {formatGeneratedAt()}</small>
          </div>
        </header>

        <div className="domain-rating-summary">
          <div>
            <span>Total Ratings</span>
            <strong>{ratings.length}</strong>
          </div>
          {ratingOrder.map((rating) => (
            <div key={rating}>
              <span>{rating}</span>
              <strong>{summary[rating]}</strong>
            </div>
          ))}
        </div>

        <div className="table-scroll">
          <table className="data-table domain-report-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Admission No</th>
                <th>Student</th>
                <th>Class / Section</th>
                <th>Skill</th>
                <th>Rating</th>
                <th>Remarks</th>
                <th>Rated By</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="empty-table" colSpan={8}>
                    Loading {domain.toLowerCase()} ratings...
                  </td>
                </tr>
              ) : ratings.length === 0 ? (
                <tr>
                  <td className="empty-table" colSpan={8}>
                    No {domain.toLowerCase()} ratings found for these filters.
                  </td>
                </tr>
              ) : (
                ratings.map((rating) => (
                  <tr key={rating.id}>
                    <td>{formatReportDate(rating.ratingDate)}</td>
                    <td><strong>{rating.admissionNo}</strong></td>
                    <td>{rating.studentName}</td>
                    <td>
                      {rating.className}
                      {rating.section ? ` / ${rating.section}` : ''}
                    </td>
                    <td>{rating.skillName}</td>
                    <td>
                      <span className={`domain-rating-badge domain-rating-badge--${rating.rating.toLowerCase().replaceAll(' ', '-')}`}>
                        {rating.rating}
                      </span>
                    </td>
                    <td>{rating.remarks || '—'}</td>
                    <td>{rating.ratedBy || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
