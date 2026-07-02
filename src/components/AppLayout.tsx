import type { ReactNode } from 'react'
import type { PageId } from '../types'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface AppLayoutProps {
  activePage: PageId
  onNavigate: (page: PageId) => void
  children: ReactNode
}

export function AppLayout({ activePage, onNavigate, children }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className="app-workspace">
        <Topbar activePage={activePage} />
        <main className="main-content">{children}</main>
      </div>
    </div>
  )
}
