import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import type {
  ClassItem,
  Exam,
  MarkRecord,
  SectionItem,
  Student,
  Subject,
} from '../../types'
import type { ExamTabNoticeProps } from './types'

interface MarkDraft {
  obtainedMarks: string
  remarks: string
}

interface MarksEntryTabProps extends ExamTabNoticeProps {
  classes: ClassItem[]
  sections: SectionItem[]
  students: Student[]
  subjects: Subject[]
  exams: Exam[]
}

const draftKey = (studentId: string, subjectId: string) =>
  `${studentId}:${subjectId}`

const buildDrafts = (
  students: Student[],
  subjects: Subject[],
  records: MarkRecord[],
  className: string,
) =>
  Object.fromEntries(
    students
      .filter(
        (student) =>
          student.status === 'Active' && student.className === className,
      )
      .flatMap((student) =>
        subjects
          .filter(
            (subject) =>
              subject.status === 'Active' &&
              subject.className === className,
          )
          .map((subject) => {
            const record = records.find(
              (item) =>
                item.studentId === student.id &&
                item.subjectId === subject.id,
            )
            return [
              draftKey(student.id, subject.id),
              {
                obtainedMarks:
                  record === undefined ? '' : String(record.obtainedMarks),
                remarks: record?.remarks ?? '',
              } satisfies MarkDraft,
            ]
          }),
      ),
  )

export function MarksEntryTab({
  classes,
  sections,
  students,
  subjects,
  exams,
  onNotice,
}: MarksEntryTabProps) {
  const activeExams = useMemo(
    () => exams.filter((exam) => exam.status === 'Active'),
    [exams],
  )
  const firstExam = activeExams[0]
  const [selectedExamId, setSelectedExamId] = useState(firstExam?.id ?? '')
  const [selectedSection, setSelectedSection] = useState(
    firstExam?.section ?? '',
  )
  const [drafts, setDrafts] = useState<Record<string, MarkDraft>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const selectedExam = activeExams.find(
    (exam) => exam.id === selectedExamId,
  )
  const selectedClass = selectedExam?.className ?? ''
  const activeClass = classes.find(
    (item) => item.status === 'Active' && item.name === selectedClass,
  )
  const availableSections = sections.filter(
    (item) =>
      item.status === 'Active' && item.className === selectedClass,
  )
  const visibleStudents = students.filter(
    (student) =>
      student.status === 'Active' &&
      student.className === selectedClass &&
      (!selectedSection || student.section === selectedSection),
  )
  const visibleSubjects = subjects.filter(
    (subject) =>
      subject.status === 'Active' && subject.className === selectedClass,
  )
  const markRows = visibleStudents.flatMap((student) =>
    visibleSubjects.map((subject) => ({
      student,
      subject,
      key: draftKey(student.id, subject.id),
    })),
  )

  useEffect(() => {
    if (!selectedExamId || !selectedExam) return
    let isCurrent = true

    Promise.resolve()
      .then(() => {
        if (!isCurrent) return []
        setIsLoading(true)
        return getErpApi().getMarksByExam(selectedExamId)
      })
      .then((records) => {
        if (isCurrent) {
          setDrafts(
            buildDrafts(
              students,
              subjects,
              records,
              selectedExam.className,
            ),
          )
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [onNotice, selectedExam, selectedExamId, students, subjects])

  const selectExam = (examId: string) => {
    const exam = activeExams.find((item) => item.id === examId)
    setSelectedExamId(examId)
    setSelectedSection(exam?.section ?? '')
    setDrafts({})
  }

  const updateDraft = (
    studentId: string,
    subjectId: string,
    update: Partial<MarkDraft>,
  ) => {
    const key = draftKey(studentId, subjectId)
    setDrafts((current) => {
      const existing = current[key] ?? {
        obtainedMarks: '',
        remarks: '',
      }
      return {
        ...current,
        [key]: { ...existing, ...update },
      }
    })
  }

  const saveMarks = async () => {
    if (!selectedExam || markRows.length === 0) {
      onNotice({
        type: 'error',
        message: 'Select an exam with active students and subjects first.',
      })
      return
    }

    const invalidRow = markRows.find(({ student, subject }) => {
      const value =
        drafts[draftKey(student.id, subject.id)]?.obtainedMarks ?? ''
      const obtainedMarks = Number(value)
      return (
        value.trim() === '' ||
        !Number.isInteger(obtainedMarks) ||
        obtainedMarks < 0 ||
        obtainedMarks > subject.maxMarks
      )
    })
    if (invalidRow) {
      onNotice({
        type: 'error',
        message: `Enter marks from 0 to ${invalidRow.subject.maxMarks} for ${invalidRow.student.name} in ${invalidRow.subject.name}.`,
      })
      return
    }

    setIsSaving(true)
    try {
      await getErpApi().saveMarksBulk(
        markRows.map(({ student, subject }) => {
          const draft = drafts[draftKey(student.id, subject.id)]
          return {
            examId: selectedExam.id,
            studentId: student.id,
            subjectId: subject.id,
            obtainedMarks: Number(draft.obtainedMarks),
            remarks: draft.remarks,
          }
        }),
      )
      const records = await getErpApi().getMarksByExam(selectedExam.id)
      setDrafts(
        buildDrafts(students, subjects, records, selectedExam.className),
      )
      onNotice({
        type: 'success',
        message: `Marks saved for ${visibleStudents.length} students.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const emptyMessage = (() => {
    if (activeExams.length === 0) return 'Create an active exam first.'
    if (visibleSubjects.length === 0) {
      return 'Create active subjects for the selected exam class first.'
    }
    if (visibleStudents.length === 0) {
      return 'No active students found for the selected class and section.'
    }
    return 'No marks entry rows available.'
  })()

  return (
    <div className="exam-workspace-stack">
      <section className="panel marks-entry-filters">
        <div className="report-filter-fields report-filter-fields--attendance">
          <label className="form-field">
            <span>Exam</span>
            <select
              disabled={activeExams.length === 0}
              value={selectedExamId}
              onChange={(event) => selectExam(event.target.value)}
            >
              {activeExams.length === 0 && (
                <option value="">No active exams available</option>
              )}
              {activeExams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name} · Class {exam.className}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Class</span>
            <select disabled value={activeClass?.name ?? ''}>
              <option value={activeClass?.name ?? ''}>
                {activeClass ? `Class ${activeClass.name}` : 'Select an exam'}
              </option>
            </select>
          </label>
          <label className="form-field">
            <span>Section</span>
            <select
              disabled={
                !selectedExam ||
                Boolean(selectedExam.section) ||
                availableSections.length === 0
              }
              value={selectedSection}
              onChange={(event) => setSelectedSection(event.target.value)}
            >
              <option value="">All sections</option>
              {availableSections.map((section) => (
                <option key={section.id} value={section.name}>
                  Section {section.name}
                </option>
              ))}
            </select>
          </label>
          <div className="marks-entry-summary">
            <span>Students</span>
            <strong>{visibleStudents.length}</strong>
            <small>{visibleSubjects.length} subjects</small>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Marks Entry</h3>
            <p>
              {selectedExam
                ? `${selectedExam.name} · Class ${selectedExam.className}${selectedSection ? `-${selectedSection}` : ''}`
                : 'Select an exam to begin'}
            </p>
          </div>
          <button
            className="primary-button"
            disabled={markRows.length === 0 || isSaving}
            type="button"
            onClick={() => void saveMarks()}
          >
            <Icon name="check" size={17} />
            {isSaving ? 'Saving...' : 'Save Marks'}
          </button>
        </div>
        <div className="table-scroll">
          <table className="data-table marks-entry-table">
            <thead>
              <tr>
                <th>Admission No.</th>
                <th>Student Name</th>
                <th>Subject</th>
                <th>Max Marks</th>
                <th>Passing</th>
                <th>Obtained Marks</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {markRows.length > 0 ? (
                markRows.map(({ student, subject, key }) => {
                  const draft = drafts[key] ?? {
                    obtainedMarks: '',
                    remarks: '',
                  }
                  return (
                    <tr key={key}>
                      <td>
                        <span className="table-primary">
                          {student.admissionNo}
                        </span>
                      </td>
                      <td>
                        <strong className="table-block">{student.name}</strong>
                      </td>
                      <td>
                        <strong className="table-block">{subject.name}</strong>
                        <span className="table-secondary">
                          {subject.code || '—'}
                        </span>
                      </td>
                      <td>{subject.maxMarks}</td>
                      <td>{subject.passingMarks}</td>
                      <td>
                        <input
                          aria-label={`${subject.name} marks for ${student.name}`}
                          className="marks-input"
                          max={subject.maxMarks}
                          min="0"
                          type="number"
                          value={draft.obtainedMarks}
                          onChange={(event) =>
                            updateDraft(student.id, subject.id, {
                              obtainedMarks: event.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`${subject.name} remarks for ${student.name}`}
                          className="attendance-remarks-input"
                          placeholder="Optional remarks"
                          value={draft.remarks}
                          onChange={(event) =>
                            updateDraft(student.id, subject.id, {
                              remarks: event.target.value,
                            })
                          }
                        />
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td className="empty-table" colSpan={7}>
                    {isLoading ? 'Loading saved marks...' : emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
