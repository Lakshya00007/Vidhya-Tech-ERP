import { useState, type FormEvent } from 'react'
import { AuthShell } from '../components/AuthShell'
import { Icon } from '../components/Icon'
import { getAuthErpApi, getErrorMessage } from '../lib/erpApi'

interface CreateOwnerProps {
  onCreated: () => void
}

export function CreateOwner({ onCreated }: CreateOwnerProps) {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      await getAuthErpApi().createFirstOwner({
        name,
        username,
        email,
        password,
      })
      onCreated()
    } catch (setupError) {
      setError(getErrorMessage(setupError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="First-time setup"
      title="Create the Owner account"
      description="This first account controls users, security, backup and restore."
    >
      {error && (
        <div className="inline-message inline-message--error auth-message">
          <Icon name="close" size={16} />
          <span>{error}</span>
        </div>
      )}
      <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
        <div className="auth-form__row">
          <label className="form-field">
            <span>Name</span>
            <input
              autoFocus
              onChange={(event) => setName(event.target.value)}
              placeholder="Account holder name"
              required
              value={name}
            />
          </label>
          <label className="form-field">
            <span>Username</span>
            <input
              autoComplete="username"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Example: owner"
              required
              value={username}
            />
          </label>
        </div>
        <label className="form-field">
          <span>Email (optional)</span>
          <input
            onChange={(event) => setEmail(event.target.value)}
            placeholder="owner@school.edu"
            type="email"
            value={email}
          />
        </label>
        <div className="auth-form__row">
          <label className="form-field">
            <span>Password</span>
            <input
              autoComplete="new-password"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 8 characters"
              required
              type="password"
              value={password}
            />
          </label>
          <label className="form-field">
            <span>Confirm Password</span>
            <input
              autoComplete="new-password"
              minLength={8}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat password"
              required
              type="password"
              value={confirmPassword}
            />
          </label>
        </div>
        <button
          className="primary-button auth-submit"
          disabled={isSubmitting}
          type="submit"
        >
          <Icon name="check" size={17} />
          {isSubmitting ? 'Creating account...' : 'Create Owner Account'}
        </button>
      </form>
      <p className="auth-footnote">
        Passwords are salted and hashed in the Electron main process.
      </p>
    </AuthShell>
  )
}
