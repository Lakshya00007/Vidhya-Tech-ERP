import type { AuthUser, LicenseStatus, PageId } from '../types'
import { APP_VERSION } from '../lib/appInfo'
import { licenseStatusLabels } from '../lib/license'

interface TopbarProps {
  activePage: PageId
  activeTitle?: string
  currentUser: AuthUser
  licenseStatus: LicenseStatus
  onLogout: () => void
}

const pageTitles: Record<PageId, string> = {
  dashboard: 'Dashboard',
  students: 'Student Management',
  fees: 'Fee Collection',
  attendance: 'Attendance',
  exams: 'Examinations',
  reports: 'Reports',
  settings: 'Settings',
  documents: 'Student Documents',
  employees: 'Employee Management',
  salary: 'Salary & Payroll',
  accounts: 'Accounts',
  timetable: 'Timetable',
  homework: 'Homework',
  'class-tests': 'Class Tests',
  'question-paper': 'Question Paper',
  placeholder: 'Advanced Module',
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export function Topbar({
  activePage,
  activeTitle,
  currentUser,
  licenseStatus,
  onLogout,
}: TopbarProps) {
  const pageTitle = activeTitle || pageTitles[activePage]

  return (
    <header className="topbar">
      <div className="topbar-title">
        <span>Vidhya School ERP · v{APP_VERSION}</span>
        <div>
          <h1>{pageTitle}</h1>
          <span className="breadcrumb">Vidhya Public School / {pageTitle}</span>
        </div>
      </div>
      <div className="topbar-actions">
        <div className={`license-badge license-badge--${licenseStatus.status}`}>
          {licenseStatusLabels[licenseStatus.status]}
        </div>
        <div className="offline-badge">
          <span />
          Offline Ready
        </div>
        <div className="database-badge">
          <span />
          Database Connected
        </div>
        <div className="admin-profile">
          <div className="admin-avatar">{getInitials(currentUser.name) || 'U'}</div>
          <div>
            <strong>{currentUser.name}</strong>
            <span>{currentUser.role}</span>
          </div>
        </div>
        <button className="secondary-button topbar-logout" type="button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}
