import { Icon, type IconName } from './Icon'

interface StatCardProps {
  label: string
  value: string
  meta: string
  icon: IconName
  tone: 'blue' | 'green' | 'amber' | 'violet'
}

export function StatCard({ label, value, meta, icon, tone }: StatCardProps) {
  return (
    <article className="stat-card">
      <div className={`stat-icon stat-icon--${tone}`}>
        <Icon name={icon} size={21} />
      </div>
      <div className="stat-content">
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{meta}</span>
      </div>
    </article>
  )
}
