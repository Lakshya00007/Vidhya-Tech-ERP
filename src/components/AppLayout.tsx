import type { ReactNode } from 'react'
import type {
  AuthUser,
  LicenseStatus,
  ModulePlaceholderInfo,
  PageId,
} from '../types'
import type { NavigationTarget } from '../lib/navigation'
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
  children,
}: AppLayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar
        activeNavigationId={activeNavigationId}
        licenseStatus={licenseStatus}
        onLogout={onLogout}
        onNavigate={onNavigate}
        onPlaceholder={onPlaceholder}
        role={currentUser.role}
      />
      <div className="app-workspace">
        <Topbar
          activePage={activePage}
          activeTitle={activeTitle}
          currentUser={currentUser}
          licenseStatus={licenseStatus}
          onLogout={onLogout}
        />
        <main className="main-content">{children}</main>
      </div>
    </div>
  )
}
