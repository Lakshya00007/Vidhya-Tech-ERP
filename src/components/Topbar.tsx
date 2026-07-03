import type { AuthUser, PageId } from '../types'

interface TopbarProps {
  activePage: PageId
  currentUser: AuthUser
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
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export function Topbar({ activePage, currentUser, onLogout }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        <span>School ERP Desktop</span>
        <div>
          <h1>{pageTitles[activePage]}</h1>
          <span className="breadcrumb">Vidhya Public School / {pageTitles[activePage]}</span>
        </div>
      </div>
      <div className="topbar-actions">
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
