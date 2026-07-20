import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import {
  getAcademicSessionsErpApi,
  getErpApi,
  getErrorMessage,
  getReportCardsErpApi,
} from '../../lib/erpApi'
import {
  exportCsv,
  formatGeneratedAt,
  formatReportDate,
} from '../../lib/reportUtils'
import type {
  AcademicSession,
  AuthUser,
  ClassItem,
  ClassResultSummary,
  Exam,
  GradingScheme,
  MasterStatus,
  ReportCardPreview,
  ReportCardTemplate,
  ReportCardTemplateInput,
  ReportCardResultStatus,
  SchoolSettings,
  SectionItem,
  Student,
  StudentReportCard,
} from '../../types'

type ReportCardTab = 'generate' | 'register' | 'summary' | 'templates'

interface StudentReportCardsProps {
  currentUser: AuthUser
}

interface TemplateForm {
  id: string
  name: string
  academicSessionId: string
  className: string
  showAttendance: boolean
  showClassTests: boolean
  showBehaviour: boolean
  showSkills: boolean
  showTeacherRemarks: boolean
  showPrincipalSignature: boolean
  headerText: string
  footerText: string
  status: MasterStatus
}

const fallbackSettings: SchoolSettings = {
  id: 'school-profile',
  schoolName: 'Vidhya School ERP',
  address: '',
  phone: '',
  email: '',
  academicYear: '',
  receiptPrefix: '',
  createdAt: '',
  updatedAt: '',
}

const emptyTemplateForm: TemplateForm = {
  id: '',
  name: '',
  academicSessionId: '',
  className: '',
  showAttendance: true,
  showClassTests: false,
  showBehaviour: true,
  showSkills: true,
  showTeacherRemarks: true,
  showPrincipalSignature: true,
  headerText: '',
  footerText: '',
  status: 'Active',
}

const resultStatuses: Array<ReportCardResultStatus | 'All'> = [
  'All',
  'Pass',
  'Fail',
  'Pending',
  'Promoted',
  'Detained',
]

const percentText = (value: number) => `${value.toFixed(2)}%`

function ReportCardDocument({
  data,
  settings,
}: {
  data: ReportCardPreview | StudentReportCard
  settings: SchoolSettings
}) {
  const isGenerated = 'reportCardNo' in data
  const student = isGenerated
    ? {
        admissionNo: data.admissionNo,
        name: data.studentName,
        className: data.className,
        section: data.section,
        rollNo: '',
      }
    : data.student
  const examName = isGenerated ? data.examName : data.exam.name
  const sessionName = isGenerated
    ? data.academicSessionName
    : data.academicSession?.sessionName ?? ''
  const subjects = data.subjects
  const attendance = isGenerated
    ? {
        workingDays: data.attendanceWorkingDays,
        presentDays: data.attendancePresentDays,
        percentage: data.attendancePercentage,
      }
    : data.attendance
  const teacherRemarks = isGenerated ? data.teacherRemarks : data.teacherRemarks
  const principalRemarks = isGenerated
    ? data.principalRemarks
    : data.principalRemarks

  return (
    <article className="report-card-document">
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
        <strong>{isGenerated ? data.reportCardNo : 'Preview'}</strong>
      </header>

      <section className="marksheet-title">
        <div>
          <span>Report Card</span>
          <h2>{examName}</h2>
        </div>
        <div>
          <span>Academic Session</span>
          <strong>{sessionName || settings.academicYear || '—'}</strong>
        </div>
        <div>
          <span>Generated</span>
          <strong>
            {isGenerated
              ? formatReportDate(data.generatedAt.slice(0, 10))
              : formatGeneratedAt()}
          </strong>
        </div>
      </section>

      <dl className="marksheet-student-details">
        <div>
          <dt>Student Name</dt>
          <dd>{student.name}</dd>
        </div>
        <div>
          <dt>Admission No.</dt>
          <dd>{student.admissionNo}</dd>
        </div>
        <div>
          <dt>Class / Section</dt>
          <dd>
            {student.className}
            {student.section ? ` / ${student.section}` : ''}
          </dd>
        </div>
        <div>
          <dt>Roll No.</dt>
          <dd>{student.rollNo || '—'}</dd>
        </div>
      </dl>

      <div className="marksheet-table-wrap">
        <table className="marksheet-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Max</th>
              <th>Passing</th>
              <th>Obtained</th>
              <th>%</th>
              <th>Grade</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={`${subject.subjectId}-${subject.subjectName}`}>
                <td>{subject.subjectName}</td>
                <td>{subject.maxMarks}</td>
                <td>{subject.passingMarks}</td>
                <td>
                  <strong>{subject.obtainedMarks}</strong>
                </td>
                <td>{percentText(subject.percentage)}</td>
                <td>{subject.grade || '—'}</td>
                <td>
                  <span
                    className={
                      subject.resultStatus === 'Pass'
                        ? 'marksheet-pass'
                        : 'marksheet-fail'
                    }
                  >
                    {subject.resultStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="marksheet-summary report-card-summary">
        <div>
          <span>Total Marks</span>
          <strong>{data.totalMaxMarks}</strong>
        </div>
        <div>
          <span>Obtained</span>
          <strong>{data.totalObtainedMarks}</strong>
        </div>
        <div>
          <span>Percentage</span>
          <strong>{percentText(data.percentage)}</strong>
        </div>
        <div>
          <span>Grade</span>
          <strong>{data.overallGrade || '—'}</strong>
        </div>
        <div>
          <span>Result</span>
          <strong
            className={
              data.resultStatus === 'Pass' ? 'text-success' : 'text-danger'
            }
          >
            {data.resultStatus}
          </strong>
        </div>
      </section>

      <section className="report-card-extra-grid">
        <div>
          <span>Attendance</span>
          <strong>
            {attendance.presentDays}/{attendance.workingDays}
          </strong>
          <small>{percentText(attendance.percentage)}</small>
        </div>
        <div>
          <span>Class Position</span>
          <strong>{isGenerated ? data.classPosition ?? '—' : 'After saving'}</strong>
        </div>
        <div>
          <span>Section Position</span>
          <strong>{isGenerated ? data.sectionPosition ?? '—' : 'After saving'}</strong>
        </div>
      </section>

      {!isGenerated && (
        <section className="report-card-ratings">
          {data.behaviourRatings.length > 0 && (
            <div>
              <strong>Behaviour</strong>
              {data.behaviourRatings.slice(0, 5).map((rating) => (
                <span key={rating.id}>
                  {rating.traitName}: {rating.rating}
                </span>
              ))}
            </div>
          )}
          {data.affectiveSkills.length > 0 && (
            <div>
              <strong>Affective Skills</strong>
              {data.affectiveSkills.slice(0, 5).map((rating) => (
                <span key={rating.id}>
                  {rating.skillName}: {rating.rating}
                </span>
              ))}
            </div>
          )}
          {data.psychomotorSkills.length > 0 && (
            <div>
              <strong>Psychomotor Skills</strong>
              {data.psychomotorSkills.slice(0, 5).map((rating) => (
                <span key={rating.id}>
                  {rating.skillName}: {rating.rating}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="marksheet-remarks">
        <span>Teacher Remarks</span>
        <p>{teacherRemarks || '—'}</p>
        <span>Principal Remarks</span>
        <p>{principalRemarks || '—'}</p>
      </section>

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
    </article>
  )
}

export function StudentReportCards({ currentUser }: StudentReportCardsProps) {
  const [activeTab, setActiveTab] = useState<ReportCardTab>('generate')
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [sections, setSections] = useState<SectionItem[]>([])
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [schemes, setSchemes] = useState<GradingScheme[]>([])
  const [templates, setTemplates] = useState<ReportCardTemplate[]>([])
  const [cards, setCards] = useState<StudentReportCard[]>([])
  const [summary, setSummary] = useState<ClassResultSummary | null>(null)
  const [settings, setSettings] = useState<SchoolSettings>(fallbackSettings)
  const [sessionId, setSessionId] = useState('')
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')
  const [examId, setExamId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [schemeId, setSchemeId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [teacherRemarks, setTeacherRemarks] = useState('')
  const [principalRemarks, setPrincipalRemarks] = useState('')
  const [resultStatus, setResultStatus] =
    useState<ReportCardResultStatus | 'All'>('All')
  const [preview, setPreview] = useState<ReportCardPreview | null>(null)
  const [printCards, setPrintCards] = useState<StudentReportCard[]>([])
  const [templateForm, setTemplateForm] =
    useState<TemplateForm>(emptyTemplateForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isBusy, setIsBusy] = useState(false)

  const canGenerate = ['Owner', 'Admin', 'Teacher'].includes(currentUser.role)
  const canManage = currentUser.role === 'Owner' || currentUser.role === 'Admin'

  const activeClasses = classes.filter((item) => item.status === 'Active')
  const selectedExam = exams.find((exam) => exam.id === examId)
  const effectiveClass = className || selectedExam?.className || ''
  const availableSections = sections.filter(
    (item) => item.status === 'Active' && item.className === effectiveClass,
  )
  const availableExams = exams.filter(
    (exam) =>
      exam.status === 'Active' &&
      (!className || exam.className === className) &&
      (!section || !exam.section || exam.section === section),
  )
  const availableStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          student.status === 'Active' &&
          student.className === effectiveClass &&
          (!section || student.section === section),
      ),
    [effectiveClass, section, students],
  )

  const reportCardFilter = useMemo(
    () => ({
      academicSessionId: sessionId || undefined,
      className: effectiveClass || undefined,
      section: section || undefined,
      examId: examId || undefined,
      studentId: studentId || undefined,
      resultStatus,
    }),
    [effectiveClass, examId, resultStatus, section, sessionId, studentId],
  )

  const loadBaseData = async () => {
    const api = getErpApi()
    const reportApi = getReportCardsErpApi()
    const [studentRows, classRows, sectionRows, examRows, sessionRows, schemeRows, templateRows, schoolSettings] =
      await Promise.all([
        api.getStudents(),
        api.getClasses(),
        api.getSections(),
        api.getExams(),
        getAcademicSessionsErpApi().getAcademicSessions(),
        reportApi.getGradingSchemes(),
        reportApi.getReportCardTemplates(),
        api.getSchoolSettings(),
      ])
    setStudents(studentRows)
    setClasses(classRows)
    setSections(sectionRows)
    setExams(examRows)
    setSessions(sessionRows)
    setSchemes(schemeRows)
    setTemplates(templateRows)
    setSettings(schoolSettings)
    setSessionId(sessionRows.find((item) => item.isCurrent)?.id ?? sessionRows[0]?.id ?? '')
    setClassName(classRows.find((item) => item.status === 'Active')?.name ?? '')
    setExamId(examRows.find((item) => item.status === 'Active')?.id ?? '')
    setSchemeId(schemeRows.find((item) => item.isDefault)?.id ?? schemeRows[0]?.id ?? '')
    setTemplateId(templateRows.find((item) => item.status === 'Active')?.id ?? '')
  }

  const loadCards = async () => {
    setCards(
      await getReportCardsErpApi().getStudentReportCards(reportCardFilter),
    )
  }

  useEffect(() => {
    let isCurrent = true
    Promise.resolve()
      .then(loadBaseData)
      .then(() => {
        if (isCurrent) setError('')
      })
      .catch((loadError: unknown) => {
        if (isCurrent) setError(getErrorMessage(loadError))
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => {
      isCurrent = false
    }
  }, [])

  useEffect(() => {
    if (activeTab !== 'register') return
    let isCurrent = true
    Promise.resolve()
      .then(() =>
        getReportCardsErpApi().getStudentReportCards(reportCardFilter),
      )
      .then((rows) => {
        if (!isCurrent) return
        setCards(rows)
        setError('')
      })
      .catch((loadError: unknown) => {
        if (isCurrent) setError(getErrorMessage(loadError))
      })
    return () => {
      isCurrent = false
    }
  }, [activeTab, reportCardFilter])

  const generateInput = () => ({
    academicSessionId: sessionId,
    className: effectiveClass,
    section,
    examId,
    gradingSchemeId: schemeId,
    templateId,
    studentId,
    teacherRemarks,
    principalRemarks,
  })

  const previewReportCard = async () => {
    if (!studentId) {
      setError('Select a student before previewing.')
      return
    }
    setIsBusy(true)
    try {
      setPreview(await getReportCardsErpApi().getReportCardPreview(generateInput()))
      setPrintCards([])
      setError('')
    } catch (previewError) {
      setError(getErrorMessage(previewError))
    } finally {
      setIsBusy(false)
    }
  }

  const generateSingle = async (regenerate = false) => {
    if (!studentId) {
      setError('Select a student before generating.')
      return
    }
    setIsBusy(true)
    try {
      let existingId = ''
      if (regenerate) {
        existingId =
          (
            await getReportCardsErpApi().getStudentReportCards({
              academicSessionId: sessionId,
              examId,
              studentId,
            })
          )[0]?.id ?? ''
      }
      const card = await getReportCardsErpApi().generateStudentReportCard({
        ...generateInput(),
        regenerate,
        regenerateReportCardId: existingId,
      })
      setPreview(null)
      setPrintCards([card])
      setMessage(`${card.reportCardNo} generated.`)
      setError('')
      await loadCards()
    } catch (generateError) {
      const text = getErrorMessage(generateError)
      if (
        text.includes('already exists') &&
        window.confirm(`${text} Regenerate now?`)
      ) {
        await generateSingle(true)
      } else {
        setError(text)
      }
    } finally {
      setIsBusy(false)
    }
  }

  const generateClassBatch = async (regenerate = false) => {
    if (!effectiveClass || !examId) {
      setError('Select class and exam before generating a class batch.')
      return
    }
    if (!window.confirm('Generate report cards for the selected class/section?')) return
    setIsBusy(true)
    try {
      const result = await getReportCardsErpApi().generateClassReportCards({
        ...generateInput(),
        studentId: undefined,
        regenerate,
      })
      setPreview(null)
      setPrintCards(result.reportCards)
      setMessage(`Generated ${result.count} report card(s).`)
      setError('')
      await loadCards()
    } catch (generateError) {
      const text = getErrorMessage(generateError)
      if (
        text.includes('already exists') &&
        window.confirm(`${text} Regenerate existing class cards?`)
      ) {
        await generateClassBatch(true)
      } else {
        setError(text)
      }
    } finally {
      setIsBusy(false)
    }
  }

  const regenerateCard = async (card: StudentReportCard) => {
    if (!canGenerate) return
    if (!window.confirm(`Regenerate ${card.reportCardNo}?`)) return
    setIsBusy(true)
    try {
      const regenerated = await getReportCardsErpApi().generateStudentReportCard({
        academicSessionId: card.academicSessionId,
        className: card.className,
        section: card.section,
        examId: card.examId,
        gradingSchemeId: card.gradingSchemeId,
        templateId,
        studentId: card.studentId,
        teacherRemarks: card.teacherRemarks,
        principalRemarks: card.principalRemarks,
        regenerate: true,
        regenerateReportCardId: card.id,
      })
      setPreview(null)
      setPrintCards([regenerated])
      setMessage(`${regenerated.reportCardNo} regenerated.`)
      setError('')
      await loadCards()
    } catch (regenerateError) {
      setError(getErrorMessage(regenerateError))
    } finally {
      setIsBusy(false)
    }
  }

  const viewCard = async (card: StudentReportCard, printAfter = false) => {
    setIsBusy(true)
    try {
      const full = await getReportCardsErpApi().getStudentReportCardById(card.id)
      if (!full) throw new Error('Report card was not found.')
      setPrintCards([full])
      setPreview(null)
      setError('')
      if (printAfter) window.setTimeout(() => window.print(), 50)
    } catch (viewError) {
      setError(getErrorMessage(viewError))
    } finally {
      setIsBusy(false)
    }
  }

  const updateRemarks = async (card: StudentReportCard) => {
    if (!canGenerate) return
    const teacher = window.prompt('Teacher remarks', card.teacherRemarks)
    if (teacher === null) return
    const principal = canManage
      ? window.prompt('Principal remarks', card.principalRemarks)
      : card.principalRemarks
    if (principal === null) return
    try {
      await getReportCardsErpApi().updateReportCardRemarks(card.id, {
        teacherRemarks: teacher,
        principalRemarks: principal,
      })
      await loadCards()
      setMessage('Report card remarks updated.')
    } catch (remarksError) {
      setError(getErrorMessage(remarksError))
    }
  }

  const deleteCard = async (card: StudentReportCard) => {
    if (!canManage) return
    if (!window.confirm(`Delete ${card.reportCardNo}?`)) return
    try {
      await getReportCardsErpApi().deleteReportCard(card.id)
      await loadCards()
      setMessage('Report card deleted.')
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    }
  }

  const loadSummary = async () => {
    setIsBusy(true)
    try {
      setSummary(
        await getReportCardsErpApi().getClassResultSummary(reportCardFilter),
      )
      setError('')
    } catch (summaryError) {
      setError(getErrorMessage(summaryError))
    } finally {
      setIsBusy(false)
    }
  }

  const exportSummary = () => {
    if (!summary) return
    exportCsv(
      'class-result-summary.csv',
      ['Position', 'Admission No', 'Student', 'Total', 'Percentage', 'Grade', 'Result'],
      summary.rankings.map((row) => [
        row.position,
        row.admissionNo,
        row.studentName,
        row.total,
        row.percentage,
        row.grade,
        row.resultStatus,
      ]),
    )
  }

  const submitTemplate = async (event: FormEvent) => {
    event.preventDefault()
    if (!canManage) return
    const input: ReportCardTemplateInput = {
      name: templateForm.name,
      templateType: 'Standard',
      academicSessionId: templateForm.academicSessionId,
      className: templateForm.className,
      showAttendance: templateForm.showAttendance,
      showClassTests: templateForm.showClassTests,
      showBehaviour: templateForm.showBehaviour,
      showSkills: templateForm.showSkills,
      showTeacherRemarks: templateForm.showTeacherRemarks,
      showPrincipalSignature: templateForm.showPrincipalSignature,
      headerText: templateForm.headerText,
      footerText: templateForm.footerText,
      status: templateForm.status,
    }
    try {
      if (templateForm.id) {
        await getReportCardsErpApi().updateReportCardTemplate(templateForm.id, input)
        setMessage('Report card template updated.')
      } else {
        await getReportCardsErpApi().createReportCardTemplate(input)
        setMessage('Report card template created.')
      }
      setTemplates(await getReportCardsErpApi().getReportCardTemplates())
      setTemplateForm(emptyTemplateForm)
    } catch (templateError) {
      setError(getErrorMessage(templateError))
    }
  }

  const editTemplate = (template: ReportCardTemplate) => {
    setTemplateForm({
      id: template.id,
      name: template.name,
      academicSessionId: template.academicSessionId,
      className: template.className,
      showAttendance: template.showAttendance,
      showClassTests: template.showClassTests,
      showBehaviour: template.showBehaviour,
      showSkills: template.showSkills,
      showTeacherRemarks: template.showTeacherRemarks,
      showPrincipalSignature: template.showPrincipalSignature,
      headerText: template.headerText,
      footerText: template.footerText,
      status: template.status,
    })
  }

  const cardColumns: TableColumn<StudentReportCard>[] = [
    { key: 'no', header: 'Report Card No', render: (card) => <span className="table-primary">{card.reportCardNo}</span> },
    { key: 'student', header: 'Student', render: (card) => card.studentName },
    { key: 'admission', header: 'Admission No', render: (card) => card.admissionNo },
    { key: 'class', header: 'Class/Section', render: (card) => `${card.className}${card.section ? `-${card.section}` : ''}` },
    { key: 'session', header: 'Session', render: (card) => card.academicSessionName || '—' },
    { key: 'exam', header: 'Exam', render: (card) => card.examName },
    { key: 'percentage', header: '%', className: 'align-right', render: (card) => percentText(card.percentage) },
    { key: 'grade', header: 'Grade', render: (card) => card.overallGrade || '—' },
    {
      key: 'result',
      header: 'Result',
      render: (card) => (
        <span className={`status-badge status-badge--${card.resultStatus.toLowerCase()}`}>
          {card.resultStatus}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'align-right',
      render: (card) => (
        <div className="row-action-group">
          <button className="table-action-button" onClick={() => void viewCard(card)} type="button">View</button>
          <button className="row-action" onClick={() => void viewCard(card, true)} type="button"><Icon name="print" size={14} /></button>
          {canGenerate && <button className="row-action" onClick={() => void updateRemarks(card)} type="button"><Icon name="edit" size={14} /></button>}
          {canGenerate && <button className="table-action-button" onClick={() => void regenerateCard(card)} type="button">Regenerate</button>}
          {canManage && <button className="row-action row-action--danger" onClick={() => void deleteCard(card)} type="button"><Icon name="trash" size={14} /></button>}
        </div>
      ),
    },
  ]

  const templateColumns: TableColumn<ReportCardTemplate>[] = [
    { key: 'name', header: 'Template', render: (template) => <div className="primary-cell"><strong>{template.name}</strong><span>{template.headerText || 'Standard layout'}</span></div> },
    { key: 'scope', header: 'Scope', render: (template) => template.className ? `Class ${template.className}` : template.academicSessionId ? 'Session' : 'Global' },
    { key: 'status', header: 'Status', render: (template) => <span className={`status-badge status-badge--${template.status.toLowerCase()}`}>{template.status}</span> },
    { key: 'actions', header: '', className: 'align-right', render: (template) => canManage ? <button className="table-action-button" onClick={() => editTemplate(template)} type="button">Edit</button> : 'View only' },
  ]

  if (isLoading) {
    return <section className="panel exam-loading-state">Loading report card data...</section>
  }

  return (
    <div className="student-report-card-page">
      <nav className="settings-tabs" aria-label="Report card sections">
        {[
          { id: 'generate', label: 'Generate Report Card' },
          { id: 'register', label: 'Report Card Register' },
          { id: 'summary', label: 'Class Result Summary' },
          { id: 'templates', label: 'Report Card Templates' },
        ].map((tab) => (
          <button
            className={`settings-tab${activeTab === tab.id ? ' settings-tab--active' : ''}`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ReportCardTab)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {message && <div className="inline-message"><Icon name="check" size={17} /><span>{message}</span><button aria-label="Dismiss message" onClick={() => setMessage('')} type="button"><Icon name="close" size={15} /></button></div>}
      {error && <div className="inline-message inline-message--error"><Icon name="close" size={17} /><span>{error}</span><button aria-label="Dismiss error" onClick={() => setError('')} type="button"><Icon name="close" size={15} /></button></div>}

      {(activeTab === 'generate' || activeTab === 'register' || activeTab === 'summary') && (
        <section className="panel report-filters">
          <div className="report-filter-fields report-filter-fields--attendance">
            <label className="form-field">
              <span>Academic Session</span>
              <select value={sessionId} onChange={(event) => setSessionId(event.target.value)}>
                <option value="">Current/default</option>
                {sessions.map((session) => <option key={session.id} value={session.id}>{session.sessionName}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Class</span>
              <select value={className} onChange={(event) => { setClassName(event.target.value); setSection(''); setStudentId('') }}>
                <option value="">Select class</option>
                {activeClasses.map((item) => <option key={item.id} value={item.name}>Class {item.name}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Section</span>
              <select value={section} onChange={(event) => { setSection(event.target.value); setStudentId('') }}>
                <option value="">All sections</option>
                {availableSections.map((item) => <option key={item.id} value={item.name}>Section {item.name}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Exam</span>
              <select value={examId} onChange={(event) => setExamId(event.target.value)}>
                <option value="">Select exam</option>
                {availableExams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name}</option>)}
              </select>
            </label>
            {(activeTab === 'generate' || activeTab === 'register') && (
              <label className="form-field">
                <span>Student</span>
                <select value={studentId} onChange={(event) => setStudentId(event.target.value)}>
                  <option value="">All students</option>
                  {availableStudents.map((student) => <option key={student.id} value={student.id}>{student.admissionNo} · {student.name}</option>)}
                </select>
              </label>
            )}
            {activeTab === 'register' && (
              <label className="form-field">
                <span>Result</span>
                <select value={resultStatus} onChange={(event) => setResultStatus(event.target.value as ReportCardResultStatus | 'All')}>
                  {resultStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
            )}
          </div>
        </section>
      )}

      {activeTab === 'generate' && (
        <>
          <section className="panel report-card-generation-panel">
            <div className="report-filter-fields report-filter-fields--attendance">
              <label className="form-field">
                <span>Grading Scheme</span>
                <select value={schemeId} onChange={(event) => setSchemeId(event.target.value)}>
                  <option value="">Default applicable scheme</option>
                  {schemes.map((scheme) => <option key={scheme.id} value={scheme.id}>{scheme.name}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>Template</span>
                <select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
                  <option value="">Default template</option>
                  {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
                </select>
              </label>
              <label className="form-field form-field--full">
                <span>Teacher Remarks</span>
                <input value={teacherRemarks} onChange={(event) => setTeacherRemarks(event.target.value)} />
              </label>
              <label className="form-field form-field--full">
                <span>Principal Remarks</span>
                <input value={principalRemarks} onChange={(event) => setPrincipalRemarks(event.target.value)} />
              </label>
            </div>
            <div className="report-actions-row">
              <button className="secondary-button" disabled={isBusy || !studentId} onClick={() => void previewReportCard()} type="button"><Icon name="reports" size={17} />Preview</button>
              {canGenerate && <button className="primary-button" disabled={isBusy || !studentId} onClick={() => void generateSingle()} type="button"><Icon name="check" size={17} />Generate Student</button>}
              {canGenerate && <button className="secondary-button" disabled={isBusy || !effectiveClass || !examId} onClick={() => void generateClassBatch()} type="button"><Icon name="students" size={17} />Generate Class</button>}
              <button className="secondary-button" disabled={!preview && printCards.length === 0} onClick={() => window.setTimeout(() => window.print(), 50)} type="button"><Icon name="print" size={17} />Print</button>
            </div>
          </section>
        </>
      )}

      {activeTab === 'register' && (
        <>
          <div className="report-toolbar">
            <div><strong>Report Card Register</strong><span>{cards.length} saved report card(s)</span></div>
            <div className="report-actions">
              <button className="secondary-button" onClick={() => void loadCards()} type="button">Refresh</button>
              <button className="secondary-button" disabled={cards.length === 0} onClick={() => exportCsv('report-card-register.csv', ['Report Card No', 'Student', 'Admission No', 'Class', 'Section', 'Session', 'Exam', 'Percentage', 'Grade', 'Result'], cards.map((card) => [card.reportCardNo, card.studentName, card.admissionNo, card.className, card.section, card.academicSessionName, card.examName, card.percentage, card.overallGrade, card.resultStatus]))} type="button"><Icon name="download" size={16} />CSV</button>
              <button className="primary-button" disabled={cards.length === 0} onClick={async () => { const full = await Promise.all(cards.map((card) => getReportCardsErpApi().getStudentReportCardById(card.id))); setPrintCards(full.filter(Boolean) as StudentReportCard[]); window.setTimeout(() => window.print(), 50) }} type="button"><Icon name="print" size={16} />Print Batch</button>
            </div>
          </div>
          <section className="panel">
            <DataTable columns={cardColumns} emptyMessage="No report cards found." getRowKey={(card) => card.id} rows={cards} />
          </section>
        </>
      )}

      {activeTab === 'summary' && (
        <>
          <div className="report-toolbar">
            <div><strong>Class Result Summary</strong><span>Dense ranking by percentage, then total marks.</span></div>
            <div className="report-actions">
              <button className="primary-button" onClick={() => void loadSummary()} type="button"><Icon name="reports" size={16} />Generate</button>
              <button className="secondary-button" disabled={!summary} onClick={exportSummary} type="button"><Icon name="download" size={16} />CSV</button>
              <button className="secondary-button" disabled={!summary} onClick={() => window.setTimeout(() => window.print(), 50)} type="button"><Icon name="print" size={16} />Print</button>
            </div>
          </div>
          {summary && (
            <section className="panel report-print-area">
              <div className="invoice-summary-grid">
                <div><span>Total Students</span><strong>{summary.summary.totalStudents}</strong></div>
                <div><span>Complete</span><strong>{summary.summary.resultComplete}</strong></div>
                <div><span>Passed</span><strong>{summary.summary.passed}</strong></div>
                <div><span>Failed</span><strong>{summary.summary.failed}</strong></div>
                <div><span>Pass %</span><strong>{percentText(summary.summary.passPercentage)}</strong></div>
                <div><span>Average</span><strong>{percentText(summary.summary.classAverage)}</strong></div>
              </div>
              <h3 className="report-card-section-title">Student Ranking</h3>
              <DataTable
                columns={[
                  { key: 'position', header: 'Position', render: (row) => row.position },
                  { key: 'student', header: 'Student', render: (row) => row.studentName },
                  { key: 'total', header: 'Total', className: 'align-right', render: (row) => row.total },
                  { key: 'percent', header: '%', className: 'align-right', render: (row) => percentText(row.percentage) },
                  { key: 'grade', header: 'Grade', render: (row) => row.grade || '—' },
                  { key: 'result', header: 'Result', render: (row) => row.resultStatus },
                ]}
                emptyMessage="No ranked students."
                getRowKey={(row) => row.reportCardId}
                rows={summary.rankings}
              />
              <h3 className="report-card-section-title">Subject Summary</h3>
              <DataTable
                columns={[
                  { key: 'subject', header: 'Subject', render: (row) => row.subjectName },
                  { key: 'appeared', header: 'Appeared', className: 'align-right', render: (row) => row.appeared },
                  { key: 'passed', header: 'Passed', className: 'align-right', render: (row) => row.passed },
                  { key: 'failed', header: 'Failed', className: 'align-right', render: (row) => row.failed },
                  { key: 'highest', header: 'Highest', className: 'align-right', render: (row) => row.highest },
                  { key: 'lowest', header: 'Lowest', className: 'align-right', render: (row) => row.lowest },
                  { key: 'average', header: 'Average', className: 'align-right', render: (row) => row.average },
                  { key: 'pass', header: 'Pass %', className: 'align-right', render: (row) => percentText(row.passPercentage) },
                ]}
                emptyMessage="No subject summary."
                getRowKey={(row) => row.subjectName}
                rows={summary.subjectSummaries}
              />
            </section>
          )}
        </>
      )}

      {activeTab === 'templates' && (
        <section className="master-page-grid">
          <form className="panel master-form-card" onSubmit={(event) => void submitTemplate(event)}>
            <div className="panel-heading"><div><h3>{templateForm.id ? 'Edit Template' : 'Add Template'}</h3><p>Configure predefined report-card sections.</p></div></div>
            <div className="master-form-fields">
              {!canManage && <div className="form-note"><Icon name="lock" size={17} />Templates are read-only for your role.</div>}
              <label className="form-field"><span>Name</span><input disabled={!canManage} required value={templateForm.name} onChange={(event) => setTemplateForm({ ...templateForm, name: event.target.value })} /></label>
              <label className="form-field"><span>Class Scope</span><select disabled={!canManage} value={templateForm.className} onChange={(event) => setTemplateForm({ ...templateForm, className: event.target.value })}><option value="">All classes</option>{activeClasses.map((item) => <option key={item.id} value={item.name}>Class {item.name}</option>)}</select></label>
              {[
                ['showAttendance', 'Attendance'],
                ['showClassTests', 'Class tests'],
                ['showBehaviour', 'Behaviour'],
                ['showSkills', 'Skills'],
                ['showTeacherRemarks', 'Teacher remarks'],
                ['showPrincipalSignature', 'Principal signature'],
              ].map(([key, label]) => (
                <label className="import-checkbox import-checkbox--compact" key={key}>
                  <input checked={Boolean(templateForm[key as keyof TemplateForm])} disabled={!canManage} type="checkbox" onChange={(event) => setTemplateForm({ ...templateForm, [key]: event.target.checked })} />
                  <span><strong>{label}</strong></span>
                </label>
              ))}
              <label className="form-field"><span>Header Text</span><input disabled={!canManage} value={templateForm.headerText} onChange={(event) => setTemplateForm({ ...templateForm, headerText: event.target.value })} /></label>
              <label className="form-field"><span>Footer Text</span><input disabled={!canManage} value={templateForm.footerText} onChange={(event) => setTemplateForm({ ...templateForm, footerText: event.target.value })} /></label>
              {canManage && <button className="primary-button" type="submit"><Icon name="check" size={17} />Save Template</button>}
            </div>
          </form>
          <section className="panel">
            <div className="panel-heading"><div><h3>Templates</h3><p>Professional predefined layouts for report cards.</p></div></div>
            <DataTable columns={templateColumns} emptyMessage="No report card templates found." getRowKey={(template) => template.id} rows={templates} />
          </section>
        </section>
      )}

      {(preview || printCards.length > 0) && (
        <section className="panel report-print-area report-card-print-area">
          {preview && <ReportCardDocument data={preview} settings={settings} />}
          {printCards.map((card) => (
            <ReportCardDocument data={card} key={card.id} settings={settings} />
          ))}
        </section>
      )}
    </div>
  )
}
