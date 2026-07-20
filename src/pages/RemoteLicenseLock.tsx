import { useState, type FormEvent } from 'react'
import { AuthShell } from '../components/AuthShell'
import { Icon } from '../components/Icon'
import { SUPPORT_EMAIL } from '../lib/appInfo'
import { copyTextToClipboard } from '../lib/clipboard'
import { getErrorMessage, getLicenseErpApi } from '../lib/erpApi'
import { formatLicenseDate } from '../lib/license'
import type { LicenseStatus } from '../types'

interface RemoteLicenseLockProps {
  status: LicenseStatus
  onStatusChange: (status: LicenseStatus) => void
  onUnlocked: (status: LicenseStatus) => void
}

function titleForStatus(status: LicenseStatus) {
  const remoteStatus = status.remote?.displayStatus
  if (remoteStatus === 'Suspended') {
    return 'License Suspended'
  }
  if (remoteStatus === 'Revoked') {
    return 'License Revoked'
  }
  if (remoteStatus === 'Expired') {
    return 'License Expired'
  }
  return 'Online Check Required'
}

export function RemoteLicenseLock({
  status,
  onStatusChange,
  onUnlocked,
}: RemoteLicenseLockProps) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [newLicenseKey, setNewLicenseKey] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const remote = status.remote
  const license = status.license
  const deviceId = remote?.deviceId || status.deviceId

  const copyDeviceId = async () => {
    try {
      await copyTextToClipboard(deviceId)
      setMessage('Device ID copied to the clipboard.')
      setError('')
    } catch (copyError) {
      setError(getErrorMessage(copyError))
    }
  }

  const openUpdateModal = () => {
    setNewLicenseKey('')
    setError('')
    setMessage('')
    setIsUpdateModalOpen(true)
  }

  const closeUpdateModal = () => {
    if (isUpdating) return
    setNewLicenseKey('')
    setIsUpdateModalOpen(false)
  }

  const verifyAndUpdateLicense = async (event: FormEvent) => {
    event.preventDefault()
    setIsUpdating(true)
    setError('')
    setMessage('')
    try {
      const nextStatus = await getLicenseErpApi().updateLicenseKey(newLicenseKey)
      setNewLicenseKey('')
      setIsUpdateModalOpen(false)
      onStatusChange(nextStatus)
      if (nextStatus.isValid && !nextStatus.remote?.blocksUsage) {
        onUnlocked(nextStatus)
        return
      }
      setError(nextStatus.remote?.message || nextStatus.message)
    } catch (updateError) {
      setNewLicenseKey('')
      setError(getErrorMessage(updateError))
      try {
        const nextStatus = await getLicenseErpApi().getLicenseStatus()
        onStatusChange(nextStatus)
      } catch {
        // Keep the original update error visible.
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const checkAgain = async () => {
    setIsChecking(true)
    setError('')
    setMessage('')
    try {
      await getLicenseErpApi().checkRemoteLicenseNow()
      const nextStatus = await getLicenseErpApi().getLicenseStatus()
      onStatusChange(nextStatus)
      if (!nextStatus.remote?.blocksUsage) {
        onUnlocked(nextStatus)
        return
      }
      setError(nextStatus.remote.message)
    } catch (checkError) {
      setError(getErrorMessage(checkError))
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Remote license control"
      title="Vidhya School ERP License Required"
      description={remote?.message || status.message}
    >
      <div className="remote-license-lock">
        <div className="remote-license-lock__status">
          <span>{remote?.displayStatus || 'Check Required'}</span>
          <strong>{titleForStatus(status)}</strong>
          <p>{remote?.message || status.message}</p>
        </div>

        {message && (
          <div className="inline-message auth-message">
            <Icon name="check" size={16} />
            <span>{message}</span>
          </div>
        )}
        {error && !isUpdateModalOpen && (
          <div className="inline-message inline-message--error auth-message">
            <Icon name="close" size={16} />
            <span>{error}</span>
          </div>
        )}

        <dl className="remote-license-lock__details">
          <div>
            <dt>School Name</dt>
            <dd>{license?.schoolName || '—'}</dd>
          </div>
          <div>
            <dt>License ID</dt>
            <dd>{license?.licenseId || remote?.licenseId || '—'}</dd>
          </div>
          <div>
            <dt>Device ID</dt>
            <dd>
              <code>{deviceId || '—'}</code>
            </dd>
          </div>
          <div>
            <dt>Last Successful Check</dt>
            <dd>{formatLicenseDate(remote?.lastOnlineCheckAt)}</dd>
          </div>
        </dl>

        <div className="remote-license-lock__actions">
          <button
            className="primary-button"
            disabled={isChecking || isUpdating}
            onClick={() => void checkAgain()}
            type="button"
          >
            <Icon name="check" size={16} />
            {isChecking ? 'Checking...' : 'Check Again'}
          </button>
          <button
            className="secondary-button"
            disabled={isChecking || isUpdating}
            onClick={openUpdateModal}
            type="button"
          >
            <Icon name="edit" size={16} />
            Update License Key
          </button>
          <button
            className="secondary-button"
            disabled={!deviceId || isUpdating}
            onClick={() => void copyDeviceId()}
            type="button"
          >
            Copy Device ID
          </button>
        </div>

        <p className="remote-license-lock__contact">
          Contact Vidhya Tech at <span>{SUPPORT_EMAIL}</span> with your License
          ID and Device ID.
        </p>
      </div>
      {isUpdateModalOpen && (
        <div
          className="remote-license-update-backdrop"
          onMouseDown={closeUpdateModal}
          role="presentation"
        >
          <form
            aria-labelledby="remote-license-update-title"
            aria-modal="true"
            className="remote-license-update-modal"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => void verifyAndUpdateLicense(event)}
            role="dialog"
          >
            <div className="remote-license-update-modal__header">
              <div>
                <span>Signed VSE1 replacement</span>
                <h2 id="remote-license-update-title">Update License Key</h2>
              </div>
              <button
                aria-label="Cancel license update"
                className="remote-license-update-modal__close"
                disabled={isUpdating}
                onClick={closeUpdateModal}
                type="button"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            {error && (
              <div className="inline-message inline-message--error auth-message">
                <Icon name="close" size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="remote-license-update-device">
              <span>Current Device ID</span>
              <code>{deviceId || '—'}</code>
            </div>

            <label className="form-field">
              <span>New License Key</span>
              <textarea
                autoFocus
                disabled={isUpdating}
                onChange={(event) => setNewLicenseKey(event.target.value)}
                placeholder="Paste the signed VSE1 license key"
                required
                rows={6}
                value={newLicenseKey}
              />
            </label>

            <div className="remote-license-update-actions">
              <button
                className="secondary-button"
                disabled={isUpdating}
                onClick={closeUpdateModal}
                type="button"
              >
                Cancel
              </button>
              <button
                className="primary-button"
                disabled={!newLicenseKey.trim() || isUpdating}
                type="submit"
              >
                <Icon name="check" size={16} />
                {isUpdating ? 'Verifying...' : 'Verify & Update License'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AuthShell>
  )
}
