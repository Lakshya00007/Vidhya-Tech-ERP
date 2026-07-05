import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { getErrorMessage, getTimetableErpApi } from '../../lib/erpApi'
import { exportCsv, formatGeneratedAt } from '../../lib/reportUtils'
import type {
  TimetableEntry,
  TimetablePeriod,
  TimetableWeekday,
} from '../../types'
import type { TimetableChildProps } from './types'

interface TimetablePrintGridProps {
  entries: TimetableEntry[]
  periods: TimetablePeriod[]
  weekdays: TimetableWeekday[]
  mode: 'class' | 'teacher'
  schoolName: string
  schoolContact: string
  subtitle: string
  title: string
}

const cellKey = (weekdayId: string, periodId: string) =>
  `${weekdayId}:${periodId}`

function TimetablePrintGrid({
  entries,
  periods,
  weekdays,
  mode,
  schoolName,
  schoolContact,
  subtitle,
  title,
}: TimetablePrintGridProps) {
  const entryMap = new Map(
    entries.map((entry) => [
      cellKey(entry.weekdayId, entry.periodId),
      entry,
    ]),
  )

  return (
    <div className="timetable-print-area">
      <header className="timetable-print-header">
        <div>
          <h2>{schoolName || 'Vidhya School ERP'}</h2>
          {schoolContact && <p>{schoolContact}</p>}
        </div>
        <div>
          <strong>{title}</strong>
          <span>{subtitle}</span>
          <small>Generated {formatGeneratedAt()}</small>
        </div>
      </header>
      <div className="timetable-grid-scroll">
        <table className="timetable-grid timetable-grid--view">
          <thead>
            <tr>
              <th>Weekday</th>
              {periods.map((period) => (
                <th key={period.id}>
                  <strong>{period.name}</strong>
                  <span>
                    {period.startTime} – {period.endTime}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekdays.map((weekday) => (
              <tr key={weekday.id}>
                <th>{weekday.name}</th>
                {periods.map((period) => {
                  const entry = entryMap.get(
                    cellKey(weekday.id, period.id),
                  )
                  return (
                    <td
                      className={
                        period.isBreak
                          ? 'timetable-grid__break'
                          : entry
                            ? 'timetable-grid__assigned'
                            : ''
                      }
                      key={period.id}
                    >
                      {period.isBreak ? (
                        <div className="timetable-break-cell">
                          <strong>Break</strong>
                        </div>
                      ) : entry ? (
                        <div className="timetable-view-cell">
                          <strong>
                            {mode === 'class'
                              ? entry.subjectName
                              : `${entry.className}${entry.section ? `-${entry.section}` : ''}`}
                          </strong>
                          <span>
                            {mode === 'class'
                              ? entry.teacherName
                              : entry.subjectName}
                          </span>
                          <small>{entry.classroomName || '—'}</small>
                        </div>
                      ) : (
                        <span className="timetable-free-cell">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {entries.length === 0 && (
        <p className="timetable-print-empty">No timetable entries found.</p>
      )}
    </div>
  )
}

export function ClassTimetable({
  data,
  onNotice,
}: TimetableChildProps) {
  const activeClasses = data.classes.filter((item) => item.status === 'Active')
  const initialClassName = activeClasses[0]?.name ?? ''
  const [className, setClassName] = useState(initialClassName)
  const [section, setSection] = useState(
    data.sections.find(
      (item) =>
        item.status === 'Active' && item.className === initialClassName,
    )?.name ?? '',
  )
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const sections = data.sections.filter(
    (item) => item.status === 'Active' && item.className === className,
  )
  const weekdays = data.weekdays.filter((item) => item.isActive)
  const schoolContact = [
    data.settings.address,
    data.settings.phone,
    data.settings.email,
  ]
    .filter(Boolean)
    .join(' · ')

  useEffect(() => {
    if (!className) {
      return
    }
    let current = true
    Promise.resolve()
      .then(() => {
        if (current) setIsLoading(true)
        return getTimetableErpApi().getTimetableByClass(className, section)
      })
      .then((rows) => {
        if (current) setEntries(rows)
      })
      .catch((error: unknown) => {
        if (current) {
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (current) setIsLoading(false)
      })
    return () => {
      current = false
    }
  }, [className, onNotice, section])

  const exportRows = () => {
    exportCsv(
      `class-timetable-${className || 'class'}${section ? `-${section}` : ''}.csv`,
      [
        'Weekday',
        'Period',
        'Time',
        'Class',
        'Section',
        'Subject',
        'Teacher',
        'Class Room',
        'Notes',
      ],
      entries.map((entry) => [
        entry.weekdayName,
        entry.periodName,
        `${entry.startTime}-${entry.endTime}`,
        entry.className,
        entry.section,
        entry.subjectName,
        entry.teacherName,
        entry.classroomName,
        entry.notes,
      ]),
    )
    onNotice({
      type: 'success',
      message: `${entries.length} timetable entries were exported.`,
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
    <section className="panel timetable-view-panel">
      <div className="timetable-view-toolbar">
        <div>
          <h3>Class Timetable</h3>
          <p>View, print or export a class and section schedule.</p>
        </div>
        <div className="timetable-filter-fields">
          <label className="form-field">
            <span>Class</span>
            <select
              onChange={(event) => {
                const nextClass = event.target.value
                setClassName(nextClass)
                setSection(
                  data.sections.find(
                    (item) =>
                      item.status === 'Active' &&
                      item.className === nextClass,
                  )?.name ?? '',
                )
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
              onChange={(event) => setSection(event.target.value)}
              value={section}
            >
              <option value="">No Section</option>
              {sections.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="secondary-button"
            disabled={entries.length === 0}
            onClick={exportRows}
            type="button"
          >
            <Icon name="download" size={15} />
            Export CSV
          </button>
          <button
            className="primary-button"
            disabled={entries.length === 0}
            onClick={() => window.setTimeout(() => window.print(), 50)}
            type="button"
          >
            <Icon name="print" size={15} />
            Print
          </button>
        </div>
      </div>
      {isLoading ? (
        <div className="timetable-view-loading">
          <span className="loading-spinner" />
          Loading timetable...
        </div>
      ) : (
        <TimetablePrintGrid
          entries={entries}
          mode="class"
          periods={data.periods}
          schoolContact={schoolContact}
          schoolName={data.settings.schoolName}
          subtitle={`Class ${className}${section ? ` · Section ${section}` : ''}${data.settings.academicYear ? ` · ${data.settings.academicYear}` : ''}`}
          title="Class Timetable"
          weekdays={weekdays}
        />
      )}
    </section>
  )
}

export function TeacherTimetable({
  data,
  onNotice,
}: TimetableChildProps) {
  const teachers = data.employees.filter((item) => item.status === 'Active')
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? '')
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const teacher = teachers.find((item) => item.id === teacherId)
  const weekdays = data.weekdays.filter((item) => item.isActive)
  const schoolContact = [
    data.settings.address,
    data.settings.phone,
    data.settings.email,
  ]
    .filter(Boolean)
    .join(' · ')

  useEffect(() => {
    if (!teacherId) {
      return
    }
    let current = true
    Promise.resolve()
      .then(() => {
        if (current) setIsLoading(true)
        return getTimetableErpApi().getTimetableByTeacher(teacherId)
      })
      .then((rows) => {
        if (current) setEntries(rows)
      })
      .catch((error: unknown) => {
        if (current) {
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (current) setIsLoading(false)
      })
    return () => {
      current = false
    }
  }, [onNotice, teacherId])

  const exportRows = () => {
    exportCsv(
      `teacher-timetable-${teacher?.employeeNo || 'teacher'}.csv`,
      [
        'Weekday',
        'Period',
        'Time',
        'Teacher',
        'Class',
        'Section',
        'Subject',
        'Class Room',
        'Notes',
      ],
      entries.map((entry) => [
        entry.weekdayName,
        entry.periodName,
        `${entry.startTime}-${entry.endTime}`,
        entry.teacherName,
        entry.className,
        entry.section,
        entry.subjectName,
        entry.classroomName,
        entry.notes,
      ]),
    )
    onNotice({
      type: 'success',
      message: `${entries.length} timetable entries were exported.`,
    })
  }

  if (teachers.length === 0) {
    return (
      <section className="panel document-empty-state">
        <Icon name="user" size={26} />
        <h3>Create an active employee first.</h3>
        <p>Active employees are available as timetable teachers.</p>
      </section>
    )
  }

  return (
    <section className="panel timetable-view-panel">
      <div className="timetable-view-toolbar">
        <div>
          <h3>Teacher Timetable</h3>
          <p>Review every class period assigned to a teacher.</p>
        </div>
        <div className="timetable-filter-fields timetable-filter-fields--teacher">
          <label className="form-field">
            <span>Teacher</span>
            <select
              onChange={(event) => setTeacherId(event.target.value)}
              value={teacherId}
            >
              {teachers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.designation ? ` · ${item.designation}` : ''}
                </option>
              ))}
            </select>
          </label>
          <button
            className="secondary-button"
            disabled={entries.length === 0}
            onClick={exportRows}
            type="button"
          >
            <Icon name="download" size={15} />
            Export CSV
          </button>
          <button
            className="primary-button"
            disabled={entries.length === 0}
            onClick={() => window.setTimeout(() => window.print(), 50)}
            type="button"
          >
            <Icon name="print" size={15} />
            Print
          </button>
        </div>
      </div>
      {isLoading ? (
        <div className="timetable-view-loading">
          <span className="loading-spinner" />
          Loading timetable...
        </div>
      ) : (
        <TimetablePrintGrid
          entries={entries}
          mode="teacher"
          periods={data.periods}
          schoolContact={schoolContact}
          schoolName={data.settings.schoolName}
          subtitle={`${teacher?.name || 'Teacher'}${teacher?.designation ? ` · ${teacher.designation}` : ''}${data.settings.academicYear ? ` · ${data.settings.academicYear}` : ''}`}
          title="Teacher Timetable"
          weekdays={weekdays}
        />
      )}
    </section>
  )
}
