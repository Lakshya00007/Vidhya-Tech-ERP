import { useState, type FormEvent } from 'react'
import { AuthShell } from '../components/AuthShell'
import { Icon } from '../components/Icon'
import { getAuthErpApi, getErrorMessage } from '../lib/erpApi'
import type { AuthUser } from '../types'

interface LoginProps {
  onAuthenticated: (user: AuthUser) => void
}

export function Login({ onAuthenticated }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const user = await getAuthErpApi().login(username, password)
      setPassword('')
      onAuthenticated(user)
    } catch (loginError) {
      setError(getErrorMessage(loginError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Secure local access"
      title="Sign in to School ERP"
      description="Use your offline account to open the administration workspace."
    >
      {error && (
        <div className="inline-message inline-message--error auth-message">
          <Icon name="close" size={16} />
          <span>{error}</span>
        </div>
      )}
      <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
        <label className="form-field">
          <span>Username</span>
          <input
            autoComplete="username"
            autoFocus
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter username"
            required
            value={username}
          />
        </label>
        <label className="form-field">
          <span>Password</span>
          <input
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            required
            type="password"
            value={password}
          />
        </label>
        <button
          className="primary-button auth-submit"
          disabled={isSubmitting}
          type="submit"
        >
          <Icon name="user" size={17} />
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <p className="auth-footnote">
        Authentication is verified locally. No internet connection is required.
      </p>
    </AuthShell>
  )
}
