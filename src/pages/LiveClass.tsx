/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { DataTable, type TableColumn } from '../components/DataTable'
import { Icon } from '../components/Icon'
import { getErpApi, getErrorMessage } from '../lib/erpApi'
import { exportCsv } from '../lib/reportUtils'
import type {
  AcademicSession,
  AuthUser,
  ClassItem,
  Employee,
  SectionItem,
  Subject,
} from '../types'

export type LiveClassView = 'schedule' | 'attendance' | 'reports'

type AnyRow = Record<string, any>

const todayDateTime = () => `${new Date().toISOString().slice(0, 10)}T09:00`

const plusHour = () => `${new Date().toISOString().slice(0, 10)}T10:00`

const printPage = () => window.print()

const classSections = (sections: SectionItem[], className: string) =>
  sections.filter((section) => !className || section.className === className)

const classSubjects = (subjects: Subject[], className: string) =>
  subjects.filter((subject) => !className || subject.className === className)

export function LiveClass({
  currentUser,
  initialView = 'schedule',
}: {
  currentUser: AuthUser
  initialView?: LiveClassView
}) {
  const [activeView, setActiveView] = useState<LiveClassView>(initialView)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [sections, setSections] = useState<SectionItem[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [students, setStudents] = useState<AnyRow[]>([])
  const [liveClasses, setLiveClasses] = useState<AnyRow[]>([])
  const [selected, setSelected] = useState<AnyRow | null>(null)
  const [attendanceRows, setAttendanceRows] = useState<AnyRow[]>([])
  const [whatsappTemplates, setWhatsappTemplates] = useState<AnyRow[]>([])
  const [smsTemplates, setSmsTemplates] = useState<AnyRow[]>([])
  const [communicationStatus, setCommunicationStatus] = useState<AnyRow | null>(null)
  const [notificationPreview, setNotificationPreview] = useState<AnyRow | null>(null)
  const [notificationForm, setNotificationForm] = useState({
    whatsapp: true,
    sms: false,
    whatsappTemplateId: '',
    smsTemplateId: '',
    includeAllGuardians: false,
  })
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    academicSessionId: '',
    className: '',
    section: '',
    subjectId: '',
    teacherEmployeeId: '',
    title: '',
    description: '',
    provider: 'Google Meet',
    meetingUrl: '',
    meetingId: '',
    startAt: todayDateTime(),
    endAt: plusHour(),
    status: 'Scheduled',
    recordingUrl: '',
    notes: '',
  })

  const canManage = ['Owner', 'Admin', 'Teacher'].includes(currentUser.role)
  const filteredSections = classSections(sections, form.className)
  const filteredSubjects = classSubjects(subjects, form.className)

  const load = async () => {
    setError('')
    try {
      const api = getErpApi()
      if (currentUser.role === 'Student' || currentUser.accountType === 'Student') {
        const [portalData, liveRows] = await Promise.all([
          api.getCurrentStudentPortalData(),
          api.getLiveClasses({}),
        ])
        setStudents([portalData.student])
        setLiveClasses(liveRows)
        return
      }
      const [
        classRows,
        sectionRows,
        subjectRows,
        employeeRows,
        sessionRows,
        studentRows,
        liveRows,
      ] = await Promise.all([
        api.getClasses(),
        api.getSections(),
        api.getSubjects(),
        api.getEmployees(),
        api.getAcademicSessions(),
        api.getStudents(),
        api.getLiveClasses({}),
      ])
      setClasses(classRows)
      setSections(sectionRows)
      setSubjects(subjectRows)
      setEmployees(employeeRows)
      setSessions(sessionRows)
      setStudents(studentRows)
      setLiveClasses(liveRows)
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    if (!canManage) return
    void Promise.allSettled([
      getErpApi().getCommunicationTemplates('WhatsApp'),
      getErpApi().getCommunicationTemplates('SMS'),
      getErpApi().getCommunicationIntegrationStatus(),
    ]).then(([whatsappResult, smsResult, statusResult]) => {
      if (whatsappResult.status === 'fulfilled') {
        setWhatsappTemplates(
          whatsappResult.value.filter((template: AnyRow) => template.status === 'Approved'),
        )
      }
      if (smsResult.status === 'fulfilled') {
        setSmsTemplates(
          smsResult.value.filter((template: AnyRow) => template.status === 'Approved'),
        )
      }
      if (statusResult.status === 'fulfilled') {
        setCommunicationStatus(statusResult.value)
      }
    })
  }, [canManage])

  const openLiveClass = async (item: AnyRow) => {
    try {
      const full = await getErpApi().getLiveClass(item.id)
      setSelected(full)
      setNotificationPreview(null)
      setAttendanceRows(full?.attendance ?? [])
      setForm({
        academicSessionId: full?.academicSessionId ?? '',
        className: full?.className ?? '',
        section: full?.section ?? '',
        subjectId: full?.subjectId ?? '',
        teacherEmployeeId: full?.teacherEmployeeId ?? '',
        title: full?.title ?? '',
        description: full?.description ?? '',
        provider: full?.provider ?? 'Google Meet',
        meetingUrl: full?.meetingUrl ?? '',
        meetingId: full?.meetingId ?? '',
        startAt: (full?.startAt ?? '').slice(0, 16),
        endAt: (full?.endAt ?? '').slice(0, 16),
        status: full?.status ?? 'Scheduled',
        recordingUrl: full?.recordingUrl ?? '',
        notes: full?.notes ?? '',
      })
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  const save = async () => {
    setError('')
    setNotice('')
    try {
      const payload = {
        ...form,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
      }
      const saved = selected
        ? await getErpApi().updateLiveClass(selected.id, payload)
        : await getErpApi().createLiveClass(payload)
      setSelected(saved)
      setAttendanceRows(saved.attendance ?? [])
      setNotice('Live class saved.')
      await load()
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  const setStatus = async (status: string) => {
    if (!selected) return
    try {
      const saved = await getErpApi().setLiveClassStatus(selected.id, status)
      setSelected(saved)
      setAttendanceRows(saved.attendance ?? [])
      await load()
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  const saveAttendance = async () => {
    if (!selected) return
    try {
      const saved = await getErpApi().saveLiveClassAttendance(
        selected.id,
        attendanceRows,
      )
      setSelected(saved)
      setAttendanceRows(saved.attendance ?? [])
      setNotice('Live class attendance saved.')
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  const joinClass = (item: AnyRow) => {
    if (!navigator.onLine) {
      setError('Internet connection is required for this action.')
      return
    }
    window.open(item.meetingUrl, '_blank', 'noopener,noreferrer')
  }

  const copyLink = async (item: AnyRow) => {
    try {
      await navigator.clipboard.writeText(item.meetingUrl)
      setNotice('Meeting link copied.')
    } catch {
      setError('Meeting link could not be copied.')
    }
  }

  const previewNotification = async () => {
    if (!selected) {
      setError('Open a live class before notifying students or parents.')
      return
    }
    try {
      const preview = await getErpApi().previewLiveClassNotification(
        selected.id,
        { includeAllGuardians: notificationForm.includeAllGuardians },
      )
      setNotificationPreview(preview)
      setNotice(`Notification preview found ${preview.recipientCount} valid recipient(s) and ${preview.skippedCount} skipped record(s).`)
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  const notifyRecipients = async () => {
    if (!selected) {
      setError('Open a live class before notifying students or parents.')
      return
    }
    if (!navigator.onLine) {
      setError('Internet connection is required for this action.')
      return
    }
    const channelLabels = [
      notificationForm.whatsapp ? 'WhatsApp' : '',
      notificationForm.sms ? 'SMS' : '',
    ].filter(Boolean)
    if (!channelLabels.length) {
      setError('Select WhatsApp or SMS before notifying recipients.')
      return
    }
    if (
      !window.confirm(
        `Queue ${channelLabels.join(' and ')} notification(s) for this live class?`,
      )
    ) {
      return
    }
    try {
      const result = await getErpApi().notifyLiveClassRecipients(selected.id, notificationForm)
      const queued = (result.results ?? [])
        .map((row: AnyRow) => `${row.channel}: ${row.queuedCount ?? row.totalRecipients ?? 0}`)
        .join(', ')
      setNotificationPreview(null)
      setNotice(`Live class notification queued. ${queued || `${result.recipientCount} recipient(s)`}.`)
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  const visibleLiveClasses = useMemo(
    () =>
      currentUser.role === 'Student'
        ? liveClasses.filter((item) => item.status !== 'Draft')
        : liveClasses,
    [currentUser.role, liveClasses],
  )

  const scheduleColumns: TableColumn<AnyRow>[] = [
    { key: 'title', header: 'Title', render: (row) => <span className="table-primary">{row.title}</span> },
    { key: 'class', header: 'Class', render: (row) => `${row.className || '--'}${row.section ? `-${row.section}` : ''}` },
    { key: 'subject', header: 'Subject', render: (row) => row.subjectName || '--' },
    { key: 'teacher', header: 'Teacher', render: (row) => row.teacherName || '--' },
    { key: 'time', header: 'Time', render: (row) => `${row.startAt?.slice(0, 16)} to ${row.endAt?.slice(0, 16)}` },
    { key: 'provider', header: 'Provider', render: (row) => row.provider },
    { key: 'status', header: 'Status', render: (row) => <span className="neutral-badge">{row.status}</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="table-actions">
          <button className="secondary-button secondary-button--compact" type="button" onClick={() => joinClass(row)}>Join</button>
          <button className="secondary-button secondary-button--compact" type="button" onClick={() => void copyLink(row)}>Copy</button>
          <button className="secondary-button secondary-button--compact" type="button" onClick={() => void openLiveClass(row)}>Open</button>
        </div>
      ),
    },
  ]

  const attendanceStudents = students.filter(
    (student) =>
      selected &&
      student.className === selected.className &&
      (!selected.section || student.section === selected.section),
  )
  const attendanceByStudent = new Map(
    attendanceRows.map((row) => [row.studentId, row]),
  )
  const attendanceTableRows = attendanceStudents.map((student) => ({
    ...attendanceByStudent.get(student.id),
    studentId: student.id,
    studentName: student.name,
  }))
  const attendanceColumns: TableColumn<AnyRow>[] = [
    { key: 'student', header: 'Student', render: (row) => row.studentName },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <select
          value={row.attendanceStatus ?? 'Present'}
          onChange={(event) =>
            setAttendanceRows((current) => [
              ...current.filter((item) => item.studentId !== row.studentId),
              { ...row, attendanceStatus: event.target.value },
            ])
          }
        >
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
          <option value="Late">Late</option>
        </select>
      ),
    },
    {
      key: 'remarks',
      header: 'Remarks',
      render: (row) => (
        <input
          value={row.remarks ?? ''}
          onChange={(event) =>
            setAttendanceRows((current) => [
              ...current.filter((item) => item.studentId !== row.studentId),
              { ...row, remarks: event.target.value },
            ])
          }
        />
      ),
    },
  ]

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h2>Live Class</h2>
          <p>Manage offline schedules for external HTTPS meeting links.</p>
        </div>
      </section>

      <nav className="report-tabs" aria-label="Live class sections">
        {[
          ['schedule', 'Schedule'],
          ['attendance', 'Attendance'],
          ['reports', 'Reports'],
        ].map(([id, label]) => (
          <button
            className={`report-tab${activeView === id ? ' report-tab--active' : ''}`}
            key={id}
            type="button"
            onClick={() => setActiveView(id as LiveClassView)}
          >
            {label}
          </button>
        ))}
      </nav>

      {error && <div className="inline-message inline-message--error"><Icon name="close" size={17} /><span>{error}</span></div>}
      {notice && <div className="inline-message"><Icon name="check" size={17} /><span>{notice}</span></div>}

      {activeView === 'schedule' && (
        <>
          {canManage && (
            <section className="panel report-filters">
              <div className="report-filter-fields">
                <label className="form-field"><span>Session</span><select value={form.academicSessionId} onChange={(event) => setForm({ ...form, academicSessionId: event.target.value })}><option value="">No session</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.sessionName}</option>)}</select></label>
                <label className="form-field"><span>Class</span><select value={form.className} onChange={(event) => setForm({ ...form, className: event.target.value, section: '', subjectId: '' })}><option value="">Select class</option>{classes.map((item) => <option key={item.id} value={item.name}>Class {item.name}</option>)}</select></label>
                <label className="form-field"><span>Section</span><select value={form.section} onChange={(event) => setForm({ ...form, section: event.target.value })}><option value="">All sections</option>{filteredSections.map((item) => <option key={item.id} value={item.name}>Section {item.name}</option>)}</select></label>
                <label className="form-field"><span>Subject</span><select value={form.subjectId} onChange={(event) => setForm({ ...form, subjectId: event.target.value })}><option value="">No subject</option>{filteredSubjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label className="form-field"><span>Teacher</span><select value={form.teacherEmployeeId} onChange={(event) => setForm({ ...form, teacherEmployeeId: event.target.value })}><option value="">Not assigned</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label>
                <label className="form-field"><span>Provider</span><select value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value })}><option>Google Meet</option><option>Zoom</option><option>Microsoft Teams</option><option>Other</option></select></label>
                <label className="form-field"><span>Title</span><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
                <label className="form-field"><span>Meeting URL</span><input value={form.meetingUrl} onChange={(event) => setForm({ ...form, meetingUrl: event.target.value })} placeholder="https://..." /></label>
                <label className="form-field"><span>Start</span><input type="datetime-local" value={form.startAt} onChange={(event) => setForm({ ...form, startAt: event.target.value })} /></label>
                <label className="form-field"><span>End</span><input type="datetime-local" value={form.endAt} onChange={(event) => setForm({ ...form, endAt: event.target.value })} /></label>
                <label className="form-field"><span>Status</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>Draft</option><option>Scheduled</option><option>Live</option><option>Completed</option><option>Cancelled</option></select></label>
              </div>
              <label className="form-field"><span>Description</span><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
              <div className="form-actions">
                <button className="secondary-button" type="button" onClick={() => setSelected(null)}>New</button>
                <button className="primary-button" type="button" onClick={() => void save()}><Icon name="check" size={16} />Save Live Class</button>
                {selected && <button className="secondary-button" type="button" onClick={() => void setStatus('Cancelled')}>Cancel</button>}
                {selected && <button className="secondary-button" type="button" onClick={() => void setStatus('Completed')}>Complete</button>}
              </div>
              {selected && (
                <div className="document-empty-state">
                  <div className="report-toolbar">
                    <div>
                      <strong>Notify Students / Parents</strong>
                      <p>
                        Mode: {communicationStatus?.providerMode || 'Unknown'} · WhatsApp {communicationStatus?.whatsappStatus || 'Unknown'} · SMS {communicationStatus?.smsStatus || 'Unknown'}
                      </p>
                    </div>
                    <button className="secondary-button" type="button" onClick={() => void previewNotification()}>
                      <Icon name="view" size={16} />Preview Recipients
                    </button>
                  </div>
                  <div className="report-filter-fields">
                    <label className="form-field form-field--checkbox">
                      <input
                        checked={notificationForm.whatsapp}
                        type="checkbox"
                        onChange={(event) => setNotificationForm({ ...notificationForm, whatsapp: event.target.checked })}
                      />
                      <span>WhatsApp</span>
                    </label>
                    <label className="form-field">
                      <span>WhatsApp Template</span>
                      <select value={notificationForm.whatsappTemplateId} onChange={(event) => setNotificationForm({ ...notificationForm, whatsappTemplateId: event.target.value })}>
                        <option value="">Select template</option>
                        {whatsappTemplates.map((template) => <option key={template.id} value={template.id}>{template.internalName || template.name}</option>)}
                      </select>
                    </label>
                    <label className="form-field form-field--checkbox">
                      <input
                        checked={notificationForm.sms}
                        type="checkbox"
                        onChange={(event) => setNotificationForm({ ...notificationForm, sms: event.target.checked })}
                      />
                      <span>SMS</span>
                    </label>
                    <label className="form-field">
                      <span>SMS Template</span>
                      <select value={notificationForm.smsTemplateId} onChange={(event) => setNotificationForm({ ...notificationForm, smsTemplateId: event.target.value })}>
                        <option value="">Select template</option>
                        {smsTemplates.map((template) => <option key={template.id} value={template.id}>{template.internalName || template.name}</option>)}
                      </select>
                    </label>
                    <label className="form-field form-field--checkbox">
                      <input
                        checked={notificationForm.includeAllGuardians}
                        type="checkbox"
                        onChange={(event) => setNotificationForm({ ...notificationForm, includeAllGuardians: event.target.checked })}
                      />
                      <span>Include all guardians</span>
                    </label>
                  </div>
                  {notificationPreview && (
                    <div className="report-summary-grid">
                      <div className="report-summary-card"><span>Audience</span><strong>{notificationPreview.audienceSummary}</strong></div>
                      <div className="report-summary-card"><span>Recipients</span><strong>{notificationPreview.recipientCount}</strong></div>
                      <div className="report-summary-card"><span>Skipped</span><strong>{notificationPreview.skippedCount}</strong></div>
                      <div className="report-summary-card"><span>Meeting</span><strong>{selected.provider}</strong></div>
                    </div>
                  )}
                  <div className="form-actions">
                    <button className="primary-button" type="button" onClick={() => void notifyRecipients()}>
                      <Icon name="bell" size={16} />Queue Notification
                    </button>
                    <button className="secondary-button" type="button" onClick={() => getErpApi().getCommunicationJobs({}).then(() => setNotice('Open WhatsApp/SMS delivery logs from Communication Center to inspect job status.')).catch((error) => setError(getErrorMessage(error)))}>
                      <Icon name="view" size={16} />Check Jobs
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
          <section className="panel">
            <div className="report-toolbar">
              <div><strong>Scheduled Classes</strong><span>{visibleLiveClasses.length} record(s)</span></div>
              <div className="report-actions">
                <button className="secondary-button" type="button" onClick={() => exportCsv('live-classes.csv', ['Title', 'Class', 'Section', 'Teacher', 'Start', 'End', 'Status'], visibleLiveClasses.map((row) => [row.title, row.className, row.section, row.teacherName, row.startAt, row.endAt, row.status]))}><Icon name="download" size={16} />Export CSV</button>
                <button className="primary-button" type="button" onClick={() => window.print()}><Icon name="print" size={16} />Print</button>
              </div>
            </div>
            <DataTable columns={scheduleColumns} rows={visibleLiveClasses} getRowKey={(row) => row.id} emptyMessage="No live classes scheduled." />
          </section>
        </>
      )}

      {activeView === 'attendance' && (
        <section className="panel">
          <div className="report-toolbar">
            <div><strong>Attendance Register</strong><span>{selected ? selected.title : 'Open a scheduled class first.'}</span></div>
            {canManage && <button className="primary-button" type="button" disabled={!selected} onClick={() => void saveAttendance()}><Icon name="check" size={16} />Save Attendance</button>}
          </div>
          <DataTable columns={attendanceColumns} rows={selected ? attendanceTableRows : []} getRowKey={(row) => row.studentId} emptyMessage="Open a live class to mark attendance." />
        </section>
      )}

      {activeView === 'reports' && (
        <section className="panel report-print-area">
          <div className="report-toolbar">
            <div><strong>Live Class Report</strong><span>Offline schedule and attendance data.</span></div>
            <div className="report-actions">
              <button className="secondary-button" type="button" onClick={() => exportCsv('live-class-report.csv', ['Title', 'Class', 'Section', 'Teacher', 'Provider', 'Status'], visibleLiveClasses.map((row) => [row.title, row.className, row.section, row.teacherName, row.provider, row.status]))}><Icon name="download" size={16} />Export CSV</button>
              <button className="primary-button" type="button" onClick={printPage}><Icon name="print" size={16} />Print</button>
            </div>
          </div>
          <DataTable columns={scheduleColumns.slice(0, 7)} rows={visibleLiveClasses} getRowKey={(row) => row.id} emptyMessage="No live class data available." />
        </section>
      )}
    </div>
  )
}
