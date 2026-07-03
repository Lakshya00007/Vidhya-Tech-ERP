import type { ReactNode } from 'react'
import type { AuthUser, PageId } from '../types'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface AppLayoutProps {
  activePage: PageId
  currentUser: AuthUser
  onLogout: () => void
  onNavigate: (page: PageId) => void
  children: ReactNode
}

export function AppLayout({
  activePage,
  currentUser,
  onLogout,
  onNavigate,
  children,
}: AppLayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        role={currentUser.role}
      />
      <div className="app-workspace">
        <Topbar
          activePage={activePage}
          currentUser={currentUser}
          onLogout={onLogout}
        />
        <main className="main-content">{children}</main>
      </div>
    </div>
  )
}
