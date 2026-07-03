import type { ReactNode } from 'react'
import { Icon } from './Icon'

interface AuthShellProps {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className="auth-screen">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <span className="auth-brand__mark">
            <Icon name="school" size={29} />
          </span>
          <div>
            <strong>Vidhya School ERP</strong>
            <span>Local desktop administration</span>
          </div>
        </div>
        <div className="auth-brand-copy">
          <span className="offline-badge">
            <span />
            Offline Ready
          </span>
          <h1>School operations, secured on this device.</h1>
          <p>
            Student, fee, attendance and examination records stay in the local
            SQLite database.
          </p>
        </div>
        <small>School ERP Desktop · Local desktop ERP system</small>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="auth-card__description">{description}</p>
          {children}
        </div>
      </section>
    </main>
  )
}
