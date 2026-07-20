import { useEffect, useState } from 'react'
import type {
  AuthUser,
  LicenseStatus,
  PageId,
  PreferenceLanguage,
} from '../types'
import { APP_VERSION } from '../lib/appInfo'
import { getErpApi } from '../lib/erpApi'
import { translateText } from '../lib/i18n'
import { licenseStatusLabels, remoteLicenseStatusLabels } from '../lib/license'
import type { NavigationTarget } from '../lib/navigation'
import { Icon } from './Icon'

interface TopbarProps {
  activePage: PageId
  activeSubtitle?: string
  activeTitle?: string
  currentUser: AuthUser
  language: PreferenceLanguage
  licenseStatus: LicenseStatus
  onLogout: () => void
  onNavigate: (target: NavigationTarget, navigationId: string) => void
}

const pageTitles: Record<PageId, string> = {
  dashboard: 'Dashboard',
  students: 'Student Management',
  families: 'Family & Guardian Management',
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
  'behaviour-skills': 'Behaviour & Skills',
  'academic-sessions': 'Academic Sessions & Promotion',
  'student-login-management': 'Student Manage Login',
  'employee-login-management': 'Employee Manage Login',
  'message-center': 'Local Message Center',
  'student-portal': 'Student Dashboard',
  'employee-portal': 'My Workspace',
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

const remoteBadgeClass = (status: LicenseStatus) =>
  (status.remote?.displayStatus || status.status)
    .toLowerCase()
    .replace(/\s+/g, '-')

export function Topbar({
  activePage,
  activeSubtitle,
  activeTitle,
  currentUser,
  language,
  licenseStatus,
  onLogout,
  onNavigate,
}: TopbarProps) {
  const [unreadMessages, setUnreadMessages] = useState(0)
  const pageTitle = activeTitle || translateText(pageTitles[activePage], language)
  const breadcrumb = activeSubtitle
    ? `${activeSubtitle} / ${pageTitle}`
    : `Vidhya Public School / ${pageTitle}`
  const remoteStatus = licenseStatus.remote

  useEffect(() => {
    let cancelled = false
    getErpApi()
      .getMessageInbox({ unreadOnly: true, limit: 100 })
      .then((messages) => {
        if (!cancelled) setUnreadMessages(messages.length)
      })
      .catch(() => {
        if (!cancelled) setUnreadMessages(0)
      })
    return () => {
      cancelled = true
    }
  }, [activePage, currentUser.id])

  return (
    <header className="topbar">
      <div className="topbar-title">
        <span>Vidhya School ERP · v{APP_VERSION}</span>
        <div>
          <h1>{pageTitle}</h1>
          <span className="breadcrumb">{breadcrumb}</span>
        </div>
      </div>
      <div className="topbar-actions">
        <div
          className={`license-badge license-badge--${remoteBadgeClass(licenseStatus)}`}
          title={remoteStatus?.message || licenseStatus.message}
        >
          {remoteStatus
            ? remoteLicenseStatusLabels[remoteStatus.displayStatus]
            : licenseStatusLabels[licenseStatus.status]}
        </div>
        {remoteStatus?.displayStatus === 'Offline Grace' && (
          <div className="license-grace-warning">{remoteStatus.message}</div>
        )}
        <div className="offline-badge">
          <span />
          {language === 'Hindi' ? 'ऑफलाइन तैयार' : 'Offline Ready'}
        </div>
        <div className="database-badge">
          <span />
          {language === 'Hindi' ? 'डेटाबेस कनेक्टेड' : 'Database Connected'}
        </div>
        <button
          className="topbar-message-button"
          onClick={() => onNavigate({ page: 'message-center', view: 'inbox' }, 'message-center')}
          title={translateText('Open inbox', language)}
          type="button"
        >
          <Icon name="bell" size={17} />
          {unreadMessages > 0 && <span>{unreadMessages}</span>}
        </button>
        <div className="admin-profile">
          <div className="admin-avatar">{getInitials(currentUser.name) || 'U'}</div>
          <div>
            <strong>{currentUser.name}</strong>
            <span>
              {currentUser.accountType === 'Student'
                ? 'Student'
                : currentUser.entityLink?.entityType === 'Employee'
                  ? `Employee · ${currentUser.role}`
                  : currentUser.role}
            </span>
          </div>
        </div>
        <button className="secondary-button topbar-logout" type="button" onClick={onLogout}>
          {translateText('Logout', language)}
        </button>
      </div>
    </header>
  )
}
