import type { ModulePlaceholderInfo } from '../types'
import { Icon } from './Icon'

interface ModulePlaceholderProps {
  info: ModulePlaceholderInfo
  onBack: () => void
}

export function ModulePlaceholder({ info, onBack }: ModulePlaceholderProps) {
  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h2>{info.title}</h2>
          <p>{info.module}</p>
        </div>
      </section>

      <section className="panel module-placeholder">
        <span className="module-placeholder__icon">
          <Icon name="clock" size={30} />
        </span>
        <span className="module-placeholder__eyebrow">Advanced module placeholder</span>
        <h3>Coming in next version</h3>
        <p>
          {info.description ||
            `${info.title} is included in the ERP navigation roadmap and is not implemented in this release.`}
        </p>
        <button className="secondary-button" type="button" onClick={onBack}>
          <Icon name="arrow" size={16} />
          Return to Dashboard
        </button>
      </section>
    </div>
  )
}
