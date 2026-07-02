import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import type { SaveSchoolSettingsInput } from '../../types'
import type { SettingsSectionProps } from '../Settings'

const defaultSettings: SaveSchoolSettingsInput = {
  schoolName: 'Vidhya Public School',
  address: '',
  phone: '',
  email: '',
  academicYear: '2026–2027',
  receiptPrefix: 'VSE-RC',
}

export function SchoolProfileSettings({ onNotice }: SettingsSectionProps) {
  const [form, setForm] = useState<SaveSchoolSettingsInput>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isCurrent = true

    Promise.resolve()
      .then(() => getErpApi().getSchoolSettings())
      .then((settings) => {
        if (isCurrent) {
          setForm({
            schoolName: settings.schoolName,
            address: settings.address,
            phone: settings.phone,
            email: settings.email,
            academicYear: settings.academicYear,
            receiptPrefix: settings.receiptPrefix,
          })
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [onNotice])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      const settings = await getErpApi().saveSchoolSettings(form)
      setForm({
        schoolName: settings.schoolName,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        academicYear: settings.academicYear,
        receiptPrefix: settings.receiptPrefix,
      })
      onNotice({ type: 'success', message: 'School settings saved locally.' })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="settings-layout" onSubmit={(event) => void handleSubmit(event)}>
      <section className="panel settings-panel">
        <div className="panel-heading">
          <div>
            <h3>School Profile</h3>
            <p>Details shown on receipts, reports and marksheets</p>
          </div>
        </div>
        <div className="profile-upload">
          <div className="school-logo-placeholder">
            <Icon name="school" size={30} />
          </div>
          <div>
            <strong>School Logo</strong>
            <span>Logo storage will be added in a later phase</span>
            <button type="button" className="text-button">Choose image</button>
          </div>
        </div>
        <div className="settings-fields">
          <label className="form-field form-field--full">
            <span>School Name</span>
            <input
              disabled={isLoading}
              required
              value={form.schoolName}
              onChange={(event) => setForm({ ...form, schoolName: event.target.value })}
            />
          </label>
          <label className="form-field form-field--full">
            <span>Address</span>
            <textarea
              disabled={isLoading}
              rows={3}
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
            />
          </label>
          <label className="form-field">
            <span>Phone</span>
            <input
              disabled={isLoading}
              type="tel"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </label>
          <label className="form-field">
            <span>Email</span>
            <input
              disabled={isLoading}
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="panel settings-panel">
        <div className="panel-heading">
          <div>
            <h3>Academic Settings</h3>
            <p>Current working session and receipt numbering</p>
          </div>
        </div>
        <div className="settings-fields settings-fields--single">
          <label className="form-field">
            <span>Academic Year</span>
            <input
              disabled={isLoading}
              placeholder="Example: 2026–2027"
              value={form.academicYear}
              onChange={(event) => setForm({ ...form, academicYear: event.target.value })}
            />
          </label>
          <label className="form-field">
            <span>Receipt Prefix</span>
            <input
              disabled={isLoading}
              value={form.receiptPrefix}
              onChange={(event) => setForm({ ...form, receiptPrefix: event.target.value })}
            />
            <small>Example: {form.receiptPrefix || 'VSE-RC'}-1001</small>
          </label>
          <div className="form-note">
            <Icon name="building" size={17} />
            The academic year saved here is used when creating fee structures.
          </div>
        </div>
      </section>

      <div className="settings-actions">
        <span>Changes are stored in the local SQLite database.</span>
        <button className="primary-button" disabled={isLoading || isSaving} type="submit">
          <Icon name="check" size={17} />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  )
}
