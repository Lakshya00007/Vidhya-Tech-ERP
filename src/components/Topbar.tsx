import type { PageId } from '../types'
import { Icon } from './Icon'

interface TopbarProps {
  activePage: PageId
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

export function Topbar({ activePage }: TopbarProps) {
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
        <button className="icon-button notification-button" type="button" aria-label="Notifications">
          <Icon name="bell" size={19} />
          <span className="notification-dot" />
        </button>
        <div className="admin-profile">
          <div className="admin-avatar">AD</div>
          <div>
            <strong>Administrator</strong>
            <span>School Admin</span>
          </div>
        </div>
      </div>
    </header>
  )
}
