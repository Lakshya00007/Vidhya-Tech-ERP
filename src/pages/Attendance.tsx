import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import {
  getAttendanceErpApi,
  getErpApi,
  getErrorMessage,
} from '../lib/erpApi'
import type {
  AttendanceRecord,
  AttendanceStatus,
  ClassItem,
  SectionItem,
  Student,
} from '../types'

interface AttendanceDraft {
  recordId?: string
  status: AttendanceStatus | null
  remarks: string
}

const getTodayValue = () => {
  const today = new Date()
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')
}

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date)
}

const studentsForRegister = (
  students: Student[],
  className: string,
  section: string,
) =>
  students.filter(
    (student) =>
      student.status === 'Active' &&
      student.className === className &&
      (!section || student.section === section),
  )

const buildDrafts = (
  students: Student[],
  records: AttendanceRecord[],
  className: string,
  section: string,
) =>
  Object.fromEntries(
    studentsForRegister(students, className, section).map((student) => {
      const record = records.find((item) => item.studentId === student.id)
      return [
        student.id,
        {
          recordId: record?.id,
          status: record?.status ?? null,
          remarks: record?.remarks ?? '',
        } satisfies AttendanceDraft,
      ]
    }),
  )

export function Attendance() {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [sections, setSections] = useState<SectionItem[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedDate, setSelectedDate] = useState(getTodayValue)
  const [drafts, setDrafts] = useState<Record<string, AttendanceDraft>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isRegisterLoading, setIsRegisterLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true
    const initialDate = getTodayValue()

    const loadInitialData = async () => {
      try {
        const api = getErpApi()
        const [classRows, sectionRows, studentRows] = await Promise.all([
          api.getClasses(),
          api.getSections(),
          api.getStudents(),
        ])
        const firstClass =
          classRows.find((item) => item.status === 'Active')?.name ?? ''
        const firstSection =
          sectionRows.find(
            (item) =>
              item.status === 'Active' && item.className === firstClass,
          )?.name ?? ''

        let records: AttendanceRecord[] = []
        let attendanceError = ''
        if (firstClass) {
          try {
            records = await getAttendanceErpApi().getAttendanceByClassDate(
              firstClass,
              firstSection,
              initialDate,
            )
          } catch (loadError) {
            attendanceError = getErrorMessage(loadError)
          }
        }

        if (!isCurrent) return
        setClasses(classRows)
        setSections(sectionRows)
        setStudents(studentRows)
        setSelectedClass(firstClass)
        setSelectedSection(firstSection)
        setDrafts(
          buildDrafts(studentRows, records, firstClass, firstSection),
        )
        setError(attendanceError)
      } catch (loadError) {
        if (isCurrent) {
          setError(getErrorMessage(loadError))
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    void loadInitialData()

    return () => {
      isCurrent = false
    }
  }, [])

  const activeClasses = useMemo(
    () => classes.filter((item) => item.status === 'Active'),
    [classes],
  )
  const availableSections = useMemo(
    () =>
      sections.filter(
        (item) =>
          item.status === 'Active' && item.className === selectedClass,
      ),
    [sections, selectedClass],
  )
  const visibleStudents = useMemo(
    () =>
      studentsForRegister(students, selectedClass, selectedSection),
    [students, selectedClass, selectedSection],
  )

  const summary = useMemo(() => {
    const values = visibleStudents.map((student) => drafts[student.id]?.status)
    return {
      present: values.filter((status) => status === 'Present').length,
      absent: values.filter((status) => status === 'Absent').length,
      leave: values.filter((status) => status === 'Leave').length,
      unmarked: values.filter((status) => !status).length,
    }
  }, [drafts, visibleStudents])

  const loadRegister = async (
    className: string,
    section: string,
    date: string,
  ) => {
    setIsRegisterLoading(true)
    try {
      const records = className
        ? await getAttendanceErpApi().getAttendanceByClassDate(
            className,
            section,
            date,
          )
        : []
      setDrafts(buildDrafts(students, records, className, section))
      setError('')
      setMessage('')
    } catch (loadError) {
      setDrafts(buildDrafts(students, [], className, section))
      setError(getErrorMessage(loadError))
      setMessage('')
    } finally {
      setIsRegisterLoading(false)
    }
  }

  const changeClass = (className: string) => {
    const section =
      sections.find(
        (item) => item.status === 'Active' && item.className === className,
      )?.name ?? ''
    setSelectedClass(className)
    setSelectedSection(section)
    void loadRegister(className, section, selectedDate)
  }

  const changeSection = (section: string) => {
    setSelectedSection(section)
    void loadRegister(selectedClass, section, selectedDate)
  }

  const changeDate = (date: string) => {
    setSelectedDate(date)
    void loadRegister(selectedClass, selectedSection, date)
  }

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setDrafts((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        status,
        remarks: current[studentId]?.remarks ?? '',
      },
    }))
    setMessage('')
  }

  const setRemarks = (studentId: string, remarks: string) => {
    setDrafts((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        status: current[studentId]?.status ?? null,
        remarks,
      },
    }))
    setMessage('')
  }

  const markAll = (status: AttendanceStatus) => {
    setDrafts((current) =>
      Object.fromEntries(
        visibleStudents.map((student) => [
          student.id,
          {
            ...current[student.id],
            status,
            remarks: current[student.id]?.remarks ?? '',
          },
        ]),
      ),
    )
    setMessage('')
  }

  const saveAttendance = async () => {
    if (visibleStudents.length === 0) {
      setError('There are no active students in the selected class and section.')
      return
    }
    if (summary.unmarked > 0) {
      setError(`Mark attendance for all students before saving (${summary.unmarked} remaining).`)
      return
    }

    setIsSaving(true)
    try {
      const savedRecords = await getAttendanceErpApi().saveAttendanceBulk(
        visibleStudents.map((student) => ({
          studentId: student.id,
          attendanceDate: selectedDate,
          status: drafts[student.id].status as AttendanceStatus,
          remarks: drafts[student.id].remarks,
        })),
      )
      setDrafts(
        buildDrafts(
          students,
          savedRecords,
          selectedClass,
          selectedSection,
        ),
      )
      setMessage(
        `Attendance saved for Class ${selectedClass}${selectedSection ? `-${selectedSection}` : ''}.`,
      )
      setError('')
    } catch (saveError) {
      setError(getErrorMessage(saveError))
      setMessage('')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h2>Daily Attendance</h2>
          <p>Mark and review student attendance by class, section and date.</p>
        </div>
        <button
          className="primary-button"
          disabled={visibleStudents.length === 0 || isSaving}
          type="button"
          onClick={() => void saveAttendance()}
        >
          <Icon name="check" size={18} />
          {isSaving ? 'Saving...' : 'Save Attendance'}
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

      {error && (
        <div className="inline-message inline-message--error">
          <Icon name="close" size={17} />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      <section className="panel filter-panel">
        <div className="filter-group">
          <label className="form-field form-field--compact">
            <span>Class</span>
            <select
              disabled={activeClasses.length === 0}
              value={selectedClass}
              onChange={(event) => changeClass(event.target.value)}
            >
              {activeClasses.length === 0 && (
                <option value="">Create classes from Settings first</option>
              )}
              {activeClasses.map((item) => (
                <option key={item.id} value={item.name}>Class {item.name}</option>
              ))}
            </select>
          </label>
          <label className="form-field form-field--compact">
            <span>Section</span>
            <select
              disabled={availableSections.length === 0}
              value={selectedSection}
              onChange={(event) => changeSection(event.target.value)}
            >
              {availableSections.length === 0 && (
                <option value="">No sections configured</option>
              )}
              {availableSections.map((item) => (
                <option key={item.id} value={item.name}>Section {item.name}</option>
              ))}
            </select>
          </label>
          <label className="form-field form-field--date">
            <span>Date</span>
            <input
              value={selectedDate}
              onChange={(event) => changeDate(event.target.value)}
              type="date"
            />
          </label>
        </div>
        <div className="attendance-summary">
          <span><i className="summary-dot summary-dot--present" />Present <strong>{summary.present}</strong></span>
          <span><i className="summary-dot summary-dot--absent" />Absent <strong>{summary.absent}</strong></span>
          <span><i className="summary-dot summary-dot--leave" />Leave <strong>{summary.leave}</strong></span>
          <span><i className="summary-dot summary-dot--unmarked" />Unmarked <strong>{summary.unmarked}</strong></span>
        </div>
      </section>

      <section className="panel attendance-panel">
        <div className="panel-heading attendance-heading">
          <div>
            <h3>
              {selectedClass
                ? `Class ${selectedClass}${selectedSection ? `-${selectedSection}` : ''} Register`
                : 'Attendance Register'}
            </h3>
            <p>{visibleStudents.length} students · {formatDate(selectedDate)}</p>
          </div>
          <div className="attendance-actions">
            <button
              className="secondary-button secondary-button--small"
              disabled={visibleStudents.length === 0}
              type="button"
              onClick={() => markAll('Present')}
            >
              Mark All Present
            </button>
            <button
              className="secondary-button secondary-button--small"
              disabled={visibleStudents.length === 0}
              type="button"
              onClick={() => markAll('Absent')}
            >
              Mark All Absent
            </button>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table attendance-table">
            <thead>
              <tr>
                <th>Admission No.</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Section</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {visibleStudents.length > 0 ? (
                visibleStudents.map((student) => {
                  const draft = drafts[student.id] ?? {
                    status: null,
                    remarks: '',
                  }
                  return (
                    <tr key={student.id}>
                      <td><span className="table-primary">{student.admissionNo}</span></td>
                      <td>
                        <div className="person-cell">
                          <span className="person-avatar person-avatar--blue">
                            {student.name.split(' ').map((name) => name[0]).join('').slice(0, 2)}
                          </span>
                          <strong>{student.name}</strong>
                        </div>
                      </td>
                      <td>{student.className}</td>
                      <td>{student.section || '—'}</td>
                      <td>
                        <div className="attendance-selector">
                          {(['Present', 'Absent', 'Leave'] as AttendanceStatus[]).map(
                            (status) => (
                              <button
                                className={`attendance-option attendance-option--${status.toLowerCase()}${draft.status === status ? ' attendance-option--selected' : ''}`}
                                key={status}
                                onClick={() => setStatus(student.id, status)}
                                type="button"
                              >
                                {status}
                              </button>
                            ),
                          )}
                        </div>
                      </td>
                      <td>
                        <input
                          aria-label={`Remarks for ${student.name}`}
                          className="attendance-remarks-input"
                          placeholder="Optional remarks"
                          value={draft.remarks}
                          onChange={(event) => setRemarks(student.id, event.target.value)}
                        />
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td className="empty-table" colSpan={6}>
                    {isLoading || isRegisterLoading
                      ? 'Loading attendance register...'
                      : activeClasses.length === 0
                        ? 'Create classes from Settings first.'
                        : !selectedClass
                          ? 'Select a class to load students.'
                        : 'No active students found for the selected class and section.'}
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
