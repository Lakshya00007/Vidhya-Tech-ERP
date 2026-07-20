import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import { translateText } from '../../lib/i18n'
import type {
  AccentColor,
  AppPreference,
  AuthUser,
  DateFormatPreference,
  FontScale,
  PreferenceLanguage,
  ThemeMode,
  TimeFormatPreference,
  UpdatePreferenceInput,
} from '../../types'
import type { SettingsSectionProps } from '../Settings'

interface ThemeLanguageSettingsProps extends SettingsSectionProps {
  currentUser: AuthUser
  preferences: AppPreference
  onPreferencesChange: (preferences: AppPreference) => void
}

const themeModes: ThemeMode[] = ['Light', 'Dark', 'System']
const accents: AccentColor[] = ['Blue', 'Indigo', 'Green', 'Purple', 'Orange']
const languages: PreferenceLanguage[] = ['English', 'Hindi']
const fontScales: FontScale[] = ['Small', 'Normal', 'Large']
const dateFormats: DateFormatPreference[] = [
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD',
  'DD MMM YYYY',
]
const timeFormats: TimeFormatPreference[] = ['12 Hour', '24 Hour']

const preferenceInput = (preference: AppPreference): UpdatePreferenceInput => ({
  themeMode: preference.themeMode,
  accentColor: preference.accentColor,
  language: preference.language,
  compactSidebar: preference.compactSidebar,
  fontScale: preference.fontScale,
  dateFormat: preference.dateFormat,
  timeFormat: preference.timeFormat,
})

export function ThemeLanguageSettings({
  currentUser,
  onNotice,
  onPreferencesChange,
  preferences,
}: ThemeLanguageSettingsProps) {
  const [personal, setPersonal] = useState<AppPreference>(preferences)
  const [application, setApplication] = useState<AppPreference>(preferences)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingPersonal, setIsSavingPersonal] = useState(false)
  const [isSavingApplication, setIsSavingApplication] = useState(false)
  const canManageApplication =
    currentUser.role === 'Owner' || currentUser.role === 'Admin'
  const t = (text: string) => translateText(text, personal.language)

  useEffect(() => {
    let isCurrent = true
    Promise.resolve()
      .then(() => Promise.all([
        getErpApi().getAppPreferences(),
        getErpApi().getUserPreferences(),
      ]))
      .then(([applicationPreference, userPreference]) => {
        if (!isCurrent) return
        setApplication(applicationPreference)
        setPersonal(userPreference)
        onPreferencesChange(userPreference)
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => {
      isCurrent = false
    }
  }, [onNotice, onPreferencesChange])

  const updatePersonalDraft = (patch: UpdatePreferenceInput) => {
    setPersonal((current) => {
      const next = { ...current, ...patch }
      onPreferencesChange(next)
      return next
    })
  }

  const savePersonal = async (event: FormEvent) => {
    event.preventDefault()
    setIsSavingPersonal(true)
    try {
      const updated = await getErpApi().updateUserPreferences(
        preferenceInput(personal),
      )
      setPersonal(updated)
      onPreferencesChange(updated)
      onNotice({ type: 'success', message: 'Personal preferences saved.' })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSavingPersonal(false)
    }
  }

  const saveApplication = async (event: FormEvent) => {
    event.preventDefault()
    if (!canManageApplication) return
    setIsSavingApplication(true)
    try {
      const updated = await getErpApi().updateAppPreferences(
        preferenceInput(application),
      )
      setApplication(updated)
      onNotice({ type: 'success', message: 'Application defaults saved.' })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSavingApplication(false)
    }
  }

  const renderPreferenceFields = (
    value: AppPreference,
    onChange: (patch: UpdatePreferenceInput) => void,
    disabled = false,
  ) => (
    <div className="theme-preference-grid">
      <label className="form-field">
        <span>{t('Theme')}</span>
        <select
          disabled={disabled}
          value={value.themeMode}
          onChange={(event) =>
            onChange({ themeMode: event.target.value as ThemeMode })
          }
        >
          {themeModes.map((mode) => (
            <option key={mode} value={mode}>
              {t(mode)}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>{t('Language')}</span>
        <select
          disabled={disabled}
          value={value.language}
          onChange={(event) =>
            onChange({ language: event.target.value as PreferenceLanguage })
          }
        >
          {languages.map((language) => (
            <option key={language} value={language}>
              {t(language)}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Font Scale</span>
        <select
          disabled={disabled}
          value={value.fontScale}
          onChange={(event) =>
            onChange({ fontScale: event.target.value as FontScale })
          }
        >
          {fontScales.map((scale) => (
            <option key={scale} value={scale}>
              {scale}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Date Format</span>
        <select
          disabled={disabled}
          value={value.dateFormat}
          onChange={(event) =>
            onChange({
              dateFormat: event.target.value as DateFormatPreference,
            })
          }
        >
          {dateFormats.map((format) => (
            <option key={format} value={format}>
              {format}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Time Format</span>
        <select
          disabled={disabled}
          value={value.timeFormat}
          onChange={(event) =>
            onChange({
              timeFormat: event.target.value as TimeFormatPreference,
            })
          }
        >
          {timeFormats.map((format) => (
            <option key={format} value={format}>
              {format}
            </option>
          ))}
        </select>
      </label>
      <label className="import-checkbox import-checkbox--compact">
        <input
          checked={value.compactSidebar}
          disabled={disabled}
          type="checkbox"
          onChange={(event) =>
            onChange({ compactSidebar: event.target.checked })
          }
        />
        <span>
          <strong>Compact sidebar</strong>
        </span>
      </label>
      <div className="form-field form-field--full">
        <span>Accent</span>
        <div className="accent-picker">
          {accents.map((accent) => (
            <button
              className={`accent-swatch accent-swatch--${accent.toLowerCase()}${
                value.accentColor === accent ? ' accent-swatch--selected' : ''
              }`}
              disabled={disabled}
              key={accent}
              onClick={() => onChange({ accentColor: accent })}
              title={accent}
              type="button"
            />
          ))}
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return <section className="panel exam-loading-state">Loading preferences...</section>
  }

  return (
    <section className="theme-language-layout">
      <form className="panel" onSubmit={(event) => void savePersonal(event)}>
        <div className="panel-heading">
          <div>
            <h3>{t('Personal Preferences')}</h3>
            <p>Preview theme, language and display preferences before saving.</p>
          </div>
        </div>
        <div className="settings-fields">
          {renderPreferenceFields(personal, updatePersonalDraft)}
          <div className="theme-preview form-field--full">
            <div>
              <span className="theme-preview__bar" />
              <strong>{t('Theme & Language')}</strong>
              <p>
                {personal.language === 'Hindi'
                  ? 'मुख्य नेविगेशन और सामान्य कार्रवाइयां हिंदी में दिखेंगी।'
                  : 'Core navigation and common actions will use this language.'}
              </p>
              <button className="primary-button" type="button">
                <Icon name="check" size={15} />
                {t('Save')}
              </button>
            </div>
            <div>
              <span>{t('Search')}</span>
              <strong>{t('No records found')}</strong>
            </div>
          </div>
          <div className="settings-actions">
            <span>Personal preferences apply immediately and persist after saving.</span>
            <button className="primary-button" disabled={isSavingPersonal} type="submit">
              <Icon name="check" size={17} />
              {t('Save')}
            </button>
          </div>
        </div>
      </form>

      <form className="panel" onSubmit={(event) => void saveApplication(event)}>
        <div className="panel-heading">
          <div>
            <h3>{t('Application Defaults')}</h3>
            <p>Defaults apply to users who have not saved personal preferences.</p>
          </div>
        </div>
        <div className="settings-fields">
          {!canManageApplication && (
            <div className="form-note form-field--full">
              <Icon name="lock" size={17} />
              Application defaults are managed by Owner/Admin.
            </div>
          )}
          {renderPreferenceFields(
            application,
            (patch) => setApplication((current) => ({ ...current, ...patch })),
            !canManageApplication,
          )}
          {canManageApplication && (
            <div className="settings-actions">
              <button className="primary-button" disabled={isSavingApplication} type="submit">
                <Icon name="check" size={17} />
                {t('Save')}
              </button>
            </div>
          )}
        </div>
      </form>
    </section>
  )
}
