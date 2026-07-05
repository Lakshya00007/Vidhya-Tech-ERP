import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { getErrorMessage, getHomeworkErpApi } from '../../lib/erpApi'
import {
  exportCsv,
  formatGeneratedAt,
  formatReportDate,
} from '../../lib/reportUtils'
import type {
  Homework,
  HomeworkSubmission,
  HomeworkSubmissionStatus,
} from '../../types'
import type { HomeworkChildProps } from './types'

interface HomeworkReportProps extends HomeworkChildProps {
  onRefresh: () => Promise<void>
}

const submissionStatuses: HomeworkSubmissionStatus[] = [
  'Pending',
  'Submitted',
  'Checked',
  'Late',
  'Missing',
]

const matchingHomework = (
  homework: Homework[],
  className: string,
  section: string,
) =>
  homework.filter(
    (item) =>
      item.className === className &&
      (!section || !item.section || item.section === section),
  )

export function HomeworkReport({
  data,
  onNotice,
  onRefresh,
}: HomeworkReportProps) {
  const activeClasses = data.classes.filter((item) => item.status === 'Active')
  const initialClass = activeClasses[0]?.name ?? ''
  const initialSection =
    data.sections.find(
      (item) =>
        item.status === 'Active' && item.className === initialClass,
    )?.name ?? ''
  const initialHomework = matchingHomework(
    data.homework,
    initialClass,
    initialSection,
  )[0]
  const [className, setClassName] = useState(initialClass)
  const [section, setSection] = useState(initialSection)
  const [homeworkId, setHomeworkId] = useState(initialHomework?.id ?? '')
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const sections = data.sections.filter(
    (item) => item.status === 'Active' && item.className === className,
  )
  const homeworkOptions = matchingHomework(
    data.homework,
    className,
    section,
  )
  const selectedHomework = data.homework.find(
    (item) => item.id === homeworkId,
  )
  const schoolContact = [
    data.settings.address,
    data.settings.phone,
    data.settings.email,
  ]
    .filter(Boolean)
    .join(' · ')
  const visibleSubmissions = useMemo(
    () =>
      submissions.filter(
        (item) => !section || item.section === section,
      ),
    [section, submissions],
  )

  useEffect(() => {
    if (!homeworkId) return
    let current = true
    Promise.resolve()
      .then(() => {
        if (current) setIsLoading(true)
        return getHomeworkErpApi().getHomeworkSubmissions(homeworkId)
      })
      .then((rows) => {
        if (current) setSubmissions(rows)
      })
      .catch((error: unknown) => {
        if (current) {
          setSubmissions([])
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (current) setIsLoading(false)
      })
    return () => {
      current = false
    }
  }, [homeworkId, onNotice])

  const summary = useMemo(
    () =>
      Object.fromEntries(
        submissionStatuses.map((status) => [
          status,
          visibleSubmissions.filter((item) => item.status === status).length,
        ]),
      ) as Record<HomeworkSubmissionStatus, number>,
    [visibleSubmissions],
  )

  const selectClass = (nextClass: string) => {
    const nextSection =
      data.sections.find(
        (item) =>
          item.status === 'Active' && item.className === nextClass,
      )?.name ?? ''
    const nextHomework = matchingHomework(
      data.homework,
      nextClass,
      nextSection,
    )[0]
    setClassName(nextClass)
    setSection(nextSection)
    setHomeworkId(nextHomework?.id ?? '')
    setSubmissions([])
    onNotice(null)
  }

  const selectSection = (nextSection: string) => {
    const nextHomework = matchingHomework(
      data.homework,
      className,
      nextSection,
    )[0]
    setSection(nextSection)
    setHomeworkId(nextHomework?.id ?? '')
    setSubmissions([])
    onNotice(null)
  }

  const updateSubmission = (
    id: string,
    patch: Partial<HomeworkSubmission>,
  ) => {
    setSubmissions((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  const save = async () => {
    if (!selectedHomework || visibleSubmissions.length === 0) return
    try {
      setIsSaving(true)
      const saved = await getHomeworkErpApi().saveHomeworkSubmissionsBulk(
        visibleSubmissions.map((item) => ({
          homeworkId: item.homeworkId,
          studentId: item.studentId,
          status: item.status,
          submittedDate: item.submittedDate,
          marks: item.marks,
          remarks: item.remarks,
        })),
      )
      setSubmissions(saved)
      await onRefresh()
      onNotice({
        type: 'success',
        message: `Submission status was saved for ${saved.length} student(s).`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const exportRows = () => {
    if (!selectedHomework) return
    exportCsv(
      `homework-report-${selectedHomework.className}-${selectedHomework.homeworkDate}.csv`,
      [
        'Admission No',
        'Student Name',
        'Class',
        'Section',
        'Status',
        'Submitted Date',
        'Marks',
        'Remarks',
      ],
      visibleSubmissions.map((item) => [
        item.admissionNo,
        item.studentName,
        item.className,
        item.section,
        item.status,
        item.submittedDate,
        item.marks,
        item.remarks,
      ]),
    )
    onNotice({
      type: 'success',
      message: `${visibleSubmissions.length} submission row(s) were exported.`,
    })
  }

  if (activeClasses.length === 0) {
    return (
      <section className="panel document-empty-state">
        <Icon name="building" size={26} />
        <h3>Create classes from Settings first.</h3>
      </section>
    )
  }

  return (
    <section className="panel homework-report-panel">
      <div className="homework-report-toolbar">
        <div>
          <h3>Homework Report</h3>
          <p>Review and update student submission progress.</p>
        </div>
        <div className="homework-report-filters">
          <label className="form-field">
            <span>Class</span>
            <select
              onChange={(event) => selectClass(event.target.value)}
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
              onChange={(event) => selectSection(event.target.value)}
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
          <label className="form-field homework-select-field">
            <span>Homework</span>
            <select
              onChange={(event) => {
                setHomeworkId(event.target.value)
                setSubmissions([])
                onNotice(null)
              }}
              value={homeworkId}
            >
              {homeworkOptions.length === 0 && (
                <option value="">No homework found</option>
              )}
              {homeworkOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} · {formatReportDate(item.homeworkDate)}
                </option>
              ))}
            </select>
          </label>
          <button
            className="secondary-button"
            disabled={visibleSubmissions.length === 0}
            onClick={exportRows}
            type="button"
          >
            <Icon name="download" size={15} />
            Export CSV
          </button>
          <button
            className="secondary-button"
            disabled={visibleSubmissions.length === 0}
            onClick={() => window.setTimeout(() => window.print(), 50)}
            type="button"
          >
            <Icon name="print" size={15} />
            Print
          </button>
          <button
            className="primary-button"
            disabled={visibleSubmissions.length === 0 || isSaving}
            onClick={() => void save()}
            type="button"
          >
            <Icon name="check" size={15} />
            {isSaving ? 'Saving...' : 'Save Updates'}
          </button>
        </div>
      </div>

      {!selectedHomework ? (
        <div className="document-empty-state homework-report-empty">
          <Icon name="exams" size={28} />
          <h3>No homework found for this class and section.</h3>
          <p>Assign homework first, then return to update submissions.</p>
        </div>
      ) : isLoading ? (
        <div className="timetable-view-loading">
          <span className="loading-spinner" />
          Loading student submissions...
        </div>
      ) : (
        <div className="homework-report-print-area">
          <header className="homework-print-header">
            <div>
              <h2>{data.settings.schoolName || 'Vidhya School ERP'}</h2>
              {schoolContact && <p>{schoolContact}</p>}
            </div>
            <div>
              <strong>Homework Submission Report</strong>
              <span>
                Class {selectedHomework.className}
                {section || selectedHomework.section
                  ? ` · Section ${section || selectedHomework.section}`
                  : ' · All Sections'}
              </span>
              <small>Generated {formatGeneratedAt()}</small>
            </div>
          </header>

          <section className="homework-report-details">
            <div>
              <span>Homework</span>
              <strong>{selectedHomework.title}</strong>
            </div>
            <div>
              <span>Subject</span>
              <strong>{selectedHomework.subjectName}</strong>
            </div>
            <div>
              <span>Teacher</span>
              <strong>{selectedHomework.teacherName}</strong>
            </div>
            <div>
              <span>Assigned / Due</span>
              <strong>
                {formatReportDate(selectedHomework.homeworkDate)}
                {selectedHomework.dueDate
                  ? ` / ${formatReportDate(selectedHomework.dueDate)}`
                  : ''}
              </strong>
            </div>
          </section>

          <div className="homework-report-summary">
            {submissionStatuses.map((status) => (
              <div key={status}>
                <span>{status}</span>
                <strong>{summary[status]}</strong>
              </div>
            ))}
          </div>

          <div className="table-scroll">
            <table className="data-table homework-submission-table">
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Status</th>
                  <th>Submitted Date</th>
                  <th>Marks</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {visibleSubmissions.length > 0 ? (
                  visibleSubmissions.map((item) => (
                    <tr key={item.id}>
                      <td>{item.admissionNo}</td>
                      <td>
                        <strong>{item.studentName}</strong>
                      </td>
                      <td>
                        <select
                          aria-label={`Status for ${item.studentName}`}
                          className={`homework-status-select homework-status-select--${item.status.toLowerCase()}`}
                          onChange={(event) =>
                            updateSubmission(item.id, {
                              status: event.target
                                .value as HomeworkSubmissionStatus,
                            })
                          }
                          value={item.status}
                        >
                          {submissionStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          aria-label={`Submitted date for ${item.studentName}`}
                          className="homework-table-input"
                          onChange={(event) =>
                            updateSubmission(item.id, {
                              submittedDate: event.target.value,
                            })
                          }
                          type="date"
                          value={item.submittedDate}
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`Marks for ${item.studentName}`}
                          className="homework-table-input homework-marks-input"
                          min="0"
                          onChange={(event) =>
                            updateSubmission(item.id, {
                              marks:
                                event.target.value === ''
                                  ? null
                                  : Number(event.target.value),
                            })
                          }
                          type="number"
                          value={item.marks ?? ''}
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`Remarks for ${item.studentName}`}
                          className="homework-table-input"
                          onChange={(event) =>
                            updateSubmission(item.id, {
                              remarks: event.target.value,
                            })
                          }
                          placeholder="Optional remarks"
                          value={item.remarks}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="empty-table" colSpan={6}>
                      No student submission rows were created for this
                      assignment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
