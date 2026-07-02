import type { PageId } from '../types'
import { Icon, type IconName } from './Icon'

interface SidebarProps {
  activePage: PageId
  onNavigate: (page: PageId) => void
}

const navigation: { id: PageId; label: string; icon: IconName }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'students', label: 'Students', icon: 'students' },
  { id: 'fees', label: 'Fees', icon: 'fees' },
  { id: 'attendance', label: 'Attendance', icon: 'attendance' },
  { id: 'exams', label: 'Exams', icon: 'exams' },
  { id: 'reports', label: 'Reports', icon: 'reports' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">
          <Icon name="school" size={24} />
        </div>
        <div>
          <strong>Vidhya</strong>
          <span>School ERP</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        <span className="nav-label">Workspace</span>
        {navigation.map((item) => (
          <button
            className={`nav-item${activePage === item.id ? ' nav-item--active' : ''}`}
            key={item.id}
            onClick={() => onNavigate(item.id)}
            type="button"
          >
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="local-indicator">
          <span className="local-indicator__dot" />
          <div>
            <strong>Local system</strong>
            <span>Data stays on this device</span>
          </div>
        </div>
        <p>Local desktop ERP system</p>
      </div>
    </aside>
  )
}
