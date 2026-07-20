import { useEffect, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import { translateText } from '../../lib/i18n'
import { formatPreferenceDateTime } from '../../lib/preferenceFormat'
import { exportCsv } from '../../lib/reportUtils'
import type {
  AppPreference,
  AuthUser,
  LoginHistoryEntry,
  PreferenceLanguage,
} from '../../types'
import type { SettingsSectionProps } from '../Settings'

type AccountTab = 'profile' | 'password' | 'history' | 'security'

interface AccountSettingsProps extends SettingsSectionProps {
  currentUser: AuthUser
  language: PreferenceLanguage
  onCurrentUserChange: (user: AuthUser) => void
  onLogout: () => void
  preferences: AppPreference
}

const tabs: { id: AccountTab; label: string }[] = [
  { id: 'profile', label: 'My Profile' },
  { id: 'password', label: 'Change Password' },
  { id: 'history', label: 'Login History' },
  { id: 'security', label: 'Security' },
]

export function AccountSettings({
  currentUser,
  language,
  onCurrentUserChange,
  onLogout,
  onNotice,
  preferences,
}: AccountSettingsProps) {
  const [activeTab, setActiveTab] = useState<AccountTab>('profile')
  const [profile, setProfile] = useState({
    name: currentUser.name,
    username: currentUser.username,
    email: currentUser.email,
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [history, setHistory] = useState<LoginHistoryEntry[]>([])
  const [historyStart, setHistoryStart] = useState('')
  const [historyEnd, setHistoryEnd] = useState('')
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const t = (text: string) => translateText(text, language)

  const loadHistory = async () => {
    setIsLoadingHistory(true)
    try {
      setHistory(
        await getErpApi().getCurrentLoginHistory({
          startDate: historyStart,
          endDate: historyEnd,
          limit: 200,
        }),
      )
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (activeTab !== 'history') return
    let isCurrent = true
    Promise.resolve()
      .then(() =>
        getErpApi().getCurrentLoginHistory({
          startDate: historyStart,
          endDate: historyEnd,
          limit: 200,
        }),
      )
      .then((rows) => {
        if (isCurrent) setHistory(rows)
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
    return () => {
      isCurrent = false
    }
  }, [activeTab, historyEnd, historyStart, onNotice])

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      const updated = await getErpApi().updateCurrentAccountProfile(profile)
      onCurrentUserChange(updated)
      onNotice({ type: 'success', message: 'Profile updated.' })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const changePassword = async (event: FormEvent) => {
    event.preventDefault()
    if (passwordForm.newPassword.length < 8) {
      onNotice({
        type: 'error',
        message: 'New password must be at least 8 characters.',
      })
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      onNotice({ type: 'error', message: 'Password confirmation does not match.' })
      return
    }
    setIsSaving(true)
    try {
      await getErpApi().changeCurrentPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      onNotice({ type: 'success', message: 'Password changed.' })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const exportHistory = () =>
    exportCsv(
      'login-history.csv',
      ['Login At', 'Logout At', 'Username', 'Role', 'Status', 'Device', 'OS', 'Failure Reason'],
      history.map((entry) => [
        entry.loginAt,
        entry.logoutAt,
        entry.username,
        entry.role,
        entry.success ? 'Success' : 'Failed',
        entry.deviceName,
        entry.os,
        entry.failureReason,
      ]),
    )

  const historyColumns: TableColumn<LoginHistoryEntry>[] = [
    {
      key: 'loginAt',
      header: 'Login At',
      render: (entry) => formatPreferenceDateTime(entry.loginAt, preferences),
    },
    {
      key: 'logoutAt',
      header: 'Logout At',
      render: (entry) => formatPreferenceDateTime(entry.logoutAt, preferences),
    },
    { key: 'username', header: t('Username'), render: (entry) => entry.username },
    { key: 'role', header: t('Role'), render: (entry) => entry.role || '—' },
    {
      key: 'status',
      header: t('Status'),
      render: (entry) => (
        <span
          className={`status-badge status-badge--${entry.success ? 'active' : 'fail'}`}
        >
          {entry.success ? 'Success' : 'Failed'}
        </span>
      ),
    },
    {
      key: 'device',
      header: 'Device',
      render: (entry) => (
        <div className="primary-cell">
          <strong>{entry.deviceName || 'Local device'}</strong>
          <span>{entry.os || 'Desktop'}</span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Failure Reason',
      render: (entry) => entry.failureReason || '—',
    },
  ]

  return (
    <div className="account-settings-page">
      <nav className="settings-tabs" aria-label="Account settings sections">
        {tabs.map((tab) => (
          <button
            className={`settings-tab${activeTab === tab.id ? ' settings-tab--active' : ''}`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {t(tab.label)}
          </button>
        ))}
      </nav>

      {activeTab === 'profile' && (
        <form className="panel account-settings-panel" onSubmit={(event) => void saveProfile(event)}>
          <div className="panel-heading">
            <div>
              <h3>{t('My Profile')}</h3>
              <p>Update your local account identity. Role and status are protected.</p>
            </div>
          </div>
          <div className="settings-fields">
            <label className="form-field">
              <span>Display name</span>
              <input
                required
                value={profile.name}
                onChange={(event) =>
                  setProfile({ ...profile, name: event.target.value })
                }
              />
            </label>
            <label className="form-field">
              <span>{t('Username')}</span>
              <input
                required
                value={profile.username}
                onChange={(event) =>
                  setProfile({ ...profile, username: event.target.value })
                }
              />
            </label>
            <label className="form-field">
              <span>{t('Email')}</span>
              <input
                type="email"
                value={profile.email}
                onChange={(event) =>
                  setProfile({ ...profile, email: event.target.value })
                }
              />
            </label>
            <label className="form-field">
              <span>{t('Role')}</span>
              <input readOnly value={currentUser.role} />
            </label>
            <label className="form-field">
              <span>{t('Status')}</span>
              <input readOnly value={currentUser.status} />
            </label>
            <div className="settings-actions">
              <button className="primary-button" disabled={isSaving} type="submit">
                <Icon name="check" size={17} />
                {t('Save')}
              </button>
            </div>
          </div>
        </form>
      )}

      {activeTab === 'password' && (
        <form className="panel account-settings-panel" onSubmit={(event) => void changePassword(event)}>
          <div className="panel-heading">
            <div>
              <h3>{t('Change Password')}</h3>
              <p>Password verification and hashing run only in the Electron main process.</p>
            </div>
          </div>
          <div className="settings-fields settings-fields--single">
            <label className="form-field">
              <span>{t('Current Password')}</span>
              <input
                autoComplete="current-password"
                required
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: event.target.value,
                  })
                }
              />
            </label>
            <label className="form-field">
              <span>{t('New Password')}</span>
              <input
                autoComplete="new-password"
                minLength={8}
                required
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: event.target.value,
                  })
                }
              />
            </label>
            <label className="form-field">
              <span>{t('Confirm Password')}</span>
              <input
                autoComplete="new-password"
                minLength={8}
                required
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: event.target.value,
                  })
                }
              />
            </label>
            <div className="settings-actions">
              <button className="primary-button" disabled={isSaving} type="submit">
                <Icon name="check" size={17} />
                {t('Save')}
              </button>
            </div>
          </div>
        </form>
      )}

      {activeTab === 'history' && (
        <>
          <section className="panel report-filters">
            <div className="report-filter-fields report-filter-fields--compact">
              <label className="form-field">
                <span>Start Date</span>
                <input
                  type="date"
                  value={historyStart}
                  onChange={(event) => setHistoryStart(event.target.value)}
                />
              </label>
              <label className="form-field">
                <span>End Date</span>
                <input
                  type="date"
                  value={historyEnd}
                  onChange={(event) => setHistoryEnd(event.target.value)}
                />
              </label>
              <button className="primary-button" onClick={() => void loadHistory()} type="button">
                <Icon name="search" size={16} />
                {t('Filter')}
              </button>
              <button className="secondary-button" disabled={history.length === 0} onClick={exportHistory} type="button">
                <Icon name="download" size={16} />
                {t('Export')}
              </button>
            </div>
          </section>
          <section className="panel">
            <DataTable
              columns={historyColumns}
              emptyMessage={isLoadingHistory ? `${t('Loading')}...` : t('No records found')}
              getRowKey={(entry) => entry.id}
              rows={history}
            />
          </section>
        </>
      )}

      {activeTab === 'security' && (
        <section className="panel account-settings-panel">
          <div className="panel-heading">
            <div>
              <h3>{t('Security')}</h3>
              <p>Local desktop session controls for the current account.</p>
            </div>
          </div>
          <div className="settings-fields settings-fields--single">
            <div className="security-summary">
              <div>
                <span>Signed in as</span>
                <strong>{currentUser.username}</strong>
              </div>
              <div>
                <span>Last login</span>
                <strong>
                  {formatPreferenceDateTime(currentUser.lastLoginAt ?? '', preferences)}
                </strong>
              </div>
              <div>
                <span>Session scope</span>
                <strong>Current desktop session</strong>
              </div>
            </div>
            <div className="form-note">
              <Icon name="lock" size={17} />
              Other-session termination is not shown because this app does not
              persist multiple local sessions.
            </div>
            <div className="settings-actions">
              <button className="secondary-button" onClick={onLogout} type="button">
                {t('Logout')}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
