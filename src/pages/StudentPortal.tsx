import { useEffect, useMemo, useState } from 'react'
import { DataTable, type TableColumn } from '../components/DataTable'
import { Icon } from '../components/Icon'
import { getErpApi, getErrorMessage } from '../lib/erpApi'
import type {
  AttendanceRecord,
  ClassTest,
  FeeInvoice,
  FeePayment,
  Homework,
  IssuedCertificate,
  MarkRecord,
  StudentPortalData,
  StudentReportCard,
  TimetableEntry,
} from '../types'

type StudentPortalTab =
  | 'profile'
  | 'attendance'
  | 'timetable'
  | 'homework'
  | 'tests'
  | 'results'
  | 'fees'
  | 'documents'

const tabs: { id: StudentPortalTab; label: string }[] = [
  { id: 'profile', label: 'My Profile' },
  { id: 'attendance', label: 'My Attendance' },
  { id: 'timetable', label: 'My Timetable' },
  { id: 'homework', label: 'My Homework' },
  { id: 'tests', label: 'My Class Tests' },
  { id: 'results', label: 'My Exams & Results' },
  { id: 'fees', label: 'My Fees' },
  { id: 'documents', label: 'My Documents' },
]

const formatAmount = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'INR',
  }).format(value)

const formatDate = (value: string) => value || '-'

const attendancePercentage = (records: AttendanceRecord[]) => {
  const working = records.filter((record) => record.status !== 'Leave').length
  if (!working) return null
  const present = records.filter((record) => record.status === 'Present').length
  return Math.round((present / working) * 100)
}

export function StudentPortal() {
  const [activeTab, setActiveTab] = useState<StudentPortalTab>('profile')
  const [data, setData] = useState<StudentPortalData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true
    Promise.resolve()
      .then(() => getErpApi().getCurrentStudentPortalData())
      .then((portalData) => {
        if (!isCurrent) return
        setData(portalData)
        setError('')
      })
      .catch((loadError) => {
        if (isCurrent) setError(getErrorMessage(loadError))
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => {
      isCurrent = false
    }
  }, [])

  const primaryGuardian = useMemo(
    () =>
      data?.guardians.find((guardian) => guardian.isPrimary) ??
      data?.guardians[0] ??
      null,
    [data],
  )

  const feeOutstanding = useMemo(
    () =>
      (data?.invoices ?? []).reduce(
        (total, invoice) => total + invoice.balanceAmount,
        0,
      ),
    [data],
  )

  if (isLoading) {
    return (
      <section className="panel document-empty-state">
        <span className="loading-spinner" />
        <h3>Loading student dashboard...</h3>
      </section>
    )
  }

  if (error || !data) {
    return (
      <section className="panel document-empty-state">
        <Icon name="lock" size={28} />
        <h3>Student dashboard is unavailable</h3>
        <p>{error || 'This account is not linked to an active student.'}</p>
      </section>
    )
  }

  const attendanceColumns: TableColumn<AttendanceRecord>[] = [
    { key: 'date', header: 'Date', render: (row) => formatDate(row.attendanceDate) },
    { key: 'status', header: 'Status', render: (row) => row.status },
    { key: 'remarks', header: 'Remarks', render: (row) => row.remarks || '-' },
  ]

  const timetableColumns: TableColumn<TimetableEntry>[] = [
    { key: 'day', header: 'Day', render: (row) => row.weekdayName },
    { key: 'period', header: 'Period', render: (row) => `${row.periodName} (${row.startTime}-${row.endTime})` },
    { key: 'subject', header: 'Subject', render: (row) => row.subjectName },
    { key: 'teacher', header: 'Teacher', render: (row) => row.teacherName || '-' },
    { key: 'room', header: 'Room', render: (row) => row.classroomName || '-' },
  ]

  const homeworkColumns: TableColumn<Homework>[] = [
    { key: 'date', header: 'Date', render: (row) => formatDate(row.homeworkDate) },
    { key: 'title', header: 'Homework', render: (row) => row.title },
    { key: 'subject', header: 'Subject', render: (row) => row.subjectName },
    { key: 'due', header: 'Due Date', render: (row) => formatDate(row.dueDate) },
    { key: 'teacher', header: 'Teacher', render: (row) => row.teacherName || '-' },
  ]

  const testColumns: TableColumn<ClassTest>[] = [
    { key: 'date', header: 'Date', render: (row) => formatDate(row.testDate) },
    { key: 'test', header: 'Test', render: (row) => row.testName },
    { key: 'subject', header: 'Subject', render: (row) => row.subjectName },
    { key: 'marks', header: 'Marks', render: (row) => row.maxMarks },
    { key: 'status', header: 'Status', render: (row) => row.status },
  ]

  const markColumns: TableColumn<MarkRecord>[] = [
    { key: 'exam', header: 'Exam', render: (row) => row.examName },
    { key: 'subject', header: 'Subject', render: (row) => row.subjectName },
    { key: 'marks', header: 'Marks', render: (row) => `${row.obtainedMarks}/${row.maxMarks}` },
    { key: 'passing', header: 'Passing', render: (row) => row.passingMarks },
    { key: 'remarks', header: 'Remarks', render: (row) => row.remarks || '-' },
  ]

  const reportCardColumns: TableColumn<StudentReportCard>[] = [
    { key: 'no', header: 'Report Card No', render: (row) => row.reportCardNo },
    { key: 'exam', header: 'Exam', render: (row) => row.examName },
    { key: 'percentage', header: 'Percentage', render: (row) => `${row.percentage}%` },
    { key: 'grade', header: 'Grade', render: (row) => row.overallGrade || '-' },
    { key: 'result', header: 'Result', render: (row) => row.resultStatus },
  ]

  const invoiceColumns: TableColumn<FeeInvoice>[] = [
    { key: 'invoice', header: 'Invoice', render: (row) => row.invoiceNo },
    { key: 'period', header: 'Billing Period', render: (row) => row.billingPeriod },
    { key: 'total', header: 'Total', render: (row) => formatAmount(row.grandTotal) },
    { key: 'paid', header: 'Paid', render: (row) => formatAmount(row.paidAmount) },
    { key: 'balance', header: 'Balance', render: (row) => formatAmount(row.balanceAmount) },
    { key: 'status', header: 'Status', render: (row) => row.status },
  ]

  const paymentColumns: TableColumn<FeePayment>[] = [
    { key: 'receipt', header: 'Receipt', render: (row) => row.receiptNo },
    { key: 'date', header: 'Date', render: (row) => formatDate(row.paymentDate) },
    { key: 'type', header: 'Fee Type', render: (row) => row.feeType },
    { key: 'amount', header: 'Amount', render: (row) => formatAmount(row.amount) },
    { key: 'mode', header: 'Mode', render: (row) => row.paymentMode },
  ]

  const certificateColumns: TableColumn<IssuedCertificate>[] = [
    { key: 'no', header: 'Certificate No', render: (row) => row.certificateNo },
    { key: 'type', header: 'Type', render: (row) => row.certificateType },
    { key: 'date', header: 'Issued Date', render: (row) => formatDate(row.issuedDate) },
    { key: 'by', header: 'Issued By', render: (row) => row.issuedBy || '-' },
  ]

  return (
    <div className="page-stack portal-page">
      <section className="page-header">
        <div>
          <h2>Student Dashboard</h2>
          <p>Read-only access for {data.student.name}.</p>
        </div>
      </section>

      <section className="portal-summary-grid">
        <div className="summary-card">
          <span>Class</span>
          <strong>
            {data.student.className}
            {data.student.section ? ` / ${data.student.section}` : ''}
          </strong>
        </div>
        <div className="summary-card">
          <span>Attendance</span>
          <strong>
            {attendancePercentage(data.attendance) === null
              ? '-'
              : `${attendancePercentage(data.attendance)}%`}
          </strong>
        </div>
        <div className="summary-card">
          <span>Outstanding Fees</span>
          <strong>{formatAmount(feeOutstanding)}</strong>
        </div>
        <div className="summary-card">
          <span>Report Cards</span>
          <strong>{data.reportCards.length}</strong>
        </div>
      </section>

      <nav className="settings-tabs" aria-label="Student dashboard sections">
        {tabs.map((tab) => (
          <button
            className={`settings-tab${
              activeTab === tab.id ? ' settings-tab--active' : ''
            }`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'profile' && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>My Profile</h3>
              <p>{data.student.admissionNo}</p>
            </div>
          </div>
          <div className="profile-detail-grid">
            <span>Name</span>
            <strong>{data.student.name}</strong>
            <span>Admission No</span>
            <strong>{data.student.admissionNo}</strong>
            <span>Class/Section</span>
            <strong>
              {data.student.className}
              {data.student.section ? ` / ${data.student.section}` : ''}
            </strong>
            <span>Guardian</span>
            <strong>{primaryGuardian?.guardianFullName || data.student.guardianName || '-'}</strong>
            <span>Emergency Contact</span>
            <strong>
              {primaryGuardian?.emergencyContactName ||
                data.student.guardianName ||
                '-'}{' '}
              {primaryGuardian?.emergencyContactMobile ||
                data.student.mobile ||
                ''}
            </strong>
            <span>Address</span>
            <strong>{primaryGuardian?.address || data.student.address || '-'}</strong>
          </div>
        </section>
      )}

      {activeTab === 'attendance' && (
        <section className="panel">
          <DataTable
            columns={attendanceColumns}
            emptyMessage="No attendance records found"
            getRowKey={(row) => row.id}
            rows={data.attendance}
          />
        </section>
      )}

      {activeTab === 'timetable' && (
        <section className="panel">
          <DataTable
            columns={timetableColumns}
            emptyMessage="No timetable entries found"
            getRowKey={(row) => row.id}
            rows={data.timetable}
          />
        </section>
      )}

      {activeTab === 'homework' && (
        <section className="panel">
          <DataTable
            columns={homeworkColumns}
            emptyMessage="No homework assigned"
            getRowKey={(row) => row.id}
            rows={data.homework}
          />
        </section>
      )}

      {activeTab === 'tests' && (
        <section className="panel">
          <DataTable
            columns={testColumns}
            emptyMessage="No class tests found"
            getRowKey={(row) => row.id}
            rows={data.classTests}
          />
        </section>
      )}

      {activeTab === 'results' && (
        <div className="page-stack">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Exam Marks</h3>
                <p>Marks are read-only snapshots from the school ERP.</p>
              </div>
            </div>
            <DataTable
              columns={markColumns}
              emptyMessage="No exam marks found"
              getRowKey={(row) => row.id}
              rows={data.marks}
            />
          </section>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Report Cards</h3>
                <p>Generated report card records for this student.</p>
              </div>
            </div>
            <DataTable
              columns={reportCardColumns}
              emptyMessage="No report cards generated"
              getRowKey={(row) => row.id}
              rows={data.reportCards}
            />
          </section>
        </div>
      )}

      {activeTab === 'fees' && (
        <div className="page-stack">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Invoices</h3>
                <p>Outstanding and historical fee invoices.</p>
              </div>
            </div>
            <DataTable
              columns={invoiceColumns}
              emptyMessage="No fee invoices found"
              getRowKey={(row) => row.id}
              rows={data.invoices}
            />
          </section>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Payment History</h3>
                <p>Receipts recorded by the school office.</p>
              </div>
            </div>
            <DataTable
              columns={paymentColumns}
              emptyMessage="No fee payments found"
              getRowKey={(row) => row.id}
              rows={data.feePayments}
            />
          </section>
        </div>
      )}

      {activeTab === 'documents' && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Certificates</h3>
              <p>ID cards and admission letters remain printable through the school office.</p>
            </div>
          </div>
          <DataTable
            columns={certificateColumns}
            emptyMessage="No issued certificates found"
            getRowKey={(row) => row.id}
            rows={data.certificates}
          />
        </section>
      )}
    </div>
  )
}
