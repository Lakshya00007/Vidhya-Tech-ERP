import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import type { CommunicationGatewaySettings } from '../../types'
import type { SettingsSectionProps } from '../Settings'

const emptySettings: CommunicationGatewaySettings = {
  id: 'application-defaults',
  gatewayUrl: '',
  tokenStorage: '',
  tokenPrefix: '',
  hasToken: false,
  connectionStatus: 'Not configured',
  whatsappStatus: 'Unknown',
  smsStatus: 'Unknown',
  lastSuccessAt: null,
  lastError: '',
  createdAt: '',
  updatedAt: '',
}

const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString() : 'Never'

export function CommunicationIntegrationsSettings({
  onNotice,
}: SettingsSectionProps) {
  const [settings, setSettings] =
    useState<CommunicationGatewaySettings>(emptySettings)
  const [gatewayUrl, setGatewayUrl] = useState('')
  const [deviceToken, setDeviceToken] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const loadSettings = useCallback(async () => {
    try {
      const nextSettings =
        await getErpApi().getCommunicationGatewayConfiguration()
      setSettings(nextSettings)
      setGatewayUrl(nextSettings.gatewayUrl)
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }, [onNotice])

  useEffect(() => {
    void Promise.resolve().then(loadSettings)
  }, [loadSettings])

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      const nextSettings = await getErpApi().configureCommunicationGateway({
        gatewayUrl,
        deviceToken: deviceToken || undefined,
      })
      setSettings(nextSettings)
      setDeviceToken('')
      onNotice({
        type: 'success',
        message: 'Communication gateway configuration saved.',
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const testGateway = async () => {
    setIsTesting(true)
    try {
      const nextSettings = await getErpApi().testCommunicationGateway()
      setSettings(nextSettings)
      onNotice({
        type:
          nextSettings.connectionStatus === 'Connected' ? 'success' : 'error',
        message:
          nextSettings.connectionStatus === 'Connected'
            ? 'Communication gateway connection verified.'
            : nextSettings.lastError || 'Communication gateway test failed.',
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsTesting(false)
    }
  }

  const removeToken = async () => {
    if (!window.confirm('Remove the stored communication device token?')) {
      return
    }
    try {
      const nextSettings = await getErpApi().removeCommunicationGatewayToken()
      setSettings(nextSettings)
      setDeviceToken('')
      onNotice({
        type: 'success',
        message: 'Stored communication token was removed.',
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  return (
    <div className="license-settings-layout">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Communication Gateway</h3>
            <p>Connect this desktop to ERP-Management for WhatsApp and SMS delivery</p>
          </div>
          <span
            className={`status-badge status-badge--${settings.connectionStatus.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {settings.connectionStatus}
          </span>
        </div>

        <form className="settings-form" onSubmit={save}>
          <label className="form-field">
            <span>Gateway URL</span>
            <input
              value={gatewayUrl}
              onChange={(event) => setGatewayUrl(event.target.value)}
              placeholder="https://management.example.com"
              required
            />
            <small>Production gateways must use HTTPS. Localhost HTTP is accepted only in development.</small>
          </label>
          <label className="form-field">
            <span>Device communication token</span>
            <input
              value={deviceToken}
              onChange={(event) => setDeviceToken(event.target.value)}
              placeholder={
                settings.hasToken
                  ? 'Leave blank to keep the stored token'
                  : 'Paste the one-time token from ERP-Management'
              }
              type="password"
            />
            <small>
              Stored token: {settings.hasToken ? settings.tokenPrefix : 'Not configured'}
            </small>
          </label>
          <div className="form-actions">
            <button className="primary-button" disabled={isSaving} type="submit">
              <Icon name="check" size={16} />
              {isSaving ? 'Saving...' : 'Save Gateway'}
            </button>
            <button
              className="secondary-button"
              disabled={isTesting || !settings.hasToken}
              onClick={() => void testGateway()}
              type="button"
            >
              <Icon name="view" size={16} />
              {isTesting ? 'Testing...' : 'Test Gateway'}
            </button>
            <button
              className="secondary-button"
              disabled={!settings.hasToken}
              onClick={() => void removeToken()}
              type="button"
            >
              <Icon name="trash" size={16} />
              Remove Token
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Provider Status</h3>
            <p>Read-only status returned by the server-side gateway</p>
          </div>
        </div>
        <dl className="license-detail-grid">
          <div>
            <dt>WhatsApp</dt>
            <dd>{settings.whatsappStatus}</dd>
          </div>
          <div>
            <dt>SMS</dt>
            <dd>{settings.smsStatus}</dd>
          </div>
          <div>
            <dt>Last Success</dt>
            <dd>{formatDateTime(settings.lastSuccessAt)}</dd>
          </div>
          <div>
            <dt>Token Storage</dt>
            <dd>{settings.tokenStorage || 'Not configured'}</dd>
          </div>
        </dl>
        {settings.lastError && (
          <div className="inline-message inline-message--error">
            <Icon name="close" size={17} />
            {settings.lastError}
          </div>
        )}
      </section>
    </div>
  )
}
