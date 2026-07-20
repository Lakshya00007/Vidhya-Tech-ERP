import type { ModulePlaceholderInfo } from '../types'
import { Icon } from './Icon'

interface ModulePlaceholderProps {
  info: ModulePlaceholderInfo
  onBack: () => void
}

export function ModulePlaceholder({ info, onBack }: ModulePlaceholderProps) {
  const isOnlineIntegration = info.status === 'online'

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
          <Icon name={isOnlineIntegration ? 'bell' : 'clock'} size={30} />
        </span>
        <span className="module-placeholder__eyebrow">
          {isOnlineIntegration ? 'Online integration' : 'Not implemented'}
        </span>
        <h3>
          {isOnlineIntegration
            ? 'Online integration required'
            : 'Not implemented'}
        </h3>
        <p>
          {info.description ||
            (isOnlineIntegration
              ? `${info.title} depends on an online service or API integration and is not available in the offline desktop module.`
              : `${info.title} is not implemented in this release.`)}
        </p>
        <button className="secondary-button" type="button" onClick={onBack}>
          <Icon name="arrow" size={16} />
          Return to Dashboard
        </button>
      </section>
    </div>
  )
}
