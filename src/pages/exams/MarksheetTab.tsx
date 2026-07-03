import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import { calculateMarksheetSummary } from '../../lib/marksheet'
import { formatReportDate } from '../../lib/reportUtils'
import type {
  Exam,
  MarkRecord,
  SchoolSettings,
  Student,
} from '../../types'
import type { ExamTabNoticeProps } from './types'

interface MarksheetTabProps extends ExamTabNoticeProps {
  exams: Exam[]
  students: Student[]
  settings: SchoolSettings
}

const studentsForExam = (students: Student[], exam: Exam | undefined) =>
  exam
    ? students.filter(
        (student) =>
          student.status === 'Active' &&
          student.className === exam.className &&
          (!exam.section || student.section === exam.section),
      )
    : []

export function MarksheetTab({
  exams,
  students,
  settings,
  onNotice,
}: MarksheetTabProps) {
  const availableExams = useMemo(() => exams, [exams])
  const firstExam = availableExams[0]
  const firstStudent = studentsForExam(students, firstExam)[0]
  const [selectedExamId, setSelectedExamId] = useState(firstExam?.id ?? '')
  const [selectedStudentId, setSelectedStudentId] = useState(
    firstStudent?.id ?? '',
  )
  const [marks, setMarks] = useState<MarkRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const selectedExam = availableExams.find(
    (exam) => exam.id === selectedExamId,
  )
  const availableStudents = studentsForExam(students, selectedExam)
  const selectedStudent = availableStudents.find(
    (student) => student.id === selectedStudentId,
  )
  const summary = calculateMarksheetSummary(marks)

  useEffect(() => {
    if (!selectedExamId || !selectedStudentId) return
    let isCurrent = true

    Promise.resolve()
      .then(() => {
        if (!isCurrent) return []
        setIsLoading(true)
        return getErpApi().getMarksByStudentExam(
          selectedStudentId,
          selectedExamId,
        )
      })
      .then((rows) => {
        if (isCurrent) setMarks(rows)
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setMarks([])
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [onNotice, selectedExamId, selectedStudentId])

  const selectExam = (examId: string) => {
    const exam = availableExams.find((item) => item.id === examId)
    const student = studentsForExam(students, exam)[0]
    setSelectedExamId(examId)
    setSelectedStudentId(student?.id ?? '')
    setMarks([])
  }

  const selectStudent = (studentId: string) => {
    setSelectedStudentId(studentId)
    setMarks([])
  }

  const printMarksheet = () => {
    window.setTimeout(() => window.print(), 50)
  }

  return (
    <div className="exam-workspace-stack marksheet-page">
      <section className="panel marksheet-toolbar">
        <div className="report-filter-fields report-filter-fields--compact">
          <label className="form-field">
            <span>Exam</span>
            <select
              disabled={availableExams.length === 0}
              value={selectedExamId}
              onChange={(event) => selectExam(event.target.value)}
            >
              {availableExams.length === 0 && (
                <option value="">No active exams available</option>
              )}
              {availableExams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name} · Class {exam.className}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Student</span>
            <select
              disabled={availableStudents.length === 0}
              value={selectedStudentId}
              onChange={(event) => selectStudent(event.target.value)}
            >
              {availableStudents.length === 0 && (
                <option value="">No students available</option>
              )}
              {availableStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.admissionNo} · {student.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          className="primary-button"
          disabled={!summary}
          type="button"
          onClick={printMarksheet}
        >
          <Icon name="print" size={17} />
          Print / Save PDF
        </button>
      </section>

      <article className="panel marksheet-print-area">
        <header className="marksheet-header">
          <span className="marksheet-school-mark">
            <Icon name="school" size={29} />
          </span>
          <div>
            <h1>{settings.schoolName}</h1>
            <p>{settings.address || 'School address not configured'}</p>
            <span>
              {[settings.phone, settings.email].filter(Boolean).join(' · ') ||
                'Contact details not configured'}
            </span>
          </div>
          <strong>Academic Marksheet</strong>
        </header>

        {selectedExam && selectedStudent ? (
          <>
            <section className="marksheet-title">
              <div>
                <span>Examination</span>
                <h2>{selectedExam.name}</h2>
              </div>
              <div>
                <span>Academic Year</span>
                <strong>
                  {selectedExam.academicYear ||
                    settings.academicYear ||
                    '—'}
                </strong>
              </div>
              <div>
                <span>Exam Date</span>
                <strong>{formatReportDate(selectedExam.examDate)}</strong>
              </div>
            </section>

            <dl className="marksheet-student-details">
              <div>
                <dt>Student Name</dt>
                <dd>{selectedStudent.name}</dd>
              </div>
              <div>
                <dt>Admission No.</dt>
                <dd>{selectedStudent.admissionNo}</dd>
              </div>
              <div>
                <dt>Class / Section</dt>
                <dd>
                  {selectedStudent.className}
                  {selectedStudent.section
                    ? ` / ${selectedStudent.section}`
                    : ''}
                </dd>
              </div>
            </dl>

            <div className="marksheet-table-wrap">
              <table className="marksheet-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Maximum Marks</th>
                    <th>Passing Marks</th>
                    <th>Obtained Marks</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.length > 0 ? (
                    marks.map((mark) => (
                      <tr key={mark.id}>
                        <td>{mark.subjectName}</td>
                        <td>{mark.maxMarks}</td>
                        <td>{mark.passingMarks}</td>
                        <td>
                          <strong>{mark.obtainedMarks}</strong>
                        </td>
                        <td>
                          <span
                            className={
                              mark.obtainedMarks >= mark.passingMarks
                                ? 'marksheet-pass'
                                : 'marksheet-fail'
                            }
                          >
                            {mark.obtainedMarks >= mark.passingMarks
                              ? 'Pass'
                              : 'Fail'}
                          </span>
                        </td>
                        <td>{mark.remarks || '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="marksheet-empty" colSpan={6}>
                        {isLoading
                          ? 'Loading marks...'
                          : 'No saved marks found for this student and exam.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {summary && (
              <>
                <section className="marksheet-summary">
                  <div>
                    <span>Total Marks</span>
                    <strong>{summary.totalMarks}</strong>
                  </div>
                  <div>
                    <span>Obtained Marks</span>
                    <strong>{summary.obtainedMarks}</strong>
                  </div>
                  <div>
                    <span>Percentage</span>
                    <strong>{summary.percentage.toFixed(2)}%</strong>
                  </div>
                  <div>
                    <span>Grade</span>
                    <strong>{summary.grade}</strong>
                  </div>
                  <div>
                    <span>Result</span>
                    <strong
                      className={
                        summary.result === 'Pass'
                          ? 'text-success'
                          : 'text-danger'
                      }
                    >
                      {summary.result}
                    </strong>
                  </div>
                </section>
                <section className="marksheet-remarks">
                  <span>Remarks</span>
                  <p>{summary.remarks || '—'}</p>
                </section>
              </>
            )}

            <footer className="marksheet-signatures">
              <div>
                <span />
                <strong>Class Teacher</strong>
              </div>
              <div>
                <span />
                <strong>Principal</strong>
              </div>
            </footer>
          </>
        ) : (
          <div className="marksheet-placeholder">
            <Icon name="exams" size={28} />
            <strong>Select an exam and student</strong>
            <p>Saved subject marks will appear in the marksheet preview.</p>
          </div>
        )}
      </article>
    </div>
  )
}
