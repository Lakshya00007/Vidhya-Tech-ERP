import { useMemo, useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { getErrorMessage, getTimetableErpApi } from '../../lib/erpApi'
import type {
  SaveTimetableEntryInput,
  TimetablePeriod,
  TimetableWeekday,
} from '../../types'
import type { TimetableChildProps } from './types'

interface SelectedSlot {
  weekdayId: string
  periodId: string
}

const cellKey = (weekdayId: string, periodId: string) =>
  `${weekdayId}:${periodId}`

export function TimetableEditor({
  data,
  onNotice,
  onRefresh,
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
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)
  const [subjectId, setSubjectId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [classroomId, setClassroomId] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const weekdays = data.weekdays.filter((item) => item.isActive)
  const periods = data.periods
  const availableSections = data.sections.filter(
    (item) => item.status === 'Active' && item.className === className,
  )
  const availableSubjects = data.subjects.filter(
    (item) => item.status === 'Active' && item.className === className,
  )
  const teachers = data.employees.filter((item) => item.status === 'Active')
  const rooms = data.classrooms.filter((item) => item.status === 'Active')
  const classEntries = data.entries.filter(
    (item) => item.className === className && item.section === section,
  )
  const entryMap = useMemo(
    () =>
      new Map(
        classEntries.map((entry) => [
          cellKey(entry.weekdayId, entry.periodId),
          entry,
        ]),
      ),
    [classEntries],
  )

  const selectedPeriod = selectedSlot
    ? periods.find((item) => item.id === selectedSlot.periodId)
    : undefined
  const selectedWeekday = selectedSlot
    ? weekdays.find((item) => item.id === selectedSlot.weekdayId)
    : undefined
  const selectedEntry = selectedSlot
    ? entryMap.get(cellKey(selectedSlot.weekdayId, selectedSlot.periodId))
    : undefined

  const selectClass = (value: string) => {
    setClassName(value)
    setSection(
      data.sections.find(
        (item) => item.status === 'Active' && item.className === value,
      )?.name ?? '',
    )
    setSelectedSlot(null)
  }

  const openSlot = (weekday: TimetableWeekday, period: TimetablePeriod) => {
    if (period.isBreak) return
    const existing = entryMap.get(cellKey(weekday.id, period.id))
    setSelectedSlot({ weekdayId: weekday.id, periodId: period.id })
    setSubjectId(existing?.subjectId ?? '')
    setTeacherId(existing?.teacherId ?? '')
    setClassroomId(existing?.classroomId ?? '')
    setNotes(existing?.notes ?? '')
    onNotice(null)
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedSlot) return
    const input: SaveTimetableEntryInput = {
      className,
      section,
      weekdayId: selectedSlot.weekdayId,
      periodId: selectedSlot.periodId,
      subjectId,
      teacherId,
      classroomId,
      notes,
    }
    try {
      setIsSaving(true)
      const saved =
        await getTimetableErpApi().createOrUpdateTimetableEntry(input)
      await onRefresh()
      onNotice({
        type: 'success',
        message: `${saved.weekdayName} ${saved.periodName} was saved. Teacher and classroom conflicts were checked.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const remove = async () => {
    if (!selectedEntry) return
    if (!window.confirm('Remove this timetable entry?')) return
    try {
      await getTimetableErpApi().deleteTimetableEntry(selectedEntry.id)
      await onRefresh()
      setSelectedSlot(null)
      onNotice({
        type: 'success',
        message: 'The timetable entry was removed.',
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  if (activeClasses.length === 0) {
    return (
      <section className="panel document-empty-state">
        <Icon name="building" size={26} />
        <h3>Create classes from Settings first.</h3>
        <p>A class is required before timetable entries can be assigned.</p>
      </section>
    )
  }

  if (periods.length === 0) {
    return (
      <section className="panel document-empty-state">
        <Icon name="clock" size={26} />
        <h3>Create time periods first.</h3>
        <p>Add teaching periods and breaks from the Time Periods tab.</p>
      </section>
    )
  }

  return (
    <div className="timetable-editor-layout">
      <section className="panel timetable-grid-panel">
        <div className="timetable-toolbar">
          <div>
            <h3>Create Timetable</h3>
            <p>Select a cell to assign its subject, teacher and room.</p>
          </div>
          <div className="timetable-filter-fields">
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
                onChange={(event) => {
                  setSection(event.target.value)
                  setSelectedSlot(null)
                }}
                value={section}
              >
                <option value="">No Section</option>
                {availableSections.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {weekdays.length === 0 ? (
          <div className="empty-table">Enable at least one weekday.</div>
        ) : (
          <div className="timetable-grid-scroll">
            <table className="timetable-grid">
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
                      const isSelected =
                        selectedSlot?.weekdayId === weekday.id &&
                        selectedSlot.periodId === period.id
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
                              <Icon name="clock" size={16} />
                              <strong>Break</strong>
                            </div>
                          ) : (
                            <button
                              className={`timetable-cell-button${
                                isSelected
                                  ? ' timetable-cell-button--selected'
                                  : ''
                              }`}
                              onClick={() => openSlot(weekday, period)}
                              type="button"
                            >
                              {entry ? (
                                <>
                                  <strong>{entry.subjectName}</strong>
                                  <span>{entry.teacherName}</span>
                                  <small>
                                    {entry.classroomName || 'Room not set'}
                                  </small>
                                </>
                              ) : (
                                <>
                                  <Icon name="plus" size={16} />
                                  <span>Assign</span>
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <form className="panel timetable-cell-editor" onSubmit={save}>
        <div className="panel-heading">
          <div>
            <h3>{selectedEntry ? 'Edit Period Assignment' : 'Assign Period'}</h3>
            <p>
              {selectedWeekday && selectedPeriod
                ? `${selectedWeekday.name} · ${selectedPeriod.name} · ${selectedPeriod.startTime}–${selectedPeriod.endTime}`
                : 'Select a timetable cell to begin.'}
            </p>
          </div>
        </div>
        {selectedSlot ? (
          <>
            <div className="timetable-form-fields">
              <label className="form-field">
                <span>Subject</span>
                <select
                  onChange={(event) => setSubjectId(event.target.value)}
                  required
                  value={subjectId}
                >
                  <option value="">Select subject</option>
                  {availableSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                      {subject.code ? ` (${subject.code})` : ''}
                    </option>
                  ))}
                </select>
                {availableSubjects.length === 0 && (
                  <small>Create subjects for {className} from Subjects.</small>
                )}
              </label>
              <label className="form-field">
                <span>Teacher</span>
                <select
                  onChange={(event) => setTeacherId(event.target.value)}
                  required
                  value={teacherId}
                >
                  <option value="">Select teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                      {teacher.designation
                        ? ` · ${teacher.designation}`
                        : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Class Room</span>
                <select
                  onChange={(event) => setClassroomId(event.target.value)}
                  value={classroomId}
                >
                  <option value="">No room selected</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                      {room.capacity ? ` · ${room.capacity} seats` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Notes</span>
                <textarea
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional period note"
                  rows={3}
                  value={notes}
                />
              </label>
            </div>
            <div className="timetable-cell-actions">
              {selectedEntry && (
                <button
                  className="secondary-button timetable-delete-button"
                  onClick={() => void remove()}
                  type="button"
                >
                  <Icon name="trash" size={15} />
                  Remove
                </button>
              )}
              <button
                className="primary-button"
                disabled={
                  isSaving ||
                  !subjectId ||
                  !teacherId ||
                  availableSubjects.length === 0
                }
                type="submit"
              >
                <Icon name="check" size={16} />
                {isSaving ? 'Saving...' : 'Save Cell'}
              </button>
            </div>
          </>
        ) : (
          <div className="timetable-cell-empty">
            <Icon name="calendar" size={30} />
            <strong>No period selected</strong>
            <p>Choose a non-break cell from the grid.</p>
          </div>
        )}
      </form>
    </div>
  )
}
