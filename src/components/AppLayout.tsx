import type { ReactNode } from 'react'
import type {
  AuthUser,
  AppPreference,
  LicenseStatus,
  ModulePlaceholderInfo,
  PageId,
} from '../types'
import {
  getNavigationEntryDetails,
  type NavigationTarget,
} from '../lib/navigation'
import { translateText } from '../lib/i18n'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface AppLayoutProps {
  activePage: PageId
  activeNavigationId: string
  activeTitle?: string
  currentUser: AuthUser
  licenseStatus: LicenseStatus
  onLogout: () => void
  onNavigate: (target: NavigationTarget, navigationId: string) => void
  onPlaceholder: (info: ModulePlaceholderInfo) => void
  preferences: AppPreference
  children: ReactNode
}

export function AppLayout({
  activePage,
  activeNavigationId,
  activeTitle,
  currentUser,
  licenseStatus,
  onLogout,
  onNavigate,
  onPlaceholder,
  preferences,
  children,
}: AppLayoutProps) {
  const activeNavigation = getNavigationEntryDetails(activeNavigationId)
  const rawPageTitle = activeTitle ?? activeNavigation?.label ?? ''
  const pageTitle = translateText(rawPageTitle, preferences.language)
  const pageSubtitle =
    activeNavigation?.module && activeNavigation.module !== rawPageTitle
      ? translateText(activeNavigation.module, preferences.language)
      : undefined
  const shellClasses = [
    'app-shell',
    `theme--${preferences.themeMode.toLowerCase()}`,
    `accent--${preferences.accentColor.toLowerCase()}`,
    `font-scale--${preferences.fontScale.toLowerCase()}`,
    preferences.compactSidebar ? 'app-shell--compact-sidebar' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={shellClasses}>
      <Sidebar
        activeNavigationId={activeNavigationId}
        licenseStatus={licenseStatus}
        language={preferences.language}
        onLogout={onLogout}
        onNavigate={onNavigate}
        onPlaceholder={onPlaceholder}
        role={currentUser.role}
      />
      <div className="app-workspace">
        <Topbar
          activePage={activePage}
          activeSubtitle={pageSubtitle}
          activeTitle={pageTitle}
          currentUser={currentUser}
          language={preferences.language}
          licenseStatus={licenseStatus}
          onLogout={onLogout}
          onNavigate={onNavigate}
        />
        <main className="main-content">{children}</main>
      </div>
    </div>
  )
}
