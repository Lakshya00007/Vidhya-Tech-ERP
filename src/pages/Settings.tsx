import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { getErpApi, getErrorMessage } from '../lib/erpApi'
import type { SaveSchoolSettingsInput } from '../types'

const defaultSettings: SaveSchoolSettingsInput = {
  schoolName: 'Vidhya Public School',
  address: '',
  phone: '',
  email: '',
  academicYear: '2026–2027',
  receiptPrefix: 'VSE-RC',
}

export function Settings() {
  const [form, setForm] = useState<SaveSchoolSettingsInput>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

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
          setError('')
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setError(getErrorMessage(loadError))
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
  }, [])

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
      setMessage('School settings saved locally.')
      setError('')
    } catch (saveError) {
      setError(getErrorMessage(saveError))
      setMessage('')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h2>Settings</h2>
          <p>Configure school profile and academic preferences.</p>
        </div>
      </section>

      {message && (
        <div className="inline-message">
          <Icon name="check" size={17} />
          <span>{message}</span>
          <button type="button" onClick={() => setMessage('')} aria-label="Dismiss message">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="inline-message inline-message--error">
          <Icon name="close" size={17} />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

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

        <div className="settings-side">
          <section className="panel settings-panel">
            <div className="panel-heading">
              <div>
                <h3>Academic Settings</h3>
                <p>Current working session</p>
              </div>
            </div>
            <div className="settings-fields settings-fields--single">
              <label className="form-field">
                <span>Academic Year</span>
                <select
                  disabled={isLoading}
                  value={form.academicYear}
                  onChange={(event) => setForm({ ...form, academicYear: event.target.value })}
                >
                  <option>2025–2026</option>
                  <option>2026–2027</option>
                  <option>2027–2028</option>
                </select>
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
            </div>
          </section>

          <section className="panel settings-panel">
            <div className="panel-heading">
              <div>
                <h3>Classes & Sections</h3>
                <p>Basic academic structure</p>
              </div>
              <button className="row-action row-action--add" type="button" aria-label="Add class">
                <Icon name="plus" size={17} />
              </button>
            </div>
            <div className="class-setup-list">
              {[
                ['Classes 1–5', 'Sections A, B'],
                ['Classes 6–8', 'Sections A, B, C'],
                ['Classes 9–10', 'Sections A, B'],
              ].map(([className, sections]) => (
                <div key={className}>
                  <span className="class-icon"><Icon name="building" size={17} /></span>
                  <div>
                    <strong>{className}</strong>
                    <span>{sections}</span>
                  </div>
                  <button type="button">Edit</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="settings-actions">
          <span>Changes are stored in the local SQLite database.</span>
          <button className="primary-button" disabled={isLoading || isSaving} type="submit">
            <Icon name="check" size={17} />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
