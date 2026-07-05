import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { getClassTestsErpApi, getErrorMessage } from '../../lib/erpApi'
import {
  exportCsv,
  formatGeneratedAt,
  formatReportDate,
} from '../../lib/reportUtils'
import type { ClassTest, ClassTestMark } from '../../types'
import type { ClassTestsChildProps } from './types'

const matchingTests = (
  tests: ClassTest[],
  className: string,
  section: string,
) =>
  tests.filter(
    (test) =>
      test.className === className &&
      (!section || !test.section || test.section === section),
  )

export function ClassTestResult({
  data,
  onNotice,
}: ClassTestsChildProps) {
  const activeClasses = data.classes.filter((item) => item.status === 'Active')
  const initialClass = activeClasses[0]?.name ?? ''
  const initialSection =
    data.sections.find(
      (item) =>
        item.status === 'Active' && item.className === initialClass,
    )?.name ?? ''
  const initialTest = matchingTests(
    data.tests,
    initialClass,
    initialSection,
  )[0]
  const [className, setClassName] = useState(initialClass)
  const [section, setSection] = useState(initialSection)
  const [testId, setTestId] = useState(initialTest?.id ?? '')
  const [marks, setMarks] = useState<ClassTestMark[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sections = data.sections.filter(
    (item) => item.status === 'Active' && item.className === className,
  )
  const tests = matchingTests(data.tests, className, section)
  const selectedTest = data.tests.find((item) => item.id === testId)
  const visibleMarks = useMemo(
    () => marks.filter((mark) => !section || mark.section === section),
    [marks, section],
  )
  const appeared = visibleMarks.filter((mark) =>
    ['Pass', 'Fail'].includes(mark.resultStatus),
  )
  const summary = {
    total: visibleMarks.length,
    appeared: appeared.length,
    passed: visibleMarks.filter((mark) => mark.resultStatus === 'Pass').length,
    failed: visibleMarks.filter((mark) => mark.resultStatus === 'Fail').length,
    absent: visibleMarks.filter((mark) => mark.resultStatus === 'Absent').length,
    average:
      appeared.length > 0
        ? appeared.reduce((total, mark) => total + mark.marksObtained, 0) /
          appeared.length
        : 0,
    highest:
      appeared.length > 0
        ? Math.max(...appeared.map((mark) => mark.marksObtained))
        : 0,
  }
  const schoolContact = [
    data.settings.address,
    data.settings.phone,
    data.settings.email,
  ]
    .filter(Boolean)
    .join(' · ')

  useEffect(() => {
    if (!testId) return
    let current = true
    Promise.resolve()
      .then(() => {
        if (current) setIsLoading(true)
        return getClassTestsErpApi().getClassTestMarks(testId)
      })
      .then((rows) => {
        if (current) setMarks(rows)
      })
      .catch((error: unknown) => {
        if (current) {
          setMarks([])
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (current) setIsLoading(false)
      })
    return () => {
      current = false
    }
  }, [onNotice, testId])

  const selectClass = (nextClass: string) => {
    const nextSection =
      data.sections.find(
        (item) =>
          item.status === 'Active' && item.className === nextClass,
      )?.name ?? ''
    const nextTest = matchingTests(data.tests, nextClass, nextSection)[0]
    setClassName(nextClass)
    setSection(nextSection)
    setTestId(nextTest?.id ?? '')
    setMarks([])
    onNotice(null)
  }

  const selectSection = (nextSection: string) => {
    const nextTest = matchingTests(data.tests, className, nextSection)[0]
    setSection(nextSection)
    setTestId(nextTest?.id ?? '')
    setMarks([])
    onNotice(null)
  }

  const percentage = (mark: ClassTestMark) =>
    selectedTest && selectedTest.maxMarks > 0
      ? (mark.marksObtained / selectedTest.maxMarks) * 100
      : 0

  const exportRows = () => {
    if (!selectedTest) return
    exportCsv(
      `class-test-result-${selectedTest.className}-${selectedTest.testDate}.csv`,
      [
        'Admission No',
        'Student Name',
        'Class',
        'Section',
        'Marks Obtained',
        'Maximum Marks',
        'Percentage',
        'Result Status',
        'Remarks',
      ],
      visibleMarks.map((mark) => [
        mark.admissionNo,
        mark.studentName,
        mark.className,
        mark.section,
        mark.resultStatus === 'Absent' ||
        mark.resultStatus === 'Pending'
          ? ''
          : mark.marksObtained,
        selectedTest.maxMarks,
        mark.resultStatus === 'Absent' ||
        mark.resultStatus === 'Pending'
          ? ''
          : `${percentage(mark).toFixed(2)}%`,
        mark.resultStatus,
        mark.remarks,
      ]),
    )
    onNotice({
      type: 'success',
      message: `${visibleMarks.length} result row(s) were exported.`,
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
    <section className="panel class-test-result-panel">
      <div className="class-test-result-toolbar">
        <div>
          <h3>Class Test Result</h3>
          <p>Review, print or export a class test result register.</p>
        </div>
        <div className="class-test-result-filters">
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
          <label className="form-field class-test-result-test-field">
            <span>Class Test</span>
            <select
              onChange={(event) => {
                setTestId(event.target.value)
                setMarks([])
                onNotice(null)
              }}
              value={testId}
            >
              {tests.length === 0 && (
                <option value="">No class tests found</option>
              )}
              {tests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.testName} · {test.subjectName}
                </option>
              ))}
            </select>
          </label>
          <button
            className="secondary-button"
            disabled={visibleMarks.length === 0}
            onClick={exportRows}
            type="button"
          >
            <Icon name="download" size={15} />
            Export CSV
          </button>
          <button
            className="primary-button"
            disabled={visibleMarks.length === 0}
            onClick={() => window.setTimeout(() => window.print(), 50)}
            type="button"
          >
            <Icon name="print" size={15} />
            Print Result
          </button>
        </div>
      </div>

      {!selectedTest ? (
        <div className="document-empty-state class-test-result-empty">
          <Icon name="reports" size={28} />
          <h3>No class test found for this class and section.</h3>
        </div>
      ) : isLoading ? (
        <div className="timetable-view-loading">
          <span className="loading-spinner" />
          Loading class test result...
        </div>
      ) : (
        <div className="class-test-result-print-area">
          <header className="class-test-print-header">
            <div>
              <h2>{data.settings.schoolName || 'Vidhya School ERP'}</h2>
              {schoolContact && <p>{schoolContact}</p>}
            </div>
            <div>
              <strong>Class Test Result</strong>
              <span>
                Class {selectedTest.className}
                {section || selectedTest.section
                  ? ` · Section ${section || selectedTest.section}`
                  : ' · All Sections'}
              </span>
              <small>Generated {formatGeneratedAt()}</small>
            </div>
          </header>

          <section className="class-test-result-details">
            <div>
              <span>Test</span>
              <strong>{selectedTest.testName}</strong>
            </div>
            <div>
              <span>Subject</span>
              <strong>{selectedTest.subjectName}</strong>
            </div>
            <div>
              <span>Teacher</span>
              <strong>{selectedTest.teacherName}</strong>
            </div>
            <div>
              <span>Test Date</span>
              <strong>{formatReportDate(selectedTest.testDate)}</strong>
            </div>
            <div>
              <span>Pass / Maximum</span>
              <strong>
                {selectedTest.passingMarks} / {selectedTest.maxMarks}
              </strong>
            </div>
          </section>

          <div className="class-test-result-summary">
            <div>
              <span>Total Students</span>
              <strong>{summary.total}</strong>
            </div>
            <div>
              <span>Appeared</span>
              <strong>{summary.appeared}</strong>
            </div>
            <div>
              <span>Passed</span>
              <strong>{summary.passed}</strong>
            </div>
            <div>
              <span>Failed</span>
              <strong>{summary.failed}</strong>
            </div>
            <div>
              <span>Absent</span>
              <strong>{summary.absent}</strong>
            </div>
            <div>
              <span>Average Marks</span>
              <strong>{summary.average.toFixed(2)}</strong>
            </div>
            <div>
              <span>Highest Marks</span>
              <strong>{summary.highest}</strong>
            </div>
          </div>

          <div className="table-scroll">
            <table className="data-table class-test-result-table">
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Marks Obtained</th>
                  <th>Max Marks</th>
                  <th>Percentage</th>
                  <th>Result Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {visibleMarks.length > 0 ? (
                  visibleMarks.map((mark) => (
                    <tr key={mark.id}>
                      <td>{mark.admissionNo}</td>
                      <td>
                        <strong>{mark.studentName}</strong>
                      </td>
                      <td>
                        {mark.resultStatus === 'Absent' ||
                        mark.resultStatus === 'Pending'
                          ? '—'
                          : mark.marksObtained}
                      </td>
                      <td>{selectedTest.maxMarks}</td>
                      <td>
                        {mark.resultStatus === 'Absent' ||
                        mark.resultStatus === 'Pending'
                          ? '—'
                          : `${percentage(mark).toFixed(2)}%`}
                      </td>
                      <td>
                        <span
                          className={`class-test-result-badge class-test-result-badge--${mark.resultStatus.toLowerCase()}`}
                        >
                          {mark.resultStatus}
                        </span>
                      </td>
                      <td>{mark.remarks || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="empty-table" colSpan={7}>
                      No student mark rows were created for this test.
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
