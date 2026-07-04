import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { copyTextToClipboard } from '../../lib/clipboard'
import { getErrorMessage, getLicenseErpApi } from '../../lib/erpApi'
import { formatLicenseDate, licenseStatusLabels } from '../../lib/license'
import type { AuthUser, LicenseStatus } from '../../types'
import type { SettingsSectionProps } from '../Settings'

interface LicenseSettingsProps extends SettingsSectionProps {
  currentUser: AuthUser
  initialStatus: LicenseStatus
  onStatusChange: (status: LicenseStatus) => void
}

export function LicenseSettings({
  currentUser,
  initialStatus,
  onNotice,
  onStatusChange,
}: LicenseSettingsProps) {
  const [status, setStatus] = useState(initialStatus)
  const [licenseKey, setLicenseKey] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)

  useEffect(() => {
    let isCurrent = true
    Promise.resolve()
      .then(() => getLicenseErpApi().getLicenseInfo())
      .then((nextStatus) => {
        if (isCurrent) {
          setStatus(nextStatus)
          onStatusChange(nextStatus)
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
    return () => {
      isCurrent = false
    }
  }, [onNotice, onStatusChange])

  const copyDeviceId = async () => {
    try {
      await copyTextToClipboard(status.deviceId)
      onNotice({ type: 'success', message: 'Device ID copied to the clipboard.' })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const updateLicense = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      const nextStatus = await getLicenseErpApi().activateLicense(licenseKey)
      setStatus(nextStatus)
      setLicenseKey('')
      onStatusChange(nextStatus)
      onNotice({ type: 'success', message: 'License updated successfully.' })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const deactivate = async () => {
    if (
      !window.confirm(
        'Deactivate this device? The ERP will return to the activation screen.',
      )
    ) {
      return
    }
    setIsDeactivating(true)
    try {
      const result = await getLicenseErpApi().deactivateLicense()
      const nextStatus = await getLicenseErpApi().getLicenseStatus()
      onNotice({
        type: result.success ? 'success' : 'error',
        message: result.message,
      })
      onStatusChange(nextStatus)
    } catch (error) {
      setIsDeactivating(false)
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const license = status.license

  return (
    <div className="license-settings-layout">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>License Information</h3>
            <p>Device-bound offline activation details</p>
          </div>
          <span className={`license-badge license-badge--${status.status}`}>
            {licenseStatusLabels[status.status]}
          </span>
        </div>
        <dl className="license-detail-grid">
          <div>
            <dt>School Name</dt>
            <dd>{license?.schoolName || '—'}</dd>
          </div>
          <div>
            <dt>License ID</dt>
            <dd>{license?.licenseId || '—'}</dd>
          </div>
          <div>
            <dt>Device ID</dt>
            <dd className="license-device-value">
              <code>{status.deviceId}</code>
              <button className="text-button" onClick={() => void copyDeviceId()} type="button">
                Copy
              </button>
            </dd>
          </div>
          <div>
            <dt>Plan</dt>
            <dd>{license?.plan || '—'}</dd>
          </div>
          <div>
            <dt>Expiry Date</dt>
            <dd>{formatLicenseDate(license?.expiresAt)}</dd>
          </div>
          <div>
            <dt>Maintenance Valid Until</dt>
            <dd>{formatLicenseDate(license?.maintenanceUntil)}</dd>
          </div>
          <div>
            <dt>Maximum Users</dt>
            <dd>{license?.maxUsers ?? '—'}</dd>
          </div>
          <div>
            <dt>Activated Date</dt>
            <dd>{formatLicenseDate(status.activatedAt)}</dd>
          </div>
        </dl>
        <div className="license-features">
          <span>Licensed Features</span>
          <div>
            {(license?.features.length ? license.features : ['None']).map((feature) => (
              <span className="neutral-badge" key={feature}>{feature}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Update License</h3>
            <p>Apply a renewed or upgraded signed license key</p>
          </div>
        </div>
        <form className="license-update-form" onSubmit={(event) => void updateLicense(event)}>
          <label className="form-field">
            <span>New License Key</span>
            <textarea
              onChange={(event) => setLicenseKey(event.target.value)}
              placeholder="Paste the signed VSE1 license key"
              required
              rows={5}
              value={licenseKey}
            />
          </label>
          <div className="license-actions">
            {currentUser.role === 'Owner' && (
              <button
                className="secondary-button license-deactivate-button"
                disabled={isDeactivating}
                onClick={() => void deactivate()}
                type="button"
              >
                <Icon name="close" size={16} />
                {isDeactivating ? 'Deactivating...' : 'Deactivate License'}
              </button>
            )}
            <button
              className="primary-button"
              disabled={!licenseKey.trim() || isSaving}
              type="submit"
            >
              <Icon name="check" size={16} />
              {isSaving ? 'Verifying...' : 'Update License'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
