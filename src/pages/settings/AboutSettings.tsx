import { Icon } from '../../components/Icon'
import {
  APP_BUILDER,
  APP_NAME,
  APP_TYPE,
  APP_VERSION,
  SUPPORT_EMAIL,
} from '../../lib/appInfo'

const modules = [
  'Students',
  'Fees',
  'Receipts',
  'Attendance',
  'Reports',
  'Exams',
  'Marksheet',
  'Backup/Restore',
  'Users/Roles',
]

const productDetails = [
  { label: 'Product', value: APP_NAME },
  { label: 'Version', value: APP_VERSION },
  { label: 'Type', value: APP_TYPE },
  { label: 'Built by', value: APP_BUILDER },
  { label: 'Support Email', value: SUPPORT_EMAIL },
  { label: 'Database', value: 'Local SQLite' },
  { label: 'Offline Ready', value: 'Yes' },
  { label: 'License', value: 'Vidhya Tech Demo Release License' },
]

export function AboutSettings() {
  return (
    <div className="about-settings-layout">
      <section className="panel about-product-card">
        <div className="about-product-identity">
          <span className="about-product-mark">
            <Icon name="school" size={31} />
          </span>
          <div>
            <p className="eyebrow">Version {APP_VERSION}</p>
            <h3>{APP_NAME}</h3>
            <span>{APP_TYPE}</span>
          </div>
        </div>
        <p className="about-product-description">
          A secure, offline-first school administration system designed to keep
          operational data on the local desktop.
        </p>
        <div className="about-status-row">
          <span className="offline-badge">
            <span />
            Offline Ready
          </span>
          <span className="database-badge">
            <span />
            Local SQLite
          </span>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Product Information</h3>
            <p>Release, support and license details</p>
          </div>
        </div>
        <dl className="about-detail-grid">
          {productDetails.map((detail) => (
            <div key={detail.label}>
              <dt>{detail.label}</dt>
              <dd>{detail.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="panel about-modules-panel">
        <div className="panel-heading">
          <div>
            <h3>Included Modules</h3>
            <p>Available in the Vidhya School ERP 1.0 release</p>
          </div>
        </div>
        <div className="about-module-list">
          {modules.map((module) => (
            <span key={module}>
              <Icon name="check" size={14} />
              {module}
            </span>
          ))}
        </div>
        <div className="about-support-note">
          <Icon name="user" size={18} />
          <div>
            <strong>Support and licensing</strong>
            <p>
              Contact {SUPPORT_EMAIL} for deployment, support and production
              licensing information.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
