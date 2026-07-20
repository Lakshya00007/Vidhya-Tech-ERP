import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { DataTable, type TableColumn } from '../components/DataTable'
import { Icon } from '../components/Icon'
import { getErpApi, getErrorMessage } from '../lib/erpApi'
import { StudentReportCards } from './reports/StudentReportCards'
import { ParentsInfoReport } from './reports/ParentsInfoReport'
import {
  exportCsv,
  formatCurrency,
  formatGeneratedAt,
  formatReportDate,
  formatReportMonth,
  getCurrentMonthValue,
  getMonthDateRange,
  getTodayValue,
} from '../lib/reportUtils'
import type {
  AttendanceRecord,
  ClassItem,
  FeePayment,
  FeeStructure,
  PaymentMode,
  SchoolSettings,
  SectionItem,
  Student,
  StudentStatus,
  AuthUser,
} from '../types'

export type ReportTab =
  | 'students'
  | 'daily'
  | 'monthly'
  | 'attendance'
  | 'fee-due'
  | 'parents-info'
  | 'report-cards'

interface ReportMetric {
  label: string
  value: ReactNode
  tone?: 'default' | 'success' | 'danger' | 'primary'
}

interface FeeDueRow {
  student: Student
  configuredAmount: number
  paidAmount: number
  estimatedDue: number
}

const reportTabs: { id: ReportTab; label: string }[] = [
  { id: 'students', label: 'Student List' },
  { id: 'daily', label: 'Daily Collection' },
  { id: 'monthly', label: 'Monthly Collection' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'fee-due', label: 'Fee Due' },
  { id: 'parents-info', label: 'Parents Info' },
  { id: 'report-cards', label: 'Report Cards' },
]

const paymentModes: PaymentMode[] = [
  'Cash',
  'UPI',
  'Card',
  'Bank Transfer',
  'Cheque',
]

const sumPayments = (payments: FeePayment[]) =>
  payments.reduce((total, payment) => total + payment.amount, 0)

const paymentModeMetrics = (payments: FeePayment[]): ReportMetric[] =>
  paymentModes.map((mode) => ({
    label: mode,
    value: formatCurrency(
      payments
        .filter((payment) => payment.paymentMode === mode)
        .reduce((total, payment) => total + payment.amount, 0),
    ),
  }))

const sectionLabel = (className: string, section: string) =>
  className
    ? `Class ${className}${section ? `, Section ${section}` : ', all sections'}`
    : 'All classes and sections'

function ReportDocumentHeader({
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
      <div className="report-school-identity">
        <span className="report-school-mark">
          <Icon name="school" size={24} />
        </span>
        <div>
          <h2>{settings?.schoolName || 'Vidhya School ERP'}</h2>
          {settings?.address && <p>{settings.address}</p>}
          {(settings?.phone || settings?.email) && (
            <span>
              {[settings.phone, settings.email].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
      </div>
      <div className="report-document-title">
        <h1>{title}</h1>
        <p>{filters}</p>
        <span>Generated {formatGeneratedAt()}</span>
      </div>
    </header>
  )
}

function ReportSummary({ metrics }: { metrics: ReportMetric[] }) {
  return (
    <div className="report-summary-grid">
      {metrics.map((metric) => (
        <div className="report-summary-card" key={metric.label}>
          <span>{metric.label}</span>
          <strong
            className={
              metric.tone && metric.tone !== 'default'
                ? `report-summary-card--${metric.tone}`
                : undefined
            }
          >
            {metric.value}
          </strong>
        </div>
      ))}
    </div>
  )
}

function ReportActions({
  onExport,
  onPrint,
  exportDisabled = false,
}: {
  onExport: () => void
  onPrint: () => void
  exportDisabled?: boolean
}) {
  return (
    <div className="report-actions">
      <button
        className="secondary-button"
        disabled={exportDisabled}
        type="button"
        onClick={onExport}
      >
        <Icon name="download" size={16} />
        Export CSV
      </button>
      <button className="primary-button" type="button" onClick={onPrint}>
        <Icon name="print" size={16} />
        Print
      </button>
    </div>
  )
}

const collectionColumns: TableColumn<FeePayment>[] = [
  {
    key: 'receipt',
    header: 'Receipt No.',
    render: (payment) => (
      <span className="table-primary">{payment.receiptNo}</span>
    ),
  },
  {
    key: 'date',
    header: 'Date',
    render: (payment) => formatReportDate(payment.paymentDate),
  },
  {
    key: 'student',
    header: 'Student',
    render: (payment) => payment.studentName,
  },
  {
    key: 'class',
    header: 'Class',
    render: (payment) =>
      `${payment.className || '—'}${payment.section ? `-${payment.section}` : ''}`,
  },
  {
    key: 'fee-type',
    header: 'Fee Type',
    render: (payment) => payment.feeType || '—',
  },
  {
    key: 'mode',
    header: 'Payment Mode',
    render: (payment) => (
      <span className="neutral-badge">{payment.paymentMode}</span>
    ),
  },
  {
    key: 'amount',
    header: 'Amount',
    className: 'align-right',
    render: (payment) => <strong>{formatCurrency(payment.amount)}</strong>,
  },
]

function CollectionReport({
  title,
  filterDetails,
  settings,
  payments,
  isLoading,
  emptyMessage,
  exportFilename,
  onPrint,
}: {
  title: string
  filterDetails: string
  settings: SchoolSettings | null
  payments: FeePayment[]
  isLoading: boolean
  emptyMessage: string
  exportFilename: string
  onPrint: () => void
}) {
  const total = sumPayments(payments)

  const exportRows = () =>
    exportCsv(
      exportFilename,
      [
        'Receipt No',
        'Date',
        'Student',
        'Class',
        'Section',
        'Fee Type',
        'Payment Mode',
        'Amount',
      ],
      payments.map((payment) => [
        payment.receiptNo,
        payment.paymentDate,
        payment.studentName,
        payment.className,
        payment.section,
        payment.feeType,
        payment.paymentMode,
        payment.amount,
      ]),
    )

  return (
    <>
      <div className="report-toolbar">
        <div>
          <strong>{title}</strong>
          <span>{filterDetails}</span>
        </div>
        <ReportActions
          exportDisabled={payments.length === 0}
          onExport={exportRows}
          onPrint={onPrint}
        />
      </div>
      <section className="panel report-print-area">
        <ReportDocumentHeader
          filters={filterDetails}
          settings={settings}
          title={title}
        />
        <ReportSummary
          metrics={[
            {
              label: 'Total Collection',
              value: formatCurrency(total),
              tone: 'success',
            },
            { label: 'Receipts', value: payments.length, tone: 'primary' },
            ...paymentModeMetrics(payments),
          ]}
        />
        <DataTable
          columns={collectionColumns}
          emptyMessage={isLoading ? 'Loading receipts...' : emptyMessage}
          getRowKey={(payment) => payment.id}
          rows={payments}
        />
        <footer className="report-document-footer">
          <span>{payments.length} receipts</span>
          <strong>Total: {formatCurrency(total)}</strong>
        </footer>
      </section>
    </>
  )
}

interface ReportsProps {
  currentUser: AuthUser
  initialTab?: ReportTab
}

export function Reports({
  currentUser,
  initialTab = 'students',
}: ReportsProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>(initialTab)
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [sections, setSections] = useState<SectionItem[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [allPayments, setAllPayments] = useState<FeePayment[]>([])
  const [settings, setSettings] = useState<SchoolSettings | null>(null)
  const [studentClass, setStudentClass] = useState('')
  const [studentSection, setStudentSection] = useState('')
  const [studentStatus, setStudentStatus] = useState<'All' | StudentStatus>(
    'All',
  )
  const [dailyDate, setDailyDate] = useState(getTodayValue)
  const [dailyPayments, setDailyPayments] = useState<FeePayment[]>([])
  const [monthlyValue, setMonthlyValue] = useState(getCurrentMonthValue)
  const [monthlyPayments, setMonthlyPayments] = useState<FeePayment[]>([])
  const [attendanceStart, setAttendanceStart] = useState(getTodayValue)
  const [attendanceEnd, setAttendanceEnd] = useState(getTodayValue)
  const [attendanceClass, setAttendanceClass] = useState('')
  const [attendanceSection, setAttendanceSection] = useState('')
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRecord[]>([])
  const [dueClass, setDueClass] = useState('')
  const [dueSection, setDueSection] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDailyLoading, setIsDailyLoading] = useState(false)
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(false)
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false)
  const [error, setError] = useState('')
  const canViewFinanceReports = ['Owner', 'Admin', 'Accountant'].includes(
    currentUser.role,
  )

  const visibleReportTabs = useMemo(
    () =>
      reportTabs.filter((tab) => {
        if (currentUser.role === 'Owner' || currentUser.role === 'Admin') {
          return true
        }
        if (currentUser.role === 'Accountant') {
          return true
        }
        return ['students', 'attendance', 'parents-info', 'report-cards'].includes(tab.id)
      }),
    [currentUser.role],
  )

  useEffect(() => {
    if (!visibleReportTabs.some((tab) => tab.id === activeTab)) {
      void Promise.resolve().then(() =>
        setActiveTab(visibleReportTabs[0]?.id ?? 'students'),
      )
    }
  }, [activeTab, visibleReportTabs])

  useEffect(() => {
    let isCurrent = true

    Promise.resolve()
      .then(() => {
        const api = getErpApi()
        return Promise.all([
          api.getStudents(),
          api.getClasses(),
          api.getSections(),
          canViewFinanceReports
            ? api.getFeeStructures()
            : Promise.resolve([]),
          canViewFinanceReports ? api.getFeePayments() : Promise.resolve([]),
          api.getSchoolSettings(),
        ])
      })
      .then(
        ([
          studentRows,
          classRows,
          sectionRows,
          structureRows,
          paymentRows,
          schoolSettings,
        ]) => {
          if (!isCurrent) return
          const firstClass =
            classRows.find((item) => item.status === 'Active')?.name ?? ''
          setStudents(studentRows)
          setClasses(classRows)
          setSections(sectionRows)
          setFeeStructures(structureRows)
          setAllPayments(paymentRows)
          setSettings(schoolSettings)
          setDueClass(firstClass)
          setError('')
        },
      )
      .catch((loadError: unknown) => {
        if (isCurrent) setError(getErrorMessage(loadError))
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [canViewFinanceReports])

  useEffect(() => {
    if (activeTab !== 'daily' || !dailyDate) return
    let isCurrent = true

    Promise.resolve()
      .then(() => {
        if (!isCurrent) return []
        setIsDailyLoading(true)
        return getErpApi().getFeePaymentsByDateRange(dailyDate, dailyDate)
      })
      .then((rows) => {
        if (isCurrent) {
          setDailyPayments(rows)
          setError('')
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setDailyPayments([])
          setError(getErrorMessage(loadError))
        }
      })
      .finally(() => {
        if (isCurrent) setIsDailyLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [activeTab, dailyDate])

  useEffect(() => {
    if (activeTab !== 'monthly') return
    const range = getMonthDateRange(monthlyValue)
    if (!range) {
      void Promise.resolve().then(() => {
        setMonthlyPayments([])
        setError('Select a valid month.')
      })
      return
    }

    let isCurrent = true
    Promise.resolve()
      .then(() => {
        if (!isCurrent) return []
        setIsMonthlyLoading(true)
        return getErpApi().getFeePaymentsByDateRange(
          range.startDate,
          range.endDate,
        )
      })
      .then((rows) => {
        if (isCurrent) {
          setMonthlyPayments(rows)
          setError('')
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setMonthlyPayments([])
          setError(getErrorMessage(loadError))
        }
      })
      .finally(() => {
        if (isCurrent) setIsMonthlyLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [activeTab, monthlyValue])

  useEffect(() => {
    if (activeTab !== 'attendance') return
    if (!attendanceStart || !attendanceEnd || attendanceStart > attendanceEnd) {
      void Promise.resolve().then(() => {
        setAttendanceRows([])
        setError('Start date must be before or equal to end date.')
      })
      return
    }

    let isCurrent = true
    Promise.resolve()
      .then(() => {
        if (!isCurrent) return []
        setIsAttendanceLoading(true)
        return getErpApi().getAttendanceByDateRange(
          attendanceStart,
          attendanceEnd,
        )
      })
      .then((rows) => {
        if (isCurrent) {
          setAttendanceRows(rows)
          setError('')
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setAttendanceRows([])
          setError(getErrorMessage(loadError))
        }
      })
      .finally(() => {
        if (isCurrent) setIsAttendanceLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [activeTab, attendanceEnd, attendanceStart])

  const activeClasses = useMemo(
    () => classes.filter((item) => item.status === 'Active'),
    [classes],
  )

  const sectionsForClass = (className: string) =>
    sections.filter(
      (item) =>
        item.status === 'Active' && item.className === className,
    )

  const studentSections = sectionsForClass(studentClass)
  const attendanceSections = sectionsForClass(attendanceClass)
  const dueSections = sectionsForClass(dueClass)

  const filteredStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          (!studentClass || student.className === studentClass) &&
          (!studentSection || student.section === studentSection) &&
          (studentStatus === 'All' || student.status === studentStatus),
      ),
    [studentClass, studentSection, studentStatus, students],
  )

  const filteredAttendance = useMemo(
    () =>
      attendanceRows.filter(
        (record) =>
          (!attendanceClass || record.className === attendanceClass) &&
          (!attendanceSection || record.section === attendanceSection),
      ),
    [attendanceClass, attendanceRows, attendanceSection],
  )

  const attendanceSummary = useMemo(() => {
    const present = filteredAttendance.filter(
      (record) => record.status === 'Present',
    ).length
    const absent = filteredAttendance.filter(
      (record) => record.status === 'Absent',
    ).length
    const leave = filteredAttendance.filter(
      (record) => record.status === 'Leave',
    ).length
    return {
      total: filteredAttendance.length,
      present,
      absent,
      leave,
      percentage:
        filteredAttendance.length > 0
          ? (present / filteredAttendance.length) * 100
          : null,
    }
  }, [filteredAttendance])

  const dueStructureTotal = useMemo(
    () =>
      feeStructures
        .filter(
          (structure) =>
            structure.status === 'Active' &&
            structure.className === dueClass &&
            (!settings?.academicYear ||
              !structure.academicYear ||
              structure.academicYear === settings.academicYear),
        )
        .reduce((total, structure) => total + structure.amount, 0),
    [dueClass, feeStructures, settings],
  )

  const dueRows = useMemo<FeeDueRow[]>(
    () =>
      students
        .filter(
          (student) =>
            student.status === 'Active' &&
            student.className === dueClass &&
            (!dueSection || student.section === dueSection),
        )
        .map((student) => {
          const paidAmount = allPayments
            .filter(
              (payment) =>
                payment.studentId === student.id ||
                (!payment.studentId &&
                  payment.admissionNo === student.admissionNo),
            )
            .reduce((total, payment) => total + payment.amount, 0)
          return {
            student,
            configuredAmount: dueStructureTotal,
            paidAmount,
            estimatedDue: dueStructureTotal - paidAmount,
          }
        }),
    [allPayments, dueClass, dueSection, dueStructureTotal, students],
  )

  const dueTotals = useMemo(
    () => ({
      configured: dueRows.reduce(
        (total, row) => total + row.configuredAmount,
        0,
      ),
      paid: dueRows.reduce((total, row) => total + row.paidAmount, 0),
      due: dueRows.reduce((total, row) => total + row.estimatedDue, 0),
    }),
    [dueRows],
  )

  const studentColumns: TableColumn<Student>[] = [
    {
      key: 'admission',
      header: 'Admission No.',
      render: (student) => (
        <span className="table-primary">{student.admissionNo}</span>
      ),
    },
    { key: 'name', header: 'Student Name', render: (student) => student.name },
    { key: 'class', header: 'Class', render: (student) => student.className },
    {
      key: 'section',
      header: 'Section',
      render: (student) => student.section || '—',
    },
    {
      key: 'guardian',
      header: 'Guardian',
      render: (student) => student.guardianName || '—',
    },
    {
      key: 'mobile',
      header: 'Mobile',
      render: (student) => student.mobile || '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (student) => (
        <span
          className={`status-badge status-badge--${student.status.toLowerCase()}`}
        >
          {student.status}
        </span>
      ),
    },
  ]

  const attendanceColumns: TableColumn<AttendanceRecord>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (record) => formatReportDate(record.attendanceDate),
    },
    {
      key: 'admission',
      header: 'Admission No.',
      render: (record) => record.admissionNo || '—',
    },
    {
      key: 'student',
      header: 'Student Name',
      render: (record) => record.studentName,
    },
    { key: 'class', header: 'Class', render: (record) => record.className },
    {
      key: 'section',
      header: 'Section',
      render: (record) => record.section || '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (record) => (
        <span
          className={`report-attendance-status report-attendance-status--${record.status.toLowerCase()}`}
        >
          {record.status}
        </span>
      ),
    },
    {
      key: 'remarks',
      header: 'Remarks',
      render: (record) => record.remarks || '—',
    },
  ]

  const dueColumns: TableColumn<FeeDueRow>[] = [
    {
      key: 'admission',
      header: 'Admission No.',
      render: (row) => (
        <span className="table-primary">{row.student.admissionNo}</span>
      ),
    },
    {
      key: 'student',
      header: 'Student Name',
      render: (row) => row.student.name,
    },
    {
      key: 'class',
      header: 'Class / Section',
      render: (row) =>
        `${row.student.className}${row.student.section ? `-${row.student.section}` : ''}`,
    },
    {
      key: 'configured',
      header: 'Configured Fee',
      className: 'align-right',
      render: (row) => formatCurrency(row.configuredAmount),
    },
    {
      key: 'paid',
      header: 'Recorded Paid',
      className: 'align-right',
      render: (row) => (
        <span className="text-success">{formatCurrency(row.paidAmount)}</span>
      ),
    },
    {
      key: 'due',
      header: 'Estimated Due',
      className: 'align-right',
      render: (row) => (
        <strong className={row.estimatedDue > 0 ? 'text-danger' : 'text-success'}>
          {formatCurrency(row.estimatedDue)}
        </strong>
      ),
    },
  ]

  const changeTab = (tab: ReportTab) => {
    setActiveTab(tab)
    setError('')
  }

  const printReport = () => {
    window.setTimeout(() => window.print(), 50)
  }

  const changeStudentClass = (className: string) => {
    setStudentClass(className)
    setStudentSection('')
  }

  const changeAttendanceClass = (className: string) => {
    setAttendanceClass(className)
    setAttendanceSection('')
  }

  const changeDueClass = (className: string) => {
    setDueClass(className)
    setDueSection('')
  }

  const exportStudentList = () =>
    exportCsv(
      'student-list-report.csv',
      [
        'Admission No',
        'Student Name',
        'Class',
        'Section',
        'Guardian',
        'Mobile',
        'Status',
      ],
      filteredStudents.map((student) => [
        student.admissionNo,
        student.name,
        student.className,
        student.section,
        student.guardianName,
        student.mobile,
        student.status,
      ]),
    )

  const exportAttendance = () =>
    exportCsv(
      'attendance-report.csv',
      [
        'Date',
        'Admission No',
        'Student Name',
        'Class',
        'Section',
        'Status',
        'Remarks',
      ],
      filteredAttendance.map((record) => [
        record.attendanceDate,
        record.admissionNo,
        record.studentName,
        record.className,
        record.section,
        record.status,
        record.remarks,
      ]),
    )

  const exportDue = () =>
    exportCsv(
      'fee-due-report.csv',
      [
        'Admission No',
        'Student Name',
        'Class',
        'Section',
        'Configured Fee',
        'Recorded Paid',
        'Estimated Due',
      ],
      dueRows.map((row) => [
        row.student.admissionNo,
        row.student.name,
        row.student.className,
        row.student.section,
        row.configuredAmount,
        row.paidAmount,
        row.estimatedDue,
      ]),
    )

  const studentFilterDetails = `${sectionLabel(studentClass, studentSection)} · ${
    studentStatus === 'All' ? 'All statuses' : studentStatus
  }`
  const attendanceFilterDetails = `${formatReportDate(
    attendanceStart,
  )} to ${formatReportDate(attendanceEnd)} · ${sectionLabel(
    attendanceClass,
    attendanceSection,
  )}`
  const dueFilterDetails = `${sectionLabel(dueClass, dueSection)} · ${
    settings?.academicYear || 'All configured academic years'
  }`

  return (
    <div className="page-stack reports-page">
      <section className="page-header">
        <div>
          <h2>Reports</h2>
          <p>Review, print and export operational school records.</p>
        </div>
      </section>

      <nav className="report-tabs" aria-label="Report types">
        {visibleReportTabs.map((tab) => (
          <button
            className={`report-tab${activeTab === tab.id ? ' report-tab--active' : ''}`}
            key={tab.id}
            onClick={() => changeTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {error && (
        <div className="inline-message inline-message--error">
          <Icon name="close" size={17} />
          <span>{error}</span>
          <button
            aria-label="Dismiss error"
            type="button"
            onClick={() => setError('')}
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      {activeTab === 'students' && (
        <>
          <section className="panel report-filters">
            <div className="report-filter-fields">
              <label className="form-field">
                <span>Class</span>
                <select
                  value={studentClass}
                  onChange={(event) => changeStudentClass(event.target.value)}
                >
                  <option value="">All classes</option>
                  {activeClasses.map((item) => (
                    <option key={item.id} value={item.name}>
                      Class {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Section</span>
                <select
                  disabled={!studentClass || studentSections.length === 0}
                  value={studentSection}
                  onChange={(event) => setStudentSection(event.target.value)}
                >
                  <option value="">All sections</option>
                  {studentSections.map((item) => (
                    <option key={item.id} value={item.name}>
                      Section {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Status</span>
                <select
                  value={studentStatus}
                  onChange={(event) =>
                    setStudentStatus(
                      event.target.value as 'All' | StudentStatus,
                    )
                  }
                >
                  <option value="All">All statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
            </div>
          </section>
          <div className="report-toolbar">
            <div>
              <strong>Student List Report</strong>
              <span>{studentFilterDetails}</span>
            </div>
            <ReportActions
              exportDisabled={filteredStudents.length === 0}
              onExport={exportStudentList}
              onPrint={printReport}
            />
          </div>
          <section className="panel report-print-area">
            <ReportDocumentHeader
              filters={studentFilterDetails}
              settings={settings}
              title="Student List Report"
            />
            <ReportSummary
              metrics={[
                {
                  label: 'Students',
                  value: filteredStudents.length,
                  tone: 'primary',
                },
                {
                  label: 'Active',
                  value: filteredStudents.filter(
                    (student) => student.status === 'Active',
                  ).length,
                  tone: 'success',
                },
                {
                  label: 'Inactive',
                  value: filteredStudents.filter(
                    (student) => student.status === 'Inactive',
                  ).length,
                },
              ]}
            />
            <DataTable
              columns={studentColumns}
              emptyMessage={
                isLoading
                  ? 'Loading students...'
                  : students.length === 0
                    ? 'Create students first.'
                    : 'No students match the selected filters.'
              }
              getRowKey={(student) => student.id}
              rows={filteredStudents}
            />
            <footer className="report-document-footer">
              <span>{studentFilterDetails}</span>
              <strong>{filteredStudents.length} students</strong>
            </footer>
          </section>
        </>
      )}

      {activeTab === 'daily' && (
        <>
          <section className="panel report-filters">
            <div className="report-filter-fields report-filter-fields--compact">
              <label className="form-field">
                <span>Collection Date</span>
                <input
                  type="date"
                  value={dailyDate}
                  onChange={(event) => setDailyDate(event.target.value)}
                />
              </label>
            </div>
          </section>
          <CollectionReport
            emptyMessage="No receipts found for this date."
            exportFilename={`daily-collection-${dailyDate}.csv`}
            filterDetails={formatReportDate(dailyDate)}
            isLoading={isDailyLoading}
            onPrint={printReport}
            payments={dailyPayments}
            settings={settings}
            title="Daily Collection Report"
          />
        </>
      )}

      {activeTab === 'monthly' && (
        <>
          <section className="panel report-filters">
            <div className="report-filter-fields report-filter-fields--compact">
              <label className="form-field">
                <span>Collection Month</span>
                <input
                  type="month"
                  value={monthlyValue}
                  onChange={(event) => setMonthlyValue(event.target.value)}
                />
              </label>
            </div>
          </section>
          <CollectionReport
            emptyMessage="No receipts found for this month."
            exportFilename={`monthly-collection-${monthlyValue}.csv`}
            filterDetails={
              getMonthDateRange(monthlyValue)
                ? formatReportMonth(monthlyValue)
                : 'Select a month'
            }
            isLoading={isMonthlyLoading}
            onPrint={printReport}
            payments={monthlyPayments}
            settings={settings}
            title="Monthly Collection Report"
          />
        </>
      )}

      {activeTab === 'attendance' && (
        <>
          <section className="panel report-filters">
            <div className="report-filter-fields report-filter-fields--attendance">
              <label className="form-field">
                <span>Start Date</span>
                <input
                  type="date"
                  value={attendanceStart}
                  onChange={(event) => setAttendanceStart(event.target.value)}
                />
              </label>
              <label className="form-field">
                <span>End Date</span>
                <input
                  type="date"
                  value={attendanceEnd}
                  onChange={(event) => setAttendanceEnd(event.target.value)}
                />
              </label>
              <label className="form-field">
                <span>Class</span>
                <select
                  value={attendanceClass}
                  onChange={(event) =>
                    changeAttendanceClass(event.target.value)
                  }
                >
                  <option value="">All classes</option>
                  {activeClasses.map((item) => (
                    <option key={item.id} value={item.name}>
                      Class {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Section</span>
                <select
                  disabled={
                    !attendanceClass || attendanceSections.length === 0
                  }
                  value={attendanceSection}
                  onChange={(event) =>
                    setAttendanceSection(event.target.value)
                  }
                >
                  <option value="">All sections</option>
                  {attendanceSections.map((item) => (
                    <option key={item.id} value={item.name}>
                      Section {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
          <div className="report-toolbar">
            <div>
              <strong>Attendance Report</strong>
              <span>{attendanceFilterDetails}</span>
            </div>
            <ReportActions
              exportDisabled={filteredAttendance.length === 0}
              onExport={exportAttendance}
              onPrint={printReport}
            />
          </div>
          <section className="panel report-print-area">
            <ReportDocumentHeader
              filters={attendanceFilterDetails}
              settings={settings}
              title="Attendance Report"
            />
            <ReportSummary
              metrics={[
                {
                  label: 'Total Marked',
                  value: attendanceSummary.total,
                  tone: 'primary',
                },
                {
                  label: 'Present',
                  value: attendanceSummary.present,
                  tone: 'success',
                },
                {
                  label: 'Absent',
                  value: attendanceSummary.absent,
                  tone: 'danger',
                },
                { label: 'Leave', value: attendanceSummary.leave },
                {
                  label: 'Present Percentage',
                  value:
                    attendanceSummary.percentage == null
                      ? 'Not marked'
                      : `${attendanceSummary.percentage.toFixed(1)}%`,
                  tone: 'success',
                },
              ]}
            />
            <DataTable
              columns={attendanceColumns}
              emptyMessage={
                isAttendanceLoading
                  ? 'Loading attendance...'
                  : 'No attendance records found for this range.'
              }
              getRowKey={(record) => record.id}
              rows={filteredAttendance}
            />
            <footer className="report-document-footer">
              <span>{attendanceFilterDetails}</span>
              <strong>
                Present:{' '}
                {attendanceSummary.percentage == null
                  ? 'Not marked'
                  : `${attendanceSummary.percentage.toFixed(1)}%`}
              </strong>
            </footer>
          </section>
        </>
      )}

      {activeTab === 'fee-due' && (
        <>
          <section className="panel report-filters">
            <div className="report-filter-fields report-filter-fields--compact">
              <label className="form-field">
                <span>Class</span>
                <select
                  value={dueClass}
                  onChange={(event) => changeDueClass(event.target.value)}
                >
                  {activeClasses.length === 0 && (
                    <option value="">Create classes from Settings first</option>
                  )}
                  {activeClasses.map((item) => (
                    <option key={item.id} value={item.name}>
                      Class {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Section</span>
                <select
                  disabled={!dueClass || dueSections.length === 0}
                  value={dueSection}
                  onChange={(event) => setDueSection(event.target.value)}
                >
                  <option value="">All sections</option>
                  {dueSections.map((item) => (
                    <option key={item.id} value={item.name}>
                      Section {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="report-estimate-note">
              <Icon name="clock" size={15} />
              Basic due estimate based on configured fee structure and recorded
              payments.
            </p>
          </section>
          <div className="report-toolbar">
            <div>
              <strong>Fee Due Report</strong>
              <span>{dueFilterDetails}</span>
            </div>
            <ReportActions
              exportDisabled={dueRows.length === 0}
              onExport={exportDue}
              onPrint={printReport}
            />
          </div>
          <section className="panel report-print-area">
            <ReportDocumentHeader
              filters={dueFilterDetails}
              settings={settings}
              title="Fee Due Report"
            />
            <p className="report-print-note">
              Basic due estimate based on configured fee structure and recorded
              payments.
            </p>
            <ReportSummary
              metrics={[
                {
                  label: 'Students',
                  value: dueRows.length,
                  tone: 'primary',
                },
                {
                  label: 'Configured Total',
                  value: formatCurrency(dueTotals.configured),
                },
                {
                  label: 'Recorded Paid',
                  value: formatCurrency(dueTotals.paid),
                  tone: 'success',
                },
                {
                  label: 'Estimated Due',
                  value: formatCurrency(dueTotals.due),
                  tone: 'danger',
                },
              ]}
            />
            <DataTable
              columns={dueColumns}
              emptyMessage={
                isLoading
                  ? 'Loading fee records...'
                  : activeClasses.length === 0
                    ? 'Create classes from Settings first.'
                    : students.length === 0
                      ? 'Create students first.'
                      : 'No active students found for the selected class and section.'
              }
              getRowKey={(row) => row.student.id}
              rows={dueRows}
            />
            <footer className="report-document-footer">
              <span>{dueFilterDetails}</span>
              <strong>Estimated Due: {formatCurrency(dueTotals.due)}</strong>
            </footer>
          </section>
        </>
      )}

      {activeTab === 'report-cards' && (
        <StudentReportCards currentUser={currentUser} />
      )}

      {activeTab === 'parents-info' && <ParentsInfoReport />}
    </div>
  )
}
