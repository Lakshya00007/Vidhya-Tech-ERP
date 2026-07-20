import { useEffect, useState } from 'react'
import { DataTable, type TableColumn } from '../components/DataTable'
import { Icon } from '../components/Icon'
import { getErpApi, getErrorMessage } from '../lib/erpApi'
import type {
  EmployeeAttendanceRecord,
  EmployeePortalData,
  SalaryPayment,
  TimetableEntry,
} from '../types'

interface EmployeePortalProps {
  onOpenMessages?: () => void
}

type EmployeePortalTab = 'profile' | 'attendance' | 'salary' | 'timetable'

const tabs: { id: EmployeePortalTab; label: string }[] = [
  { id: 'profile', label: 'My Profile' },
  { id: 'attendance', label: 'My Attendance' },
  { id: 'salary', label: 'My Salary' },
  { id: 'timetable', label: 'My Timetable' },
]

const formatAmount = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'INR',
  }).format(value)

const formatDate = (value: string) => value || '-'

export function EmployeePortal({ onOpenMessages }: EmployeePortalProps) {
  const [activeTab, setActiveTab] = useState<EmployeePortalTab>('profile')
  const [data, setData] = useState<EmployeePortalData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true
    Promise.resolve()
      .then(() => getErpApi().getCurrentEmployeePortalData())
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

  if (isLoading) {
    return (
      <section className="panel document-empty-state">
        <span className="loading-spinner" />
        <h3>Loading employee workspace...</h3>
      </section>
    )
  }

  if (error || !data) {
    return (
      <section className="panel document-empty-state">
        <Icon name="lock" size={28} />
        <h3>Employee workspace is unavailable</h3>
        <p>{error || 'This account is not linked to an active employee.'}</p>
      </section>
    )
  }

  const attendanceColumns: TableColumn<EmployeeAttendanceRecord>[] = [
    { key: 'date', header: 'Date', render: (row) => formatDate(row.attendanceDate) },
    { key: 'status', header: 'Status', render: (row) => row.status },
    { key: 'check-in', header: 'Check In', render: (row) => row.checkInTime || '-' },
    { key: 'check-out', header: 'Check Out', render: (row) => row.checkOutTime || '-' },
    { key: 'late', header: 'Late', render: (row) => row.lateMinutes },
    { key: 'overtime', header: 'Overtime', render: (row) => row.overtimeMinutes },
    { key: 'remarks', header: 'Remarks', render: (row) => row.remarks || '-' },
  ]

  const salaryColumns: TableColumn<SalaryPayment>[] = [
    { key: 'salary-no', header: 'Salary No', render: (row) => row.salaryNo },
    { key: 'month', header: 'Month', render: (row) => row.salaryMonth },
    { key: 'base', header: 'Base', render: (row) => formatAmount(row.baseSalary) },
    { key: 'allowances', header: 'Allowances', render: (row) => formatAmount(row.allowances) },
    { key: 'deductions', header: 'Deductions', render: (row) => formatAmount(row.deductions) },
    { key: 'net', header: 'Net Salary', render: (row) => formatAmount(row.netSalary) },
    { key: 'date', header: 'Paid On', render: (row) => formatDate(row.paymentDate) },
  ]

  const timetableColumns: TableColumn<TimetableEntry>[] = [
    { key: 'day', header: 'Day', render: (row) => row.weekdayName },
    { key: 'period', header: 'Period', render: (row) => `${row.periodName} (${row.startTime}-${row.endTime})` },
    { key: 'class', header: 'Class', render: (row) => `${row.className}${row.section ? ` / ${row.section}` : ''}` },
    { key: 'subject', header: 'Subject', render: (row) => row.subjectName },
    { key: 'room', header: 'Room', render: (row) => row.classroomName || '-' },
  ]

  return (
    <div className="page-stack portal-page">
      <section className="page-header">
        <div>
          <h2>My Workspace</h2>
          <p>Read-only personal records for {data.employee.name}.</p>
        </div>
      </section>

      <section className="portal-summary-grid">
        <div className="summary-card">
          <span>Employee Code</span>
          <strong>{data.employee.employeeNo}</strong>
        </div>
        <div className="summary-card">
          <span>Department</span>
          <strong>{data.employee.department || '-'}</strong>
        </div>
        <div className="summary-card">
          <span>Attendance Records</span>
          <strong>{data.attendance.length}</strong>
        </div>
        <div className="summary-card">
          <span>Salary Slips</span>
          <strong>{data.salaryPayments.length}</strong>
        </div>
        <button className="summary-card summary-card--button" onClick={onOpenMessages} type="button">
          <span>Unread Messages</span>
          <strong>{data.unreadMessageCount}</strong>
        </button>
      </section>

      <section className="panel portal-notices-panel">
        <div className="panel-heading">
          <div>
            <h3>Staff Notices & Messages</h3>
            <p>Latest local notices and direct inbox items for this account.</p>
          </div>
          <button className="secondary-button" onClick={onOpenMessages} type="button">
            Open Inbox
          </button>
        </div>
        {data.announcements.length > 0 ? (
          <div className="portal-notice-list">
            {data.announcements.slice(0, 3).map((notice) => (
              <article key={notice.id}>
                <strong>{notice.subject}</strong>
                <span>{notice.threadType} · {formatDate(notice.lastMessageAt)}</span>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-copy">No local notices found.</p>
        )}
      </section>

      <nav className="settings-tabs" aria-label="Employee workspace sections">
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
              <p>{data.employee.employeeNo}</p>
            </div>
          </div>
          <div className="profile-detail-grid">
            <span>Name</span>
            <strong>{data.employee.name}</strong>
            <span>Department</span>
            <strong>{data.employee.department || '-'}</strong>
            <span>Designation</span>
            <strong>{data.employee.designation || '-'}</strong>
            <span>Joining Date</span>
            <strong>{formatDate(data.employee.joiningDate)}</strong>
            <span>Mobile</span>
            <strong>{data.employee.mobile || '-'}</strong>
            <span>Email</span>
            <strong>{data.employee.email || '-'}</strong>
            <span>Address</span>
            <strong>{data.employee.address || '-'}</strong>
          </div>
        </section>
      )}

      {activeTab === 'attendance' && (
        <section className="panel">
          <DataTable
            columns={attendanceColumns}
            emptyMessage="No employee attendance found"
            getRowKey={(row) => row.id}
            rows={data.attendance}
          />
        </section>
      )}

      {activeTab === 'salary' && (
        <section className="panel">
          <DataTable
            columns={salaryColumns}
            emptyMessage="No salary payments found"
            getRowKey={(row) => row.id}
            rows={data.salaryPayments}
          />
        </section>
      )}

      {activeTab === 'timetable' && (
        <section className="panel">
          <DataTable
            columns={timetableColumns}
            emptyMessage="No teacher timetable entries found"
            getRowKey={(row) => row.id}
            rows={data.timetable}
          />
        </section>
      )}
    </div>
  )
}
