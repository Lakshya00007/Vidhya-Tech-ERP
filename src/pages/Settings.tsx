import { useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'

export function Settings() {
  const [schoolName, setSchoolName] = useState('Vidhya Public School')
  const [address, setAddress] = useState('24, Knowledge Park, Indore, Madhya Pradesh – 452010')
  const [phone, setPhone] = useState('+91 731 456 7890')
  const [email, setEmail] = useState('office@vidhyaschool.edu.in')
  const [academicYear, setAcademicYear] = useState('2026–2027')
  const [receiptPrefix, setReceiptPrefix] = useState('VSE-RC')
  const [message, setMessage] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setMessage('School settings saved locally.')
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

      <form className="settings-layout" onSubmit={handleSubmit}>
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
              <span>PNG or JPG, up to 2 MB</span>
              <button type="button" className="text-button">Choose image</button>
            </div>
          </div>
          <div className="settings-fields">
            <label className="form-field form-field--full">
              <span>School Name</span>
              <input required value={schoolName} onChange={(event) => setSchoolName(event.target.value)} />
            </label>
            <label className="form-field form-field--full">
              <span>Address</span>
              <textarea required rows={3} value={address} onChange={(event) => setAddress(event.target.value)} />
            </label>
            <label className="form-field">
              <span>Phone</span>
              <input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
            <label className="form-field">
              <span>Email</span>
              <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
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
                <select value={academicYear} onChange={(event) => setAcademicYear(event.target.value)}>
                  <option>2025–2026</option>
                  <option>2026–2027</option>
                  <option>2027–2028</option>
                </select>
              </label>
              <label className="form-field">
                <span>Receipt Prefix</span>
                <input value={receiptPrefix} onChange={(event) => setReceiptPrefix(event.target.value)} />
                <small>Example: {receiptPrefix}-1048</small>
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
          <span>Changes are stored locally on this device.</span>
          <button className="primary-button" type="submit">
            <Icon name="check" size={17} />
            Save Settings
          </button>
        </div>
      </form>
    </div>
  )
}
