/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import { exportCsv, formatReportDate } from '../../lib/reportUtils'
import type {
  AcademicSession,
  ClassItem,
  Employee,
  Exam,
  SchoolSettings,
  SectionItem,
  Subject,
} from '../../types'
import type { ExamNotice } from './types'

interface ExamOperationalProps {
  academicSessions: AcademicSession[]
  classes: ClassItem[]
  employees: Employee[]
  exams: Exam[]
  sections: SectionItem[]
  settings: SchoolSettings
  subjects: Subject[]
  onNotice: (notice: ExamNotice | null) => void
}

type AnyRow = Record<string, any>

const today = () => new Date().toISOString().slice(0, 10)

const printPage = () => window.print()

const optionLabel = (value: string) => value || 'All'

const classSections = (sections: SectionItem[], className: string) =>
  sections.filter((section) => !className || section.className === className)

const classSubjects = (subjects: Subject[], className: string) =>
  subjects.filter((subject) => !className || subject.className === className)

function SchoolPrintHeader({
  settings,
  title,
  subtitle,
}: {
  settings: SchoolSettings
  title: string
  subtitle: string
}) {
  return (
    <header className="report-document-header">
      <div className="report-school-identity">
        <span className="report-school-mark">
          <Icon name="school" size={24} />
        </span>
        <div>
          <h2>{settings.schoolName || 'Vidhya School ERP'}</h2>
          {settings.address && <p>{settings.address}</p>}
          {(settings.phone || settings.email) && (
            <span>{[settings.phone, settings.email].filter(Boolean).join(' | ')}</span>
          )}
        </div>
      </div>
      <div className="report-document-title">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </header>
  )
}

export function ExamScheduleTab({
  academicSessions,
  classes,
  employees,
  exams,
  sections,
  settings,
  subjects,
  onNotice,
}: ExamOperationalProps) {
  const [schedules, setSchedules] = useState<AnyRow[]>([])
  const [selectedSchedule, setSelectedSchedule] = useState<AnyRow | null>(null)
  const [entries, setEntries] = useState<AnyRow[]>([])
  const [form, setForm] = useState({
    academicSessionId: '',
    examId: '',
    title: '',
    startDate: today(),
    endDate: today(),
    instructions: '',
  })
  const [entry, setEntry] = useState({
    className: '',
    section: '',
    subjectId: '',
    examDate: today(),
    startTime: '',
    endTime: '',
    room: '',
    maximumMarks: '',
    passingMarks: '',
    invigilatorEmployeeId: '',
    instructions: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  const selectedExam = exams.find((exam) => exam.id === form.examId)
  const entrySections = classSections(sections, entry.className)
  const entrySubjects = classSubjects(subjects, entry.className)

  const loadSchedules = () =>
    getErpApi()
      .getExamSchedules({})
      .then(setSchedules)
      .catch((error) =>
        onNotice({ type: 'error', message: getErrorMessage(error) }),
      )

  useEffect(() => {
    void loadSchedules()
  }, [])

  const openSchedule = async (schedule: AnyRow) => {
    try {
      const full = await getErpApi().getExamSchedule(schedule.id)
      setSelectedSchedule(full)
      setEntries(full?.entries ?? [])
      setForm({
        academicSessionId: full?.academicSessionId ?? '',
        examId: full?.examId ?? '',
        title: full?.title ?? '',
        startDate: full?.startDate ?? today(),
        endDate: full?.endDate ?? today(),
        instructions: full?.instructions ?? '',
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const saveSchedule = async () => {
    setIsSaving(true)
    try {
      const payload = {
        ...form,
        title: form.title || selectedExam?.name || 'Exam Schedule',
      }
      const saved = selectedSchedule
        ? await getErpApi().updateExamSchedule(selectedSchedule.id, payload)
        : await getErpApi().createExamSchedule(payload)
      setSelectedSchedule(saved)
      setEntries(saved.entries ?? [])
      await loadSchedules()
      onNotice({ type: 'success', message: 'Exam schedule saved.' })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const saveEntries = async (nextEntries: AnyRow[]) => {
    if (!selectedSchedule) {
      onNotice({ type: 'error', message: 'Create or select a schedule first.' })
      return
    }
    try {
      const saved = await getErpApi().saveExamScheduleEntries(
        selectedSchedule.id,
        nextEntries,
      )
      setEntries(saved)
      const full = await getErpApi().getExamSchedule(selectedSchedule.id)
      setSelectedSchedule(full)
      await loadSchedules()
      onNotice({ type: 'success', message: 'Schedule entries saved.' })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const addEntry = () => {
    const subject = subjects.find((item) => item.id === entry.subjectId)
    const employee = employees.find(
      (item) => item.id === entry.invigilatorEmployeeId,
    )
    void saveEntries([
      ...entries,
      {
        ...entry,
        id: '',
        subjectName: subject?.name ?? '',
        invigilatorName: employee?.name ?? '',
        maximumMarks: entry.maximumMarks ? Number(entry.maximumMarks) : undefined,
        passingMarks: entry.passingMarks ? Number(entry.passingMarks) : undefined,
      },
    ])
  }

  const removeEntry = (id: string) => {
    void saveEntries(entries.filter((item) => item.id !== id))
  }

  const setStatus = async (action: 'publish' | 'cancel' | 'complete') => {
    if (!selectedSchedule) return
    try {
      const api = getErpApi()
      const saved =
        action === 'publish'
          ? await api.publishExamSchedule(selectedSchedule.id)
          : action === 'cancel'
            ? await api.cancelExamSchedule(selectedSchedule.id)
            : await api.completeExamSchedule(selectedSchedule.id)
      setSelectedSchedule(saved)
      setEntries(saved.entries ?? [])
      await loadSchedules()
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const scheduleColumns: TableColumn<AnyRow>[] = [
    { key: 'title', header: 'Schedule', render: (row) => row.title || row.examName },
    { key: 'exam', header: 'Exam', render: (row) => row.examName },
    { key: 'range', header: 'Date Range', render: (row) => `${row.startDate} to ${row.endDate}` },
    { key: 'status', header: 'Status', render: (row) => <span className="neutral-badge">{row.status}</span> },
    { key: 'entries', header: 'Papers', render: (row) => row.entryCount ?? row.entries?.length ?? 0 },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <button className="secondary-button secondary-button--compact" type="button" onClick={() => void openSchedule(row)}>
          Open
        </button>
      ),
    },
  ]

  const entryColumns: TableColumn<AnyRow>[] = [
    { key: 'date', header: 'Date', render: (row) => formatReportDate(row.examDate) },
    { key: 'class', header: 'Class', render: (row) => `${row.className}${row.section ? `-${row.section}` : ''}` },
    { key: 'subject', header: 'Subject', render: (row) => row.subjectName },
    { key: 'time', header: 'Time', render: (row) => `${row.startTime || '--'} to ${row.endTime || '--'}` },
    { key: 'room', header: 'Room', render: (row) => row.room || '--' },
    { key: 'marks', header: 'Marks', render: (row) => `${row.maximumMarks ?? 0}/${row.passingMarks ?? 0}` },
    { key: 'invigilator', header: 'Invigilator', render: (row) => row.invigilatorName || '--' },
    {
      key: 'remove',
      header: '',
      render: (row) => (
        <button className="ghost-button" type="button" onClick={() => removeEntry(row.id)}>
          Remove
        </button>
      ),
    },
  ]

  return (
    <div className="page-stack">
      <section className="panel report-filters">
        <div className="report-filter-fields">
          <label className="form-field">
            <span>Academic Session</span>
            <select
              value={form.academicSessionId}
              onChange={(event) => setForm({ ...form, academicSessionId: event.target.value })}
            >
              <option value="">No session</option>
              {academicSessions.map((session) => (
                <option key={session.id} value={session.id}>{session.sessionName}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Exam</span>
            <select
              value={form.examId}
              onChange={(event) => {
                const exam = exams.find((item) => item.id === event.target.value)
                setForm({
                  ...form,
                  examId: event.target.value,
                  title: form.title || exam?.name || '',
                  startDate: exam?.examDate || form.startDate,
                  endDate: exam?.examDate || form.endDate,
                })
              }}
            >
              <option value="">Select exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>{exam.name} - Class {exam.className}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Title</span>
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label className="form-field">
            <span>Start Date</span>
            <input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
          </label>
          <label className="form-field">
            <span>End Date</span>
            <input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
          </label>
        </div>
        <label className="form-field">
          <span>Instructions</span>
          <textarea value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} />
        </label>
        <div className="form-actions">
          <button className="secondary-button" type="button" onClick={() => {
            setSelectedSchedule(null)
            setEntries([])
            setForm({ academicSessionId: '', examId: '', title: '', startDate: today(), endDate: today(), instructions: '' })
          }}>
            New
          </button>
          <button className="primary-button" disabled={isSaving} type="button" onClick={() => void saveSchedule()}>
            <Icon name="check" size={16} />
            {isSaving ? 'Saving...' : 'Save Schedule'}
          </button>
          {selectedSchedule && (
            <>
              <button className="secondary-button" type="button" onClick={() => void setStatus('publish')}>Publish</button>
              <button className="secondary-button" type="button" onClick={() => void setStatus('complete')}>Complete</button>
              <button className="secondary-button" type="button" onClick={() => void setStatus('cancel')}>Cancel</button>
            </>
          )}
        </div>
      </section>

      <section className="panel">
        <h3>Schedule List</h3>
        <DataTable columns={scheduleColumns} rows={schedules} getRowKey={(row) => row.id} emptyMessage="No exam schedules found." />
      </section>

      {selectedSchedule && (
        <section className="panel report-print-area">
          <SchoolPrintHeader settings={settings} title={selectedSchedule.title || 'Exam Schedule'} subtitle={`${selectedSchedule.examName} | ${selectedSchedule.startDate} to ${selectedSchedule.endDate}`} />
          <div className="report-toolbar no-print">
            <div>
              <strong>Class and Invigilator Schedule</strong>
              <span>{selectedSchedule.status}</span>
            </div>
            <div className="report-actions">
              <button className="secondary-button" type="button" onClick={() => exportCsv('exam-schedule.csv', ['Date', 'Class', 'Section', 'Subject', 'Start', 'End', 'Room', 'Invigilator'], entries.map((row) => [row.examDate, row.className, row.section, row.subjectName, row.startTime, row.endTime, row.room, row.invigilatorName]))}>
                <Icon name="download" size={16} />
                Export CSV
              </button>
              <button className="primary-button" type="button" onClick={printPage}>
                <Icon name="print" size={16} />
                Print
              </button>
            </div>
          </div>
          <DataTable columns={entryColumns} rows={entries} getRowKey={(row) => row.id || `${row.className}-${row.subjectName}-${row.examDate}`} emptyMessage="No papers added to this schedule." />
        </section>
      )}

      {selectedSchedule && (
        <section className="panel report-filters no-print">
          <h3>Add Paper</h3>
          <div className="report-filter-fields">
            <label className="form-field">
              <span>Class</span>
              <select value={entry.className} onChange={(event) => setEntry({ ...entry, className: event.target.value, section: '', subjectId: '' })}>
                <option value="">Select class</option>
                {classes.map((item) => <option key={item.id} value={item.name}>Class {item.name}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Section</span>
              <select value={entry.section} onChange={(event) => setEntry({ ...entry, section: event.target.value })}>
                <option value="">All sections</option>
                {entrySections.map((item) => <option key={item.id} value={item.name}>Section {item.name}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Subject</span>
              <select value={entry.subjectId} onChange={(event) => {
                const subject = subjects.find((item) => item.id === event.target.value)
                setEntry({
                  ...entry,
                  subjectId: event.target.value,
                  maximumMarks: subject?.maxMarks ? String(subject.maxMarks) : entry.maximumMarks,
                  passingMarks: subject?.passingMarks ? String(subject.passingMarks) : entry.passingMarks,
                })
              }}>
                <option value="">Select subject</option>
                {entrySubjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="form-field"><span>Date</span><input type="date" value={entry.examDate} onChange={(event) => setEntry({ ...entry, examDate: event.target.value })} /></label>
            <label className="form-field"><span>Start</span><input type="time" value={entry.startTime} onChange={(event) => setEntry({ ...entry, startTime: event.target.value })} /></label>
            <label className="form-field"><span>End</span><input type="time" value={entry.endTime} onChange={(event) => setEntry({ ...entry, endTime: event.target.value })} /></label>
            <label className="form-field"><span>Room</span><input value={entry.room} onChange={(event) => setEntry({ ...entry, room: event.target.value })} /></label>
            <label className="form-field"><span>Max Marks</span><input type="number" value={entry.maximumMarks} onChange={(event) => setEntry({ ...entry, maximumMarks: event.target.value })} /></label>
            <label className="form-field"><span>Passing Marks</span><input type="number" value={entry.passingMarks} onChange={(event) => setEntry({ ...entry, passingMarks: event.target.value })} /></label>
            <label className="form-field">
              <span>Invigilator</span>
              <select value={entry.invigilatorEmployeeId} onChange={(event) => setEntry({ ...entry, invigilatorEmployeeId: event.target.value })}>
                <option value="">Not assigned</option>
                {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
              </select>
            </label>
          </div>
          <button className="primary-button" type="button" onClick={addEntry}>
            <Icon name="plus" size={16} />
            Add Paper
          </button>
        </section>
      )}
    </div>
  )
}

function useExamReport<T>(
  loader: () => Promise<T>,
  deps: unknown[],
  onNotice: (notice: ExamNotice | null) => void,
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let current = true
    setIsLoading(true)
    loader()
      .then((next) => {
        if (current) setData(next)
      })
      .catch((error) => {
        if (current) onNotice({ type: 'error', message: getErrorMessage(error) })
      })
      .finally(() => {
        if (current) setIsLoading(false)
      })
    return () => {
      current = false
    }
  }, deps)

  return { data, isLoading }
}

export function DateSheetTab({
  exams,
  classes,
  sections,
  settings,
  onNotice,
}: ExamOperationalProps) {
  const [examId, setExamId] = useState('')
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')
  const { data, isLoading } = useExamReport(
    () => getErpApi().getDateSheet({ examId, className, section, publishedOnly: true }),
    [examId, className, section],
    onNotice,
  )
  const rows = data?.entries ?? []
  const filteredSections = classSections(sections, className)
  const columns: TableColumn<AnyRow>[] = [
    { key: 'date', header: 'Date', render: (row) => formatReportDate(row.examDate) },
    { key: 'day', header: 'Day', render: (row) => row.dayName },
    { key: 'class', header: 'Class', render: (row) => `${row.className}${row.section ? `-${row.section}` : ''}` },
    { key: 'subject', header: 'Subject', render: (row) => row.subjectName },
    { key: 'time', header: 'Time', render: (row) => `${row.startTime || '--'} to ${row.endTime || '--'}` },
    { key: 'room', header: 'Room', render: (row) => row.room || '--' },
  ]
  return (
    <div className="page-stack">
      <section className="panel report-filters">
        <div className="report-filter-fields">
          <label className="form-field"><span>Exam</span><select value={examId} onChange={(event) => setExamId(event.target.value)}><option value="">All exams</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name}</option>)}</select></label>
          <label className="form-field"><span>Class</span><select value={className} onChange={(event) => { setClassName(event.target.value); setSection('') }}><option value="">All classes</option>{classes.map((item) => <option key={item.id} value={item.name}>Class {item.name}</option>)}</select></label>
          <label className="form-field"><span>Section</span><select value={section} onChange={(event) => setSection(event.target.value)}><option value="">All sections</option>{filteredSections.map((item) => <option key={item.id} value={item.name}>Section {item.name}</option>)}</select></label>
        </div>
      </section>
      <section className="panel report-print-area">
        <SchoolPrintHeader settings={settings} title="Date Sheet" subtitle={`${optionLabel(data?.exam?.name ?? '')} | Class ${optionLabel(className)} ${section ? `Section ${section}` : ''}`} />
        <div className="report-toolbar no-print"><div><strong>Published Exam Date Sheet</strong><span>{rows.length} paper(s)</span></div><div className="report-actions"><button className="secondary-button" type="button" onClick={() => exportCsv('date-sheet.csv', ['Date', 'Day', 'Class', 'Section', 'Subject', 'Start', 'End', 'Room'], rows.map((row: AnyRow) => [row.examDate, row.dayName, row.className, row.section, row.subjectName, row.startTime, row.endTime, row.room]))}><Icon name="download" size={16} />Export CSV</button><button className="primary-button" type="button" onClick={printPage}><Icon name="print" size={16} />Print</button></div></div>
        <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} emptyMessage={isLoading ? 'Loading date sheet...' : 'No published schedule entries found.'} />
        <footer className="report-document-footer"><span>Principal Signature</span><strong>{rows.length} papers</strong></footer>
      </section>
    </div>
  )
}

export function ResultSheetTab({
  exams,
  classes,
  sections,
  settings,
  onNotice,
}: ExamOperationalProps) {
  const [examId, setExamId] = useState('')
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')
  const { data, isLoading } = useExamReport(
    () =>
      examId
        ? getErpApi().getResultSheet({ examId, className, section })
        : Promise.resolve({ rows: [], subjects: [], summary: null }),
    [examId, className, section],
    onNotice,
  )
  const rows = data?.rows ?? []
  const subjects = data?.subjects ?? []
  const filteredSections = classSections(sections, className)
  const columns: TableColumn<AnyRow>[] = [
    { key: 'admission', header: 'Admission No', render: (row) => row.admissionNo },
    { key: 'name', header: 'Student', render: (row) => row.studentName },
    ...subjects.map((subject: AnyRow) => ({
      key: subject.id,
      header: subject.name,
      render: (row: AnyRow) => {
        const mark = row.subjectMarks?.find((item: AnyRow) => item.subjectId === subject.id)
        return mark ? `${mark.obtainedMarks}/${mark.maxMarks} ${mark.grade || ''}` : 'Pending'
      },
    })),
    { key: 'total', header: 'Total', render: (row) => `${row.totalObtained}/${row.totalMaximum}` },
    { key: 'percentage', header: '%', render: (row) => `${row.percentage}%` },
    { key: 'grade', header: 'Grade', render: (row) => row.grade || '--' },
    { key: 'result', header: 'Result', render: (row) => <span className="neutral-badge">{row.result}</span> },
    { key: 'position', header: 'Position', render: (row) => row.position ?? '--' },
  ]
  return (
    <div className="page-stack">
      <section className="panel report-filters">
        <div className="report-filter-fields">
          <label className="form-field"><span>Exam</span><select value={examId} onChange={(event) => setExamId(event.target.value)}><option value="">Select exam</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name} - Class {exam.className}</option>)}</select></label>
          <label className="form-field"><span>Class</span><select value={className} onChange={(event) => { setClassName(event.target.value); setSection('') }}><option value="">Use exam class</option>{classes.map((item) => <option key={item.id} value={item.name}>Class {item.name}</option>)}</select></label>
          <label className="form-field"><span>Section</span><select value={section} onChange={(event) => setSection(event.target.value)}><option value="">All sections</option>{filteredSections.map((item) => <option key={item.id} value={item.name}>Section {item.name}</option>)}</select></label>
        </div>
      </section>
      <section className="panel report-print-area">
        <SchoolPrintHeader settings={settings} title="Result Sheet" subtitle={`${data?.exam?.name ?? optionLabel(examId)} | Class ${data?.className ?? optionLabel(className)}`} />
        {data?.summary && (
          <div className="report-summary-grid">
            {Object.entries(data.summary).map(([key, value]) => (
              <div className="report-summary-card" key={key}><span>{key.replace(/([A-Z])/g, ' $1')}</span><strong>{String(value)}</strong></div>
            ))}
          </div>
        )}
        <div className="report-toolbar no-print"><div><strong>Class Result Sheet</strong><span>{data?.rankingMethod ?? 'Dense ranking'}</span></div><div className="report-actions"><button className="secondary-button" type="button" onClick={() => exportCsv('result-sheet.csv', ['Admission No', 'Student', 'Total', 'Maximum', 'Percentage', 'Grade', 'Result', 'Position'], rows.map((row: AnyRow) => [row.admissionNo, row.studentName, row.totalObtained, row.totalMaximum, row.percentage, row.grade, row.result, row.position]))}><Icon name="download" size={16} />Export CSV</button><button className="primary-button" type="button" onClick={printPage}><Icon name="print" size={16} />Print</button></div></div>
        <DataTable columns={columns} rows={rows} getRowKey={(row) => row.student.id} emptyMessage={isLoading ? 'Loading result sheet...' : 'Select an exam to generate the result sheet.'} />
      </section>
    </div>
  )
}

export function BlankAwardListTab({
  exams,
  classes,
  sections,
  settings,
  subjects,
  onNotice,
}: ExamOperationalProps) {
  const [examId, setExamId] = useState('')
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const { data, isLoading } = useExamReport(
    () =>
      examId && subjectId
        ? getErpApi().getBlankAwardList({ examId, className, section, subjectId })
        : Promise.resolve({ rows: [], subject: null, exam: null }),
    [examId, className, section, subjectId],
    onNotice,
  )
  const rows = data?.rows ?? []
  const filteredSections = classSections(sections, className)
  const filteredSubjects = classSubjects(subjects, className)
  const columns: TableColumn<AnyRow>[] = [
    { key: 'serial', header: 'S. No.', render: (row) => row.serialNo },
    { key: 'roll', header: 'Roll No', render: (row) => row.rollNo || '' },
    { key: 'admission', header: 'Admission No', render: (row) => row.admissionNo },
    { key: 'name', header: 'Student Name', render: (row) => row.studentName },
    { key: 'max', header: 'Max Marks', render: () => data?.subject?.maxMarks ?? '' },
    { key: 'obtained', header: 'Marks Obtained', render: () => <span className="blank-line" /> },
    { key: 'absent', header: 'Absent', render: () => <span className="blank-checkbox" /> },
    { key: 'remarks', header: 'Remarks', render: () => <span className="blank-line" /> },
  ]
  const subtitle = `${data?.exam?.name ?? optionLabel(examId)} | ${data?.subject?.name ?? optionLabel(subjectId)}`
  return (
    <div className="page-stack">
      <section className="panel report-filters">
        <div className="report-filter-fields">
          <label className="form-field"><span>Exam</span><select value={examId} onChange={(event) => setExamId(event.target.value)}><option value="">Select exam</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name} - Class {exam.className}</option>)}</select></label>
          <label className="form-field"><span>Class</span><select value={className} onChange={(event) => { setClassName(event.target.value); setSection(''); setSubjectId('') }}><option value="">Use exam class</option>{classes.map((item) => <option key={item.id} value={item.name}>Class {item.name}</option>)}</select></label>
          <label className="form-field"><span>Section</span><select value={section} onChange={(event) => setSection(event.target.value)}><option value="">All sections</option>{filteredSections.map((item) => <option key={item.id} value={item.name}>Section {item.name}</option>)}</select></label>
          <label className="form-field"><span>Subject</span><select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}><option value="">Select subject</option>{filteredSubjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        </div>
      </section>
      <section className="panel report-print-area">
        <SchoolPrintHeader settings={settings} title="Blank Award List" subtitle={subtitle} />
        <div className="report-toolbar no-print"><div><strong>Printable Marks Entry Sheet</strong><span>No marks are saved from this page.</span></div><div className="report-actions"><button className="secondary-button" type="button" onClick={() => exportCsv('blank-award-list.csv', ['Serial', 'Admission No', 'Student', 'Max Marks', 'Marks Obtained', 'Absent', 'Remarks'], rows.map((row: AnyRow) => [row.serialNo, row.admissionNo, row.studentName, data?.subject?.maxMarks ?? '', '', '', '']))}><Icon name="download" size={16} />Export CSV</button><button className="primary-button" type="button" onClick={printPage}><Icon name="print" size={16} />Print</button></div></div>
        <DataTable columns={columns} rows={rows} getRowKey={(row) => row.studentId} emptyMessage={isLoading ? 'Loading award list...' : 'Select exam, class and subject.'} />
        <footer className="report-document-footer"><span>Subject Teacher | Examiner | Checked By</span><strong>Principal Signature</strong></footer>
      </section>
    </div>
  )
}
