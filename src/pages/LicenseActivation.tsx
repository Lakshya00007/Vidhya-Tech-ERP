import { useEffect, useState, type FormEvent } from 'react'
import { AuthShell } from '../components/AuthShell'
import { Icon } from '../components/Icon'
import { APP_NAME, SUPPORT_EMAIL } from '../lib/appInfo'
import { copyTextToClipboard } from '../lib/clipboard'
import { getErrorMessage, getLicenseErpApi } from '../lib/erpApi'
import { licenseStatusLabels } from '../lib/license'
import type { LicenseStatus } from '../types'

interface LicenseActivationProps {
  initialStatus: LicenseStatus | null
  onActivated: (status: LicenseStatus) => void
}

export function LicenseActivation({
  initialStatus,
  onActivated,
}: LicenseActivationProps) {
  const [deviceId, setDeviceId] = useState(initialStatus?.deviceId ?? '')
  const [licenseKey, setLicenseKey] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState(
    initialStatus?.status === 'expired' || initialStatus?.status === 'invalid'
      ? initialStatus.message
      : '',
  )
  const [isActivating, setIsActivating] = useState(false)

  useEffect(() => {
    if (deviceId) return
    let isCurrent = true
    Promise.resolve()
      .then(() => getLicenseErpApi().getDeviceId())
      .then((value) => {
        if (isCurrent) setDeviceId(value)
      })
      .catch((loadError: unknown) => {
        if (isCurrent) setError(getErrorMessage(loadError))
      })
    return () => {
      isCurrent = false
    }
  }, [deviceId])

  const copyDeviceId = async () => {
    try {
      await copyTextToClipboard(deviceId)
      setMessage('Device ID copied to the clipboard.')
      setError('')
    } catch (copyError) {
      setError(getErrorMessage(copyError))
    }
  }

  const activate = async (event: FormEvent) => {
    event.preventDefault()
    setIsActivating(true)
    setError('')
    setMessage('')
    try {
      const status = await getLicenseErpApi().activateLicense(licenseKey)
      setLicenseKey('')
      onActivated(status)
    } catch (activationError) {
      setError(getErrorMessage(activationError))
    } finally {
      setIsActivating(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Offline license activation"
      title="Activate Vidhya School ERP"
      description="A valid device-bound license is required before school accounts can be accessed."
    >
      {initialStatus && initialStatus.status !== 'missing' && (
        <div className="license-activation-status">
          <strong>{licenseStatusLabels[initialStatus.status]}</strong>
          <span>{initialStatus.message}</span>
        </div>
      )}
      {message && (
        <div className="inline-message auth-message">
          <Icon name="check" size={16} />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="inline-message inline-message--error auth-message">
          <Icon name="close" size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="activation-product-row">
        <span>Product</span>
        <strong>{APP_NAME}</strong>
      </div>

      <div className="activation-device-block">
        <span>Device ID</span>
        <div>
          <code>{deviceId || 'Generating device ID...'}</code>
          <button
            className="secondary-button"
            disabled={!deviceId}
            onClick={() => void copyDeviceId()}
            type="button"
          >
            Copy Device ID
          </button>
        </div>
      </div>

      <p className="activation-instruction">
        Send this Device ID to Vidhya Tech to receive your license key.
        <span>{SUPPORT_EMAIL}</span>
      </p>

      <form className="auth-form" onSubmit={(event) => void activate(event)}>
        <label className="form-field">
          <span>License Key</span>
          <textarea
            onChange={(event) => setLicenseKey(event.target.value)}
            placeholder="Paste the signed VSE1 license key"
            required
            rows={4}
            value={licenseKey}
          />
        </label>
        <button
          className="primary-button auth-submit"
          disabled={!deviceId || !licenseKey.trim() || isActivating}
          type="submit"
        >
          <Icon name="check" size={17} />
          {isActivating ? 'Verifying License...' : 'Activate License'}
        </button>
      </form>
    </AuthShell>
  )
}
