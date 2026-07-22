/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import { exportCsv } from '../../lib/reportUtils'
import type {
  AuthUser,
  ClassItem,
  SchoolSettings,
  SectionItem,
  Student,
} from '../../types'

type AnyRow = Record<string, any>

const printPage = () => window.print()

const classSections = (sections: SectionItem[], className: string) =>
  sections.filter((section) => !className || section.className === className)

function ReportHeader({
  settings,
  title,
  subtitle,
}: {
  settings: SchoolSettings | null
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
          <h2>{settings?.schoolName || 'Vidhya School ERP'}</h2>
          {settings?.address && <p>{settings.address}</p>}
          {(settings?.phone || settings?.email) && (
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

export function StudentProgressReport({
  classes,
  currentUser,
  sections,
  settings,
  students,
}: {
  classes: ClassItem[]
  currentUser: AuthUser
  sections: SectionItem[]
  settings: SchoolSettings | null
  students: Student[]
}) {
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')
  const [studentId, setStudentId] = useState('')
  const [report, setReport] = useState<AnyRow | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const filteredSections = classSections(sections, className)
  const filteredStudents = students.filter(
    (student) =>
      (!className || student.className === className) &&
      (!section || student.section === section),
  )

  const loadReport = async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await getErpApi().getStudentProgressReport({
        className,
        section,
        studentId,
      })
      setReport(data)
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadReport()
  }, [])

  const rows = report?.rows ?? []
  const classColumns: TableColumn<AnyRow>[] = [
    { key: 'student', header: 'Student', render: (row) => row.student?.name },
    { key: 'admission', header: 'Admission No', render: (row) => row.student?.admissionNo },
    { key: 'previous', header: 'Previous %', render: (row) => row.previousPercentage ?? 'No data' },
    { key: 'current', header: 'Current %', render: (row) => row.currentPercentage ?? 'No data' },
    { key: 'change', header: 'Change', render: (row) => row.percentageChange ?? 'No data' },
    { key: 'indicator', header: 'Progress', render: (row) => <span className="neutral-badge">{row.indicator}</span> },
  ]
  const examColumns: TableColumn<AnyRow>[] = [
    { key: 'exam', header: 'Exam', render: (row) => row.exam?.name },
    { key: 'date', header: 'Date', render: (row) => row.exam?.examDate },
    { key: 'percentage', header: 'Percentage', render: (row) => row.percentage ?? 'No data' },
    { key: 'grade', header: 'Grade', render: (row) => row.grade || '--' },
    { key: 'result', header: 'Result', render: (row) => row.result },
  ]
  const classTestColumns: TableColumn<AnyRow>[] = [
    { key: 'test', header: 'Test', render: (row) => row.test_name },
    { key: 'subject', header: 'Subject', render: (row) => row.subject_name },
    { key: 'date', header: 'Date', render: (row) => row.test_date },
    { key: 'marks', header: 'Marks', render: (row) => row.marks_obtained ?? '--' },
    { key: 'result', header: 'Result', render: (row) => row.result_status },
  ]

  return (
    <div className="page-stack">
      {error && <div className="inline-message inline-message--error"><Icon name="close" size={17} /><span>{error}</span></div>}
      <section className="panel report-filters">
        <div className="report-filter-fields">
          <label className="form-field">
            <span>Class</span>
            <select value={className} onChange={(event) => { setClassName(event.target.value); setSection(''); setStudentId('') }}>
              <option value="">All classes</option>
              {classes.map((item) => <option key={item.id} value={item.name}>Class {item.name}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span>Section</span>
            <select value={section} onChange={(event) => { setSection(event.target.value); setStudentId('') }}>
              <option value="">All sections</option>
              {filteredSections.map((item) => <option key={item.id} value={item.name}>Section {item.name}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span>Student</span>
            <select value={studentId} onChange={(event) => setStudentId(event.target.value)}>
              <option value="">Class summary</option>
              {filteredStudents.map((student) => (
                <option key={student.id} value={student.id}>{student.name} ({student.admissionNo})</option>
              ))}
            </select>
          </label>
        </div>
        <button className="primary-button" type="button" onClick={() => void loadReport()}>
          <Icon name="reports" size={16} />
          Generate
        </button>
      </section>

      <section className="panel report-print-area">
        <ReportHeader
          settings={settings}
          title="Student Progress Report"
          subtitle={studentId ? report?.student?.name ?? 'Individual student' : 'Class progress summary'}
        />
        <div className="report-toolbar no-print">
          <div>
            <strong>{report?.mode === 'individual' ? 'Individual Student Progress' : 'Class Progress Summary'}</strong>
            <span>Generated from saved ERP data only.</span>
          </div>
          <div className="report-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                exportCsv(
                  'student-progress-report.csv',
                  studentId
                    ? ['Exam', 'Percentage', 'Grade', 'Result']
                    : ['Student', 'Admission No', 'Previous', 'Current', 'Change', 'Indicator'],
                  studentId
                    ? (report?.examResults ?? []).map((row: AnyRow) => [row.exam?.name, row.percentage, row.grade, row.result])
                    : rows.map((row: AnyRow) => [row.student?.name, row.student?.admissionNo, row.previousPercentage, row.currentPercentage, row.percentageChange, row.indicator]),
                )
              }
            >
              <Icon name="download" size={16} />
              Export CSV
            </button>
            <button className="primary-button" type="button" onClick={printPage}>
              <Icon name="print" size={16} />
              Print
            </button>
          </div>
        </div>

        {report?.mode === 'individual' ? (
          <>
            <div className="report-summary-grid">
              <div className="report-summary-card"><span>Working Days</span><strong>{report.attendance?.workingDays ?? 0}</strong></div>
              <div className="report-summary-card"><span>Present Days</span><strong>{report.attendance?.presentDays ?? 0}</strong></div>
              <div className="report-summary-card"><span>Attendance</span><strong>{report.attendance?.percentage == null ? 'No data' : `${report.attendance.percentage}%`}</strong></div>
              <div className="report-summary-card"><span>Generated By</span><strong>{currentUser.name}</strong></div>
            </div>
            <h3>Exam Performance</h3>
            <DataTable columns={examColumns} rows={report.examResults ?? []} getRowKey={(row) => row.exam?.id ?? row.exam?.name} emptyMessage="No exam result data available." />
            <h3>Class Test Performance</h3>
            <DataTable columns={classTestColumns} rows={report.classTests ?? []} getRowKey={(row) => `${row.test_name}-${row.subject_name}-${row.test_date}`} emptyMessage="No class test data available." />
          </>
        ) : (
          <DataTable columns={classColumns} rows={rows} getRowKey={(row) => row.student?.id} emptyMessage={isLoading ? 'Loading progress data...' : 'No progress data available.'} />
        )}
      </section>
    </div>
  )
}

interface ReportDomain {
  name: string
  columns: { key: string; label: string }[]
}

export function CustomisedReports({ currentUser }: { currentUser: AuthUser }) {
  const [domains, setDomains] = useState<ReportDomain[]>([])
  const [definitions, setDefinitions] = useState<AnyRow[]>([])
  const [domainName, setDomainName] = useState('')
  const [name, setName] = useState('')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [filterColumn, setFilterColumn] = useState('')
  const [filterValue, setFilterValue] = useState('')
  const [preview, setPreview] = useState<AnyRow | null>(null)
  const [error, setError] = useState('')

  const domain = useMemo(
    () => domains.find((item) => item.name === domainName),
    [domainName, domains],
  )

  const load = async () => {
    try {
      const [domainRows, definitionRows] = await Promise.all([
        getErpApi().getCustomReportDomains(),
        getErpApi().getSavedReportDefinitions({}),
      ])
      setDomains(domainRows as ReportDomain[])
      setDefinitions(definitionRows)
      if (!domainName && domainRows.length > 0) {
        setDomainName(domainRows[0].name)
        setSelectedColumns(domainRows[0].columns.slice(0, 5).map((column: AnyRow) => column.key))
      }
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const buildPayload = () => ({
    name: name || `${domainName} Report`,
    reportDomain: domainName,
    selectedColumns,
    filters: filterColumn && filterValue ? { [filterColumn]: filterValue } : {},
    sort: [],
    group: [],
    visibility: currentUser.role === 'Owner' || currentUser.role === 'Admin' ? 'Shared' : 'Private',
  })

  const runPreview = async () => {
    setError('')
    try {
      setPreview(await getErpApi().previewCustomReport(buildPayload()))
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  const saveDefinition = async () => {
    setError('')
    try {
      await getErpApi().saveReportDefinition(buildPayload())
      await load()
    } catch (error) {
      setError(getErrorMessage(error))
    }
  }

  const rows = preview?.rows ?? []
  const columns: TableColumn<AnyRow>[] = (preview?.columns ?? []).map((column: AnyRow) => ({
    key: column.key,
    header: column.label,
    render: (row: AnyRow) => row[column.key] ?? '',
  }))

  return (
    <div className="page-stack">
      {error && <div className="inline-message inline-message--error"><Icon name="close" size={17} /><span>{error}</span></div>}
      <section className="panel report-filters">
        <div className="report-filter-fields">
          <label className="form-field">
            <span>Report Domain</span>
            <select value={domainName} onChange={(event) => {
              const nextDomain = domains.find((item) => item.name === event.target.value)
              setDomainName(event.target.value)
              setSelectedColumns(nextDomain?.columns.slice(0, 5).map((column) => column.key) ?? [])
              setFilterColumn('')
              setPreview(null)
            }}>
              {domains.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span>Report Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder={`${domainName || 'Custom'} Report`} />
          </label>
          <label className="form-field">
            <span>Filter Column</span>
            <select value={filterColumn} onChange={(event) => setFilterColumn(event.target.value)}>
              <option value="">No filter</option>
              {domain?.columns.map((column) => <option key={column.key} value={column.key}>{column.label}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span>Filter Value</span>
            <input value={filterValue} onChange={(event) => setFilterValue(event.target.value)} disabled={!filterColumn} />
          </label>
        </div>
        <div className="checkbox-grid">
          {domain?.columns.map((column) => (
            <label className="checkbox-row" key={column.key}>
              <input
                type="checkbox"
                checked={selectedColumns.includes(column.key)}
                onChange={(event) => {
                  setSelectedColumns((current) =>
                    event.target.checked
                      ? [...current, column.key]
                      : current.filter((key) => key !== column.key),
                  )
                }}
              />
              <span>{column.label}</span>
            </label>
          ))}
        </div>
        <div className="form-actions">
          <button className="secondary-button" type="button" onClick={() => void saveDefinition()}>
            <Icon name="check" size={16} />
            Save Definition
          </button>
          <button className="primary-button" type="button" onClick={() => void runPreview()}>
            <Icon name="reports" size={16} />
            Preview
          </button>
        </div>
      </section>

      <section className="panel">
        <h3>Saved Definitions</h3>
        <DataTable
          columns={[
            { key: 'name', header: 'Name', render: (row) => row.name },
            { key: 'domain', header: 'Domain', render: (row) => row.reportDomain },
            { key: 'visibility', header: 'Visibility', render: (row) => row.visibility },
            { key: 'updated', header: 'Updated', render: (row) => row.updatedAt },
          ]}
          rows={definitions}
          getRowKey={(row) => row.id}
          emptyMessage="No saved report definitions."
        />
      </section>

      <section className="panel report-print-area">
        <ReportHeader settings={null} title={preview?.domain ?? 'Customised Report'} subtitle={`${rows.length} row(s)`} />
        <div className="report-toolbar no-print">
          <div><strong>Report Preview</strong><span>Built from approved ERP report domains only.</span></div>
          <div className="report-actions">
            <button className="secondary-button" type="button" onClick={() => exportCsv('customised-report.csv', (preview?.columns ?? []).map((column: AnyRow) => column.label), rows.map((row: AnyRow) => (preview?.columns ?? []).map((column: AnyRow) => row[column.key])))}>
              <Icon name="download" size={16} />
              Export CSV
            </button>
            <button className="primary-button" type="button" onClick={printPage}>
              <Icon name="print" size={16} />
              Print
            </button>
          </div>
        </div>
        <DataTable columns={columns} rows={rows} getRowKey={(row) => JSON.stringify(row)} emptyMessage="Preview a report definition to see rows." />
      </section>
    </div>
  )
}
