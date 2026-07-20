import { useCallback, useEffect, useMemo, useState } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import { exportCsv, formatGeneratedAt } from '../../lib/reportUtils'
import type {
  AcademicSession,
  ClassItem,
  EmergencyContactReportRow,
  GuardianRelation,
  ParentsInfoReportFilter,
  ParentsInfoReportRow,
  SchoolSettings,
  SectionItem,
  SiblingReportRow,
  Student,
} from '../../types'

type ParentReportTab = 'parents' | 'emergency' | 'siblings'

const relationOptions: Array<GuardianRelation | 'All'> = [
  'All',
  'Father',
  'Mother',
  'Guardian',
  'Grandfather',
  'Grandmother',
  'Brother',
  'Sister',
  'Uncle',
  'Aunt',
  'Other',
]

function ReportHeader({
  settings,
  title,
  filters,
}: {
  settings: SchoolSettings | null
  title: string
  filters: string
}) {
  return (
    <header className="report-document-header">
      <div>
        <span className="report-school-mark">V</span>
        <div>
          <h2>{settings?.schoolName || 'School ERP'}</h2>
          <p>{settings?.address || 'School address'}</p>
        </div>
      </div>
      <div>
        <strong>{title}</strong>
        <span>{filters}</span>
        <small>{formatGeneratedAt()}</small>
      </div>
    </header>
  )
}

export function ParentsInfoReport() {
  const [activeTab, setActiveTab] = useState<ParentReportTab>('parents')
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [sections, setSections] = useState<SectionItem[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [settings, setSettings] = useState<SchoolSettings | null>(null)
  const [filter, setFilter] = useState<ParentsInfoReportFilter>({
    guardianRelation: 'All',
  })
  const [parentsRows, setParentsRows] = useState<ParentsInfoReportRow[]>([])
  const [emergencyRows, setEmergencyRows] = useState<EmergencyContactReportRow[]>([])
  const [siblingRows, setSiblingRows] = useState<SiblingReportRow[]>([])
  const [summary, setSummary] = useState({
    totalFamilies: 0,
    totalGuardians: 0,
    missingMobile: 0,
    missingEmail: 0,
    studentsWithoutLinkedGuardian: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadMasters = useCallback(async () => {
    const api = getErpApi()
    const [classRows, sectionRows, studentRows, sessionRows, schoolSettings] =
      await Promise.all([
        api.getClasses(),
        api.getSections(),
        api.getStudents(),
        api.getAcademicSessions(),
        api.getSchoolSettings(),
      ])
    setClasses(classRows)
    setSections(sectionRows)
    setStudents(studentRows)
    setSessions(sessionRows)
    setSettings(schoolSettings)
  }, [])

  const loadReports = useCallback(async () => {
    setIsLoading(true)
    try {
      const api = getErpApi()
      const [parents, emergency, siblings] = await Promise.all([
        api.getParentsInfoReport(filter),
        api.getEmergencyContactsReport(filter),
        api.getSiblingReport({
          className: filter.className,
          section: filter.section,
          status: 'Active',
        }),
      ])
      setParentsRows(parents.rows)
      setEmergencyRows(emergency.rows)
      setSiblingRows(siblings.rows)
      setSummary(parents.summary)
      setError('')
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  useEffect(() => {
    void Promise.resolve()
      .then(loadMasters)
      .then(loadReports)
      .catch((loadError: unknown) => {
        setError(getErrorMessage(loadError))
        setIsLoading(false)
      })
  }, [loadMasters, loadReports])

  const activeClasses = classes.filter((item) => item.status === 'Active')
  const filteredSections = sections.filter(
    (section) =>
      section.status === 'Active' &&
      (!filter.className || section.className === filter.className),
  )
  const filteredStudents = students.filter(
    (student) =>
      (!filter.className || student.className === filter.className) &&
      (!filter.section || student.section === filter.section),
  )

  const filterDetails = useMemo(() => {
    const parts = [
      filter.academicSessionId
        ? sessions.find((session) => session.id === filter.academicSessionId)
            ?.sessionName
        : 'All sessions',
      filter.className ? `Class ${filter.className}` : 'All classes',
      filter.section ? `Section ${filter.section}` : 'All sections',
      filter.guardianRelation && filter.guardianRelation !== 'All'
        ? filter.guardianRelation
        : 'All relations',
    ].filter(Boolean)
    return parts.join(' · ')
  }, [filter, sessions])

  const printReport = () => window.setTimeout(() => window.print(), 50)

  const exportParents = () =>
    exportCsv(
      'parents-info-report.csv',
      [
        'Admission No',
        'Student Name',
        'Class',
        'Section',
        'Family Code',
        'Guardian',
        'Relation',
        'Mobile',
        'Alternate Mobile',
        'Email',
        'Occupation',
        'Address',
        'Emergency Contact',
        'Pickup Authorized',
        'Source',
      ],
      parentsRows.map((row) => [
        row.admissionNo,
        row.studentName,
        row.className,
        row.section,
        row.familyCode,
        row.primaryGuardian,
        row.relation,
        row.mobile,
        row.alternateMobile,
        row.email,
        row.occupation,
        row.address,
        row.emergencyContact ? 'Yes' : 'No',
        row.pickupAuthorized ? 'Yes' : 'No',
        row.source,
      ]),
    )

  const exportEmergency = () =>
    exportCsv(
      'emergency-contacts-report.csv',
      [
        'Admission No',
        'Student Name',
        'Class',
        'Section',
        'Primary Guardian',
        'Emergency Contact',
        'Emergency Mobile',
        'Pickup Authorized People',
      ],
      emergencyRows.map((row) => [
        row.admissionNo,
        row.studentName,
        row.className,
        row.section,
        row.primaryGuardian,
        row.emergencyContactName,
        row.emergencyContactMobile,
        row.pickupAuthorizedPeople,
      ]),
    )

  const exportSiblings = () =>
    exportCsv(
      'sibling-report.csv',
      [
        'Family Code',
        'Family Name',
        'Primary Contact',
        'Mobile',
        'Student Count',
        'Students',
      ],
      siblingRows.map((row) => [
        row.familyCode,
        row.familyName,
        row.primaryContactName,
        row.primaryMobile,
        String(row.studentCount),
        row.students
          .map((student) => `${student.admissionNo} ${student.name}`)
          .join('; '),
      ]),
    )

  const parentsColumns: TableColumn<ParentsInfoReportRow>[] = [
    { key: 'admission', header: 'Admission No', render: (row) => row.admissionNo },
    { key: 'student', header: 'Student', render: (row) => row.studentName },
    { key: 'class', header: 'Class/Section', render: (row) => `${row.className}${row.section ? `-${row.section}` : ''}` },
    { key: 'family', header: 'Family Code', render: (row) => row.familyCode || '—' },
    { key: 'guardian', header: 'Primary Guardian', render: (row) => row.primaryGuardian || '—' },
    { key: 'relation', header: 'Relation', render: (row) => row.relation || '—' },
    { key: 'mobile', header: 'Mobile', render: (row) => row.mobile || '—' },
    { key: 'alt', header: 'Alternate', render: (row) => row.alternateMobile || '—' },
    { key: 'email', header: 'Email', render: (row) => row.email || '—' },
    { key: 'occupation', header: 'Occupation', render: (row) => row.occupation || '—' },
    { key: 'address', header: 'Address', render: (row) => row.address || '—' },
    { key: 'emergency', header: 'Emergency', render: (row) => row.emergencyContact ? 'Yes' : 'No' },
    { key: 'pickup', header: 'Pickup', render: (row) => row.pickupAuthorized ? 'Yes' : 'No' },
  ]

  const emergencyColumns: TableColumn<EmergencyContactReportRow>[] = [
    { key: 'student', header: 'Student', render: (row) => `${row.admissionNo} · ${row.studentName}` },
    { key: 'class', header: 'Class/Section', render: (row) => `${row.className}${row.section ? `-${row.section}` : ''}` },
    { key: 'guardian', header: 'Primary Guardian', render: (row) => row.primaryGuardian || '—' },
    { key: 'emergency', header: 'Emergency Contact', render: (row) => row.emergencyContactName || '—' },
    { key: 'mobile', header: 'Emergency Mobile', render: (row) => row.emergencyContactMobile || '—' },
    { key: 'pickup', header: 'Pickup Authorized People', render: (row) => row.pickupAuthorizedPeople || '—' },
  ]

  const siblingColumns: TableColumn<SiblingReportRow>[] = [
    { key: 'family', header: 'Family Code', render: (row) => row.familyCode },
    { key: 'name', header: 'Family Name', render: (row) => row.familyName || '—' },
    { key: 'contact', header: 'Primary Contact', render: (row) => row.primaryContactName || '—' },
    { key: 'mobile', header: 'Mobile', render: (row) => row.primaryMobile || '—' },
    { key: 'count', header: 'Students', render: (row) => row.studentCount },
    {
      key: 'students',
      header: 'Sibling Students',
      render: (row) =>
        row.students
          .map((student) => `${student.admissionNo} ${student.name}`)
          .join(', '),
    },
  ]

  return (
    <div className="parents-info-report">
      <section className="panel report-filters">
        <div className="report-filter-fields">
          <label className="form-field">
            <span>Academic Session</span>
            <select
              value={filter.academicSessionId ?? ''}
              onChange={(event) => setFilter({ ...filter, academicSessionId: event.target.value })}
            >
              <option value="">All sessions</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>{session.sessionName}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Class</span>
            <select
              value={filter.className ?? ''}
              onChange={(event) => setFilter({ ...filter, className: event.target.value, section: '', studentId: '' })}
            >
              <option value="">All classes</option>
              {activeClasses.map((item) => (
                <option key={item.id} value={item.name}>Class {item.name}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Section</span>
            <select
              disabled={!filter.className}
              value={filter.section ?? ''}
              onChange={(event) => setFilter({ ...filter, section: event.target.value, studentId: '' })}
            >
              <option value="">All sections</option>
              {filteredSections.map((section) => (
                <option key={section.id} value={section.name}>Section {section.name}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Student</span>
            <select
              value={filter.studentId ?? ''}
              onChange={(event) => setFilter({ ...filter, studentId: event.target.value })}
            >
              <option value="">All students</option>
              {filteredStudents.map((student) => (
                <option key={student.id} value={student.id}>{student.admissionNo} · {student.name}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Relation</span>
            <select
              value={filter.guardianRelation ?? 'All'}
              onChange={(event) => setFilter({ ...filter, guardianRelation: event.target.value as GuardianRelation | 'All' })}
            >
              {relationOptions.map((relation) => (
                <option key={relation} value={relation}>{relation}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="checkbox-grid report-checkboxes">
          <label><input checked={Boolean(filter.missingMobile)} onChange={(event) => setFilter({ ...filter, missingMobile: event.target.checked })} type="checkbox" /> Missing mobile</label>
          <label><input checked={Boolean(filter.missingEmail)} onChange={(event) => setFilter({ ...filter, missingEmail: event.target.checked })} type="checkbox" /> Missing email</label>
          <label><input checked={Boolean(filter.emergencyContact)} onChange={(event) => setFilter({ ...filter, emergencyContact: event.target.checked })} type="checkbox" /> Emergency contact</label>
          <label><input checked={Boolean(filter.pickupAuthorized)} onChange={(event) => setFilter({ ...filter, pickupAuthorized: event.target.checked })} type="checkbox" /> Pickup authorized</label>
        </div>
      </section>

      <nav className="settings-tabs" aria-label="Parent information report sections">
        {[
          ['parents', 'Parents Info'],
          ['emergency', 'Emergency Contacts'],
          ['siblings', 'Sibling Groups'],
        ].map(([id, label]) => (
          <button
            className={`settings-tab${activeTab === id ? ' settings-tab--active' : ''}`}
            key={id}
            onClick={() => setActiveTab(id as ParentReportTab)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>

      {error && (
        <div className="inline-message inline-message--error">
          <Icon name="close" size={17} />
          <span>{error}</span>
        </div>
      )}

      {activeTab === 'parents' && (
        <>
          <div className="report-toolbar">
            <div>
              <strong>Parents Info Report</strong>
              <span>{filterDetails}</span>
            </div>
            <div className="report-actions">
              <button className="secondary-button" disabled={parentsRows.length === 0} onClick={exportParents} type="button">
                <Icon name="download" size={16} />
                Export CSV
              </button>
              <button className="primary-button" disabled={parentsRows.length === 0} onClick={printReport} type="button">
                <Icon name="print" size={16} />
                Print
              </button>
            </div>
          </div>
          <section className="panel report-print-area parents-info-print-area">
            <ReportHeader filters={filterDetails} settings={settings} title="Parents Info Report" />
            <div className="report-summary-grid">
              <div><span>Total families</span><strong>{summary.totalFamilies}</strong></div>
              <div><span>Total guardians</span><strong>{summary.totalGuardians}</strong></div>
              <div><span>Missing mobile</span><strong>{summary.missingMobile}</strong></div>
              <div><span>Missing email</span><strong>{summary.missingEmail}</strong></div>
              <div><span>Without linked guardian</span><strong>{summary.studentsWithoutLinkedGuardian}</strong></div>
            </div>
            <DataTable
              columns={parentsColumns}
              emptyMessage={isLoading ? 'Loading parents information...' : 'No records match the selected filters.'}
              getRowKey={(row) => `${row.studentId}-${row.guardianId || row.primaryGuardian || 'legacy'}`}
              rows={parentsRows}
            />
          </section>
        </>
      )}

      {activeTab === 'emergency' && (
        <>
          <div className="report-toolbar">
            <div>
              <strong>Emergency Contacts Report</strong>
              <span>{filterDetails}</span>
            </div>
            <div className="report-actions">
              <button className="secondary-button" disabled={emergencyRows.length === 0} onClick={exportEmergency} type="button">
                <Icon name="download" size={16} />
                Export CSV
              </button>
              <button className="primary-button" disabled={emergencyRows.length === 0} onClick={printReport} type="button">
                <Icon name="print" size={16} />
                Print
              </button>
            </div>
          </div>
          <section className="panel report-print-area parents-info-print-area">
            <ReportHeader filters={filterDetails} settings={settings} title="Emergency Contacts Report" />
            <DataTable
              columns={emergencyColumns}
              emptyMessage={isLoading ? 'Loading emergency contacts...' : 'No emergency contact records found.'}
              getRowKey={(row) => `${row.studentId}-${row.emergencyContactName}-${row.emergencyContactMobile}`}
              rows={emergencyRows}
            />
          </section>
        </>
      )}

      {activeTab === 'siblings' && (
        <>
          <div className="report-toolbar">
            <div>
              <strong>Sibling Groups Report</strong>
              <span>{filterDetails}</span>
            </div>
            <div className="report-actions">
              <button className="secondary-button" disabled={siblingRows.length === 0} onClick={exportSiblings} type="button">
                <Icon name="download" size={16} />
                Export CSV
              </button>
              <button className="primary-button" disabled={siblingRows.length === 0} onClick={printReport} type="button">
                <Icon name="print" size={16} />
                Print
              </button>
            </div>
          </div>
          <section className="panel report-print-area parents-info-print-area">
            <ReportHeader filters={filterDetails} settings={settings} title="Sibling Groups Report" />
            <DataTable
              columns={siblingColumns}
              emptyMessage={isLoading ? 'Loading sibling groups...' : 'No sibling groups found.'}
              getRowKey={(row) => row.familyId}
              rows={siblingRows}
            />
          </section>
        </>
      )}
    </div>
  )
}
