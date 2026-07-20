import { useCallback, useEffect, useMemo, useState } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon, type IconName } from '../../components/Icon'
import { getAttendanceErpApi, getErpApi, getErrorMessage } from '../../lib/erpApi'
import {
  exportCsv,
  formatGeneratedAt,
  formatReportDate,
  formatReportMonth,
  getCurrentMonthValue,
  getTodayValue,
} from '../../lib/reportUtils'
import type {
  Employee,
  EmployeeAttendanceRecord,
  EmployeeAttendanceReport,
  EmployeeAttendanceStatus,
  EmployeeMonthlyAttendanceRow,
  SchoolSettings,
} from '../../types'

export type EmployeeAttendanceTab = 'entry' | 'daily' | 'monthly' | 'register'

interface EmployeeAttendanceProps {
  canManage: boolean
  canViewReports: boolean
  initialTab?: EmployeeAttendanceTab
}

interface AttendanceDraft {
  recordId?: string
  status: EmployeeAttendanceStatus
  checkInTime: string
  checkOutTime: string
  lateMinutes: string
  overtimeMinutes: string
  leaveType: string
  remarks: string
}

const statuses: EmployeeAttendanceStatus[] = [
  'Present',
  'Absent',
  'Leave',
  'Half Day',
  'Late',
  'Holiday',
]

const tabItems: Array<{
  id: EmployeeAttendanceTab
  label: string
  icon: IconName
}> = [
  { id: 'entry', label: 'Employees Attendance', icon: 'attendance' },
  { id: 'daily', label: 'Daily Report', icon: 'reports' },
  { id: 'monthly', label: 'Monthly Report', icon: 'calendar' },
  { id: 'register', label: 'Register', icon: 'dashboard' },
]

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

const emptyReport: EmployeeAttendanceReport = {
  rows: [],
  monthlyRows: [],
  summary: {
    startDate: '',
    endDate: '',
    month: '',
    totalEmployees: 0,
    totalMarked: 0,
    present: 0,
    absent: 0,
    leave: 0,
    halfDay: 0,
    late: 0,
    holiday: 0,
    overtimeMinutes: 0,
    attendancePercentage: null,
  },
}

const statusClassName = (status: string) =>
  status.toLowerCase().replaceAll(' ', '-')

const departmentsFromEmployees = (employees: Employee[]) =>
  [
    ...new Set(
      employees
        .filter((employee) => employee.status === 'Active')
        .map((employee) => employee.department)
        .filter(Boolean),
    ),
  ].sort((left, right) => left.localeCompare(right))

const designationsFromEmployees = (employees: Employee[], department = 'All') =>
  [
    ...new Set(
      employees
        .filter(
          (employee) =>
            employee.status === 'Active' &&
            (department === 'All' || employee.department === department),
        )
        .map((employee) => employee.designation)
        .filter(Boolean),
    ),
  ].sort((left, right) => left.localeCompare(right))

const filterEmployees = (
  employees: Employee[],
  department: string,
  designation: string,
) =>
  employees.filter(
    (employee) =>
      employee.status === 'Active' &&
      (department === 'All' || employee.department === department) &&
      (designation === 'All' || employee.designation === designation),
  )

const buildDrafts = (
  employees: Employee[],
  records: EmployeeAttendanceRecord[],
): Record<string, AttendanceDraft> =>
  Object.fromEntries(
    employees.map((employee) => {
      const record = records.find((item) => item.employeeId === employee.id)
      return [
        employee.id,
        {
          recordId: record?.id,
          status: record?.status ?? 'Present',
          checkInTime: record?.checkInTime ?? '',
          checkOutTime: record?.checkOutTime ?? '',
          lateMinutes: String(record?.lateMinutes ?? 0),
          overtimeMinutes: String(record?.overtimeMinutes ?? 0),
          leaveType: record?.leaveType ?? '',
          remarks: record?.remarks ?? '',
        },
      ]
    }),
  )

const percentageText = (value: number | null) =>
  value == null ? '-' : `${value.toFixed(1)}%`

function ReportHeader({
  settings,
  title,
  subtitle,
}: {
  settings: SchoolSettings
  title: string
  subtitle: string
}) {
  return (
    <header className="employee-attendance-report-header">
      <div>
        <span className="salary-report-mark">
          <Icon name="school" size={22} />
        </span>
        <div>
          <h2>{settings.schoolName}</h2>
          <p>{settings.address}</p>
        </div>
      </div>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <span>Generated {formatGeneratedAt()}</span>
      </div>
    </header>
  )
}

export function EmployeeAttendance({
  canManage,
  canViewReports,
  initialTab = 'entry',
}: EmployeeAttendanceProps) {
  const safeInitialTab = !canManage && initialTab === 'entry' ? 'daily' : initialTab
  const [activeTab, setActiveTab] = useState<EmployeeAttendanceTab>(safeInitialTab)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [settings, setSettings] = useState<SchoolSettings>(fallbackSettings)
  const [entryDate, setEntryDate] = useState(getTodayValue)
  const [entryDepartment, setEntryDepartment] = useState('All')
  const [entryDesignation, setEntryDesignation] = useState('All')
  const [drafts, setDrafts] = useState<Record<string, AttendanceDraft>>({})
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [dailyDate, setDailyDate] = useState(getTodayValue)
  const [dailyDepartment, setDailyDepartment] = useState('All')
  const [dailyDesignation, setDailyDesignation] = useState('All')
  const [dailyReport, setDailyReport] = useState<EmployeeAttendanceReport>(emptyReport)
  const [monthlyMonth, setMonthlyMonth] = useState(getCurrentMonthValue)
  const [monthlyDepartment, setMonthlyDepartment] = useState('All')
  const [monthlyEmployeeId, setMonthlyEmployeeId] = useState('')
  const [monthlyReport, setMonthlyReport] = useState<EmployeeAttendanceReport>(emptyReport)
  const [registerStart, setRegisterStart] = useState(getTodayValue)
  const [registerEnd, setRegisterEnd] = useState(getTodayValue)
  const [registerDepartment, setRegisterDepartment] = useState('All')
  const [registerStatus, setRegisterStatus] = useState<EmployeeAttendanceStatus | 'All'>('All')
  const [registerEmployeeId, setRegisterEmployeeId] = useState('')
  const [registerReport, setRegisterReport] = useState<EmployeeAttendanceReport>(emptyReport)
  const [isLoading, setIsLoading] = useState(true)
  const [isEntryLoading, setIsEntryLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === 'Active'),
    [employees],
  )
  const departments = useMemo(() => departmentsFromEmployees(employees), [employees])
  const entryDesignations = useMemo(
    () => designationsFromEmployees(employees, entryDepartment),
    [employees, entryDepartment],
  )
  const dailyDesignations = useMemo(
    () => designationsFromEmployees(employees, dailyDepartment),
    [employees, dailyDepartment],
  )
  const entryEmployees = useMemo(
    () => filterEmployees(employees, entryDepartment, entryDesignation),
    [employees, entryDepartment, entryDesignation],
  )

  const loadEntryRecords = useCallback(
    async (
      date: string,
      department: string,
      designation: string,
      employeeRows: Employee[],
    ) => {
      if (!canManage) return
      setIsEntryLoading(true)
      try {
        const rows = await getAttendanceErpApi().getEmployeeAttendanceByDate(
          date,
          {
            department,
            designation,
          },
        )
        setDrafts(
          buildDrafts(
            filterEmployees(employeeRows, department, designation),
            rows,
          ),
        )
        setSelectedIds([])
        setError('')
      } catch (loadError) {
        setError(getErrorMessage(loadError))
      } finally {
        setIsEntryLoading(false)
      }
    },
    [canManage],
  )

  useEffect(() => {
    let isCurrent = true
    Promise.resolve()
      .then(() =>
        Promise.all([
          getErpApi().getEmployees(),
          getErpApi().getSchoolSettings(),
        ]),
      )
      .then(([employeeRows, schoolSettings]) => {
        if (!isCurrent) return
        setEmployees(employeeRows)
        setSettings(schoolSettings)
        void loadEntryRecords(
          entryDate,
          entryDepartment,
          entryDesignation,
          employeeRows,
        )
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setError(getErrorMessage(loadError))
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => {
      isCurrent = false
    }
  }, [entryDate, entryDepartment, entryDesignation, loadEntryRecords])

  const updateDraft = (employeeId: string, patch: Partial<AttendanceDraft>) => {
    setDrafts((current) => ({
      ...current,
      [employeeId]: {
        ...current[employeeId],
        status: current[employeeId]?.status ?? 'Present',
        checkInTime: current[employeeId]?.checkInTime ?? '',
        checkOutTime: current[employeeId]?.checkOutTime ?? '',
        lateMinutes: current[employeeId]?.lateMinutes ?? '0',
        overtimeMinutes: current[employeeId]?.overtimeMinutes ?? '0',
        leaveType: current[employeeId]?.leaveType ?? '',
        remarks: current[employeeId]?.remarks ?? '',
        ...patch,
      },
    }))
  }

  const markEmployees = (employeeIds: string[], status: EmployeeAttendanceStatus) => {
    setDrafts((current) => ({
      ...current,
      ...Object.fromEntries(
        employeeIds.map((employeeId) => [
          employeeId,
          {
            ...current[employeeId],
            status,
            checkInTime: current[employeeId]?.checkInTime ?? '',
            checkOutTime: current[employeeId]?.checkOutTime ?? '',
            lateMinutes: current[employeeId]?.lateMinutes ?? '0',
            overtimeMinutes: current[employeeId]?.overtimeMinutes ?? '0',
            leaveType: status === 'Leave' ? current[employeeId]?.leaveType ?? 'Casual Leave' : current[employeeId]?.leaveType ?? '',
            remarks: current[employeeId]?.remarks ?? '',
          },
        ]),
      ),
    }))
    setMessage('')
  }

  const saveAttendance = async () => {
    if (!canManage) return
    if (entryEmployees.length === 0) {
      setError('No active employees found for the selected filters.')
      return
    }
    setIsSaving(true)
    try {
      const saved = await getAttendanceErpApi().saveEmployeeAttendanceBulk(
        entryEmployees.map((employee) => {
          const draft = drafts[employee.id]
          return {
            employeeId: employee.id,
            attendanceDate: entryDate,
            status: draft?.status ?? 'Present',
            checkInTime: draft?.checkInTime ?? '',
            checkOutTime: draft?.checkOutTime ?? '',
            lateMinutes: Number(draft?.lateMinutes ?? 0),
            overtimeMinutes: Number(draft?.overtimeMinutes ?? 0),
            leaveType: draft?.leaveType ?? '',
            remarks: draft?.remarks ?? '',
          }
        }),
      )
      setDrafts(buildDrafts(entryEmployees, saved))
      setSelectedIds([])
      setMessage(`Saved attendance for ${saved.length} employee(s).`)
      setError('')
    } catch (saveError) {
      setError(getErrorMessage(saveError))
      setMessage('')
    } finally {
      setIsSaving(false)
    }
  }

  const loadDailyReport = async () => {
    try {
      const report = await getAttendanceErpApi().getEmployeeAttendanceReport({
        date: dailyDate,
        department: dailyDepartment,
        designation: dailyDesignation,
      })
      setDailyReport(report)
      setMessage('Daily attendance report generated.')
      setError('')
    } catch (reportError) {
      setError(getErrorMessage(reportError))
      setMessage('')
    }
  }

  const loadMonthlyReport = async () => {
    try {
      const report = await getAttendanceErpApi().getEmployeeAttendanceReport({
        month: monthlyMonth,
        department: monthlyDepartment,
        employeeId: monthlyEmployeeId || undefined,
      })
      setMonthlyReport(report)
      setMessage('Monthly attendance report generated.')
      setError('')
    } catch (reportError) {
      setError(getErrorMessage(reportError))
      setMessage('')
    }
  }

  const loadRegisterReport = async () => {
    try {
      const report = await getAttendanceErpApi().getEmployeeAttendanceReport({
        startDate: registerStart,
        endDate: registerEnd,
        department: registerDepartment,
        employeeId: registerEmployeeId || undefined,
        status: registerStatus,
      })
      setRegisterReport(report)
      setMessage('Employee attendance register generated.')
      setError('')
    } catch (reportError) {
      setError(getErrorMessage(reportError))
      setMessage('')
    }
  }

  const exportDaily = () => {
    exportCsv(
      'employee-daily-attendance.csv',
      [
        'Date',
        'Employee Code',
        'Employee Name',
        'Department',
        'Designation',
        'Status',
        'Check In',
        'Check Out',
        'Late Minutes',
        'Overtime Minutes',
        'Leave Type',
        'Remarks',
      ],
      dailyReport.rows.map((row) => [
        row.attendanceDate,
        row.employeeCode,
        row.employeeName,
        row.department,
        row.designation,
        row.status,
        row.checkInTime,
        row.checkOutTime,
        row.lateMinutes,
        row.overtimeMinutes,
        row.leaveType,
        row.remarks,
      ]),
    )
  }

  const exportMonthly = () => {
    exportCsv(
      'employee-monthly-attendance.csv',
      [
        'Employee Code',
        'Employee Name',
        'Department',
        'Designation',
        'Working Days',
        'Present',
        'Absent',
        'Leave',
        'Half Days',
        'Late Days',
        'Holidays',
        'Overtime Minutes',
        'Attendance Percentage',
      ],
      monthlyReport.monthlyRows.map((row) => [
        row.employeeCode,
        row.employeeName,
        row.department,
        row.designation,
        row.workingDays,
        row.present,
        row.absent,
        row.leave,
        row.halfDays,
        row.lateDays,
        row.holidays,
        row.overtimeMinutes,
        row.attendancePercentage ?? '',
      ]),
    )
  }

  const exportRegister = () => {
    exportCsv(
      'employee-attendance-register.csv',
      [
        'Date',
        'Employee Code',
        'Employee Name',
        'Department',
        'Designation',
        'Status',
        'Check In',
        'Check Out',
        'Late Minutes',
        'Overtime Minutes',
        'Leave Type',
        'Remarks',
      ],
      registerReport.rows.map((row) => [
        row.attendanceDate,
        row.employeeCode,
        row.employeeName,
        row.department,
        row.designation,
        row.status,
        row.checkInTime,
        row.checkOutTime,
        row.lateMinutes,
        row.overtimeMinutes,
        row.leaveType,
        row.remarks,
      ]),
    )
  }

  const employeeColumns: TableColumn<EmployeeAttendanceRecord>[] = [
    { key: 'date', header: 'Date', render: (row) => formatReportDate(row.attendanceDate) },
    { key: 'code', header: 'Employee Code', render: (row) => row.employeeCode || '-' },
    {
      key: 'employee',
      header: 'Employee',
      render: (row) => (
        <div className="primary-cell">
          <strong>{row.employeeName}</strong>
          <span>{row.designation || 'Staff'} - {row.department || 'No department'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className={`status-badge status-badge--${statusClassName(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    { key: 'in', header: 'Check In', render: (row) => row.checkInTime || '-' },
    { key: 'out', header: 'Check Out', render: (row) => row.checkOutTime || '-' },
    { key: 'late', header: 'Late', className: 'align-right', render: (row) => row.lateMinutes },
    { key: 'ot', header: 'Overtime', className: 'align-right', render: (row) => row.overtimeMinutes },
    { key: 'remarks', header: 'Remarks', render: (row) => row.remarks || '-' },
  ]

  const monthlyColumns: TableColumn<EmployeeMonthlyAttendanceRow>[] = [
    { key: 'code', header: 'Employee Code', render: (row) => row.employeeCode || '-' },
    {
      key: 'employee',
      header: 'Employee',
      render: (row) => (
        <div className="primary-cell">
          <strong>{row.employeeName}</strong>
          <span>{row.designation || 'Staff'} - {row.department || 'No department'}</span>
        </div>
      ),
    },
    { key: 'working', header: 'Working Days', className: 'align-right', render: (row) => row.workingDays },
    { key: 'present', header: 'Present', className: 'align-right', render: (row) => row.present },
    { key: 'absent', header: 'Absent', className: 'align-right', render: (row) => row.absent },
    { key: 'leave', header: 'Leave', className: 'align-right', render: (row) => row.leave },
    { key: 'half', header: 'Half Days', className: 'align-right', render: (row) => row.halfDays },
    { key: 'late', header: 'Late Days', className: 'align-right', render: (row) => row.lateDays },
    { key: 'holiday', header: 'Holidays', className: 'align-right', render: (row) => row.holidays },
    { key: 'overtime', header: 'Overtime', className: 'align-right', render: (row) => row.overtimeMinutes },
    { key: 'percentage', header: 'Attendance %', className: 'align-right', render: (row) => percentageText(row.attendancePercentage) },
  ]

  const canUseTab = (tab: EmployeeAttendanceTab) =>
    tab === 'entry' ? canManage : canViewReports

  if (!canManage && !canViewReports) {
    return (
      <section className="panel document-empty-state">
        <Icon name="lock" size={24} />
        <h3>Employee attendance is not available for your role.</h3>
      </section>
    )
  }

  return (
    <div className="page-stack employee-attendance-page">
      <section className="page-header">
        <div>
          <h2>Employee Attendance</h2>
          <p>Mark staff attendance and review daily or monthly reports.</p>
        </div>
        {activeTab === 'entry' && canManage && (
          <button
            className="primary-button"
            disabled={entryEmployees.length === 0 || isSaving}
            onClick={() => void saveAttendance()}
            type="button"
          >
            <Icon name="check" size={18} />
            {isSaving ? 'Saving...' : 'Save Attendance'}
          </button>
        )}
      </section>

      <nav className="settings-tabs" aria-label="Employee attendance sections">
        {tabItems
          .filter((tab) => canUseTab(tab.id))
          .map((tab) => (
            <button
              className={`settings-tab${activeTab === tab.id ? ' settings-tab--active' : ''}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <Icon name={tab.icon} size={17} />
              {tab.label}
            </button>
          ))}
      </nav>

      {message && (
        <div className="inline-message">
          <Icon name="check" size={17} />
          <span>{message}</span>
          <button type="button" onClick={() => setMessage('')} aria-label="Dismiss message">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="inline-message inline-message--error">
          <Icon name="close" size={17} />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      {activeTab === 'entry' && canManage && (
        <>
          <section className="panel filter-panel employee-attendance-filters">
            <div className="filter-group">
              <label className="form-field form-field--date">
                <span>Date</span>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(event) => setEntryDate(event.target.value)}
                />
              </label>
              <label className="form-field form-field--compact">
                <span>Department</span>
                <select
                  value={entryDepartment}
                  onChange={(event) => {
                    setEntryDepartment(event.target.value)
                    setEntryDesignation('All')
                  }}
                >
                  <option>All</option>
                  {departments.map((department) => (
                    <option key={department}>{department}</option>
                  ))}
                </select>
              </label>
              <label className="form-field form-field--compact">
                <span>Designation</span>
                <select
                  value={entryDesignation}
                  onChange={(event) => setEntryDesignation(event.target.value)}
                >
                  <option>All</option>
                  {entryDesignations.map((designation) => (
                    <option key={designation}>{designation}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="attendance-actions">
              <button
                className="secondary-button secondary-button--small"
                disabled={entryEmployees.length === 0}
                onClick={() => markEmployees(entryEmployees.map((employee) => employee.id), 'Present')}
                type="button"
              >
                Mark All Present
              </button>
              <button
                className="secondary-button secondary-button--small"
                disabled={selectedIds.length === 0}
                onClick={() => markEmployees(selectedIds, 'Absent')}
                type="button"
              >
                Mark Selected Absent
              </button>
              <button
                className="secondary-button secondary-button--small"
                disabled={selectedIds.length === 0}
                onClick={() => markEmployees(selectedIds, 'Leave')}
                type="button"
              >
                Mark Selected Leave
              </button>
            </div>
          </section>

          <section className="panel attendance-panel">
            <div className="panel-heading attendance-heading">
              <div>
                <h3>Employee Register</h3>
                <p>{entryEmployees.length} employee(s) - {formatReportDate(entryDate)}</p>
              </div>
            </div>
            <div className="table-scroll">
              <table className="data-table employee-attendance-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Employee Code</th>
                    <th>Employee Name</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Late</th>
                    <th>Overtime</th>
                    <th>Leave Type</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {entryEmployees.length > 0 ? (
                    entryEmployees.map((employee) => {
                      const draft = drafts[employee.id] ?? {
                        status: 'Present',
                        checkInTime: '',
                        checkOutTime: '',
                        lateMinutes: '0',
                        overtimeMinutes: '0',
                        leaveType: '',
                        remarks: '',
                      }
                      const selected = selectedIds.includes(employee.id)
                      return (
                        <tr key={employee.id}>
                          <td>
                            <input
                              checked={selected}
                              type="checkbox"
                              onChange={(event) =>
                                setSelectedIds((current) =>
                                  event.target.checked
                                    ? [...current, employee.id]
                                    : current.filter((id) => id !== employee.id),
                                )
                              }
                            />
                          </td>
                          <td><strong className="table-primary">{employee.employeeNo}</strong></td>
                          <td>{employee.name}</td>
                          <td>{employee.department || '-'}</td>
                          <td>{employee.designation || '-'}</td>
                          <td>
                            <select
                              value={draft.status}
                              onChange={(event) =>
                                updateDraft(employee.id, {
                                  status: event.target.value as EmployeeAttendanceStatus,
                                })
                              }
                            >
                              {statuses.map((status) => (
                                <option key={status}>{status}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="time"
                              value={draft.checkInTime}
                              onChange={(event) =>
                                updateDraft(employee.id, { checkInTime: event.target.value })
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="time"
                              value={draft.checkOutTime}
                              onChange={(event) =>
                                updateDraft(employee.id, { checkOutTime: event.target.value })
                              }
                            />
                          </td>
                          <td>
                            <input
                              min="0"
                              step="1"
                              type="number"
                              value={draft.lateMinutes}
                              onChange={(event) =>
                                updateDraft(employee.id, { lateMinutes: event.target.value })
                              }
                            />
                          </td>
                          <td>
                            <input
                              min="0"
                              step="1"
                              type="number"
                              value={draft.overtimeMinutes}
                              onChange={(event) =>
                                updateDraft(employee.id, { overtimeMinutes: event.target.value })
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={draft.leaveType}
                              onChange={(event) =>
                                updateDraft(employee.id, { leaveType: event.target.value })
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={draft.remarks}
                              onChange={(event) =>
                                updateDraft(employee.id, { remarks: event.target.value })
                              }
                            />
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td className="empty-table" colSpan={12}>
                        {isLoading || isEntryLoading
                          ? 'Loading employee attendance...'
                          : 'No active employees found for the selected filters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {activeTab === 'daily' && canViewReports && (
        <>
          <section className="panel report-filter-card">
            <div className="report-filter-fields report-filter-fields--attendance">
              <label className="form-field">
                <span>Date</span>
                <input type="date" value={dailyDate} onChange={(event) => setDailyDate(event.target.value)} />
              </label>
              <label className="form-field">
                <span>Department</span>
                <select
                  value={dailyDepartment}
                  onChange={(event) => {
                    setDailyDepartment(event.target.value)
                    setDailyDesignation('All')
                  }}
                >
                  <option>All</option>
                  {departments.map((department) => (
                    <option key={department}>{department}</option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Designation</span>
                <select value={dailyDesignation} onChange={(event) => setDailyDesignation(event.target.value)}>
                  <option>All</option>
                  {dailyDesignations.map((designation) => (
                    <option key={designation}>{designation}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="report-actions-row">
              <button className="primary-button" onClick={() => void loadDailyReport()} type="button">
                <Icon name="reports" size={17} />
                Generate
              </button>
              <button className="secondary-button" onClick={exportDaily} type="button">
                <Icon name="download" size={17} />
                CSV
              </button>
              <button className="secondary-button" onClick={() => window.setTimeout(() => window.print(), 50)} type="button">
                <Icon name="print" size={17} />
                Print
              </button>
            </div>
          </section>
          <section className="panel report-print-area employee-attendance-print-area">
            <ReportHeader settings={settings} title="Daily Employee Attendance" subtitle={formatReportDate(dailyDate)} />
            <div className="invoice-summary-grid">
              <div><span>Total Employees</span><strong>{dailyReport.summary.totalEmployees}</strong></div>
              <div><span>Present</span><strong>{dailyReport.summary.present}</strong></div>
              <div><span>Absent</span><strong>{dailyReport.summary.absent}</strong></div>
              <div><span>Leave</span><strong>{dailyReport.summary.leave}</strong></div>
              <div><span>Half Day</span><strong>{dailyReport.summary.halfDay}</strong></div>
              <div><span>Late</span><strong>{dailyReport.summary.late}</strong></div>
            </div>
            <DataTable
              columns={employeeColumns}
              emptyMessage="Generate a daily report to view records."
              getRowKey={(row) => row.id}
              rows={dailyReport.rows}
            />
          </section>
        </>
      )}

      {activeTab === 'monthly' && canViewReports && (
        <>
          <section className="panel report-filter-card">
            <div className="report-filter-fields report-filter-fields--attendance">
              <label className="form-field">
                <span>Month</span>
                <input type="month" value={monthlyMonth} onChange={(event) => setMonthlyMonth(event.target.value)} />
              </label>
              <label className="form-field">
                <span>Department</span>
                <select value={monthlyDepartment} onChange={(event) => setMonthlyDepartment(event.target.value)}>
                  <option>All</option>
                  {departments.map((department) => (
                    <option key={department}>{department}</option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Employee</span>
                <select value={monthlyEmployeeId} onChange={(event) => setMonthlyEmployeeId(event.target.value)}>
                  <option value="">All employees</option>
                  {activeEmployees
                    .filter((employee) => monthlyDepartment === 'All' || employee.department === monthlyDepartment)
                    .map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.employeeNo})
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <div className="report-actions-row">
              <button className="primary-button" onClick={() => void loadMonthlyReport()} type="button">
                <Icon name="reports" size={17} />
                Generate
              </button>
              <button className="secondary-button" onClick={exportMonthly} type="button">
                <Icon name="download" size={17} />
                CSV
              </button>
              <button className="secondary-button" onClick={() => window.setTimeout(() => window.print(), 50)} type="button">
                <Icon name="print" size={17} />
                Print
              </button>
            </div>
          </section>
          <section className="panel report-print-area employee-attendance-print-area">
            <ReportHeader settings={settings} title="Monthly Employee Attendance" subtitle={formatReportMonth(monthlyMonth)} />
            <DataTable
              columns={monthlyColumns}
              emptyMessage="Generate a monthly report to view records."
              getRowKey={(row) => row.employeeId}
              rows={monthlyReport.monthlyRows}
            />
          </section>
        </>
      )}

      {activeTab === 'register' && canViewReports && (
        <>
          <section className="panel report-filter-card">
            <div className="report-filter-fields report-filter-fields--attendance">
              <label className="form-field">
                <span>From</span>
                <input type="date" value={registerStart} onChange={(event) => setRegisterStart(event.target.value)} />
              </label>
              <label className="form-field">
                <span>To</span>
                <input type="date" value={registerEnd} onChange={(event) => setRegisterEnd(event.target.value)} />
              </label>
              <label className="form-field">
                <span>Department</span>
                <select value={registerDepartment} onChange={(event) => setRegisterDepartment(event.target.value)}>
                  <option>All</option>
                  {departments.map((department) => (
                    <option key={department}>{department}</option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Employee</span>
                <select value={registerEmployeeId} onChange={(event) => setRegisterEmployeeId(event.target.value)}>
                  <option value="">All employees</option>
                  {activeEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} ({employee.employeeNo})
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Status</span>
                <select value={registerStatus} onChange={(event) => setRegisterStatus(event.target.value as EmployeeAttendanceStatus | 'All')}>
                  <option>All</option>
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="report-actions-row">
              <button className="primary-button" onClick={() => void loadRegisterReport()} type="button">
                <Icon name="reports" size={17} />
                Generate
              </button>
              <button className="secondary-button" onClick={exportRegister} type="button">
                <Icon name="download" size={17} />
                CSV
              </button>
              <button className="secondary-button" onClick={() => window.setTimeout(() => window.print(), 50)} type="button">
                <Icon name="print" size={17} />
                Print
              </button>
            </div>
          </section>
          <section className="panel report-print-area employee-attendance-print-area">
            <ReportHeader
              settings={settings}
              title="Employee Attendance Register"
              subtitle={`${formatReportDate(registerStart)} to ${formatReportDate(registerEnd)}`}
            />
            <DataTable
              columns={employeeColumns}
              emptyMessage="Generate a register to view records."
              getRowKey={(row) => row.id}
              rows={registerReport.rows}
            />
          </section>
        </>
      )}
    </div>
  )
}
