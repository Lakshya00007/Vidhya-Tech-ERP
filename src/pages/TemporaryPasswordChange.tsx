import { useState, type FormEvent } from 'react'
import { AuthShell } from '../components/AuthShell'
import { Icon } from '../components/Icon'
import { getAuthErpApi, getErrorMessage } from '../lib/erpApi'
import type { AuthUser } from '../types'

interface TemporaryPasswordChangeProps {
  currentUser: AuthUser
  onChanged: (user: AuthUser) => void
  onLogout: () => void
}

export function TemporaryPasswordChange({
  currentUser,
  onChanged,
  onLogout,
}: TemporaryPasswordChangeProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      const user = await getAuthErpApi().changeTemporaryPassword({
        currentPassword,
        newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onChanged(user)
    } catch (changeError) {
      setError(getErrorMessage(changeError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Password update required"
      title="Create a private password"
      description={`Before opening the ERP, ${currentUser.name} must replace the temporary password.`}
    >
      {error && (
        <div className="inline-message inline-message--error auth-message">
          <Icon name="close" size={16} />
          <span>{error}</span>
        </div>
      )}
      <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
        <label className="form-field">
          <span>Current Temporary Password</span>
          <input
            autoComplete="current-password"
            autoFocus
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            type="password"
            value={currentPassword}
          />
        </label>
        <label className="form-field">
          <span>New Password</span>
          <input
            autoComplete="new-password"
            minLength={8}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            type="password"
            value={newPassword}
          />
        </label>
        <label className="form-field">
          <span>Confirm New Password</span>
          <input
            autoComplete="new-password"
            minLength={8}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type="password"
            value={confirmPassword}
          />
        </label>
        <button
          className="primary-button auth-submit"
          disabled={isSubmitting}
          type="submit"
        >
          <Icon name="lock" size={17} />
          {isSubmitting ? 'Updating...' : 'Update Password'}
        </button>
        <button
          className="secondary-button auth-submit"
          onClick={onLogout}
          type="button"
        >
          Log out
        </button>
      </form>
    </AuthShell>
  )
}
