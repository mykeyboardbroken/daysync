import { useState } from 'react'
import Icon from './Icon'

// Full-screen sign in / sign up. Shown before anything else when cloud accounts
// are enabled and nobody is signed in.
export default function AuthScreen({ onSignIn, onSignUp }) {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const isSignUp = mode === 'signup'

  // Client-side checks first, so people get instant feedback instead of a round trip.
  function validate() {
    if (isSignUp && username.trim().length < 2) return 'Pick a username (at least 2 characters).'
    if (!email.trim() || !email.includes('@')) return 'Enter a valid email address.'
    if (password.length < 8) return 'Password must be at least 8 characters.'
    if (isSignUp && password !== confirm) return "Those passwords don't match."
    return null
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    const msg = isSignUp
      ? await onSignUp(email.trim(), password, username.trim())
      : await onSignIn(email.trim(), password)
    setBusy(false)
    if (msg) {
      setError(msg)
    } else if (isSignUp) {
      // If the project has email confirmation on, there's no session yet.
      setNotice('Account created. If we sent you a confirmation email, click the link, then sign in.')
    }
  }

  function swap() {
    setMode(isSignUp ? 'signin' : 'signup')
    setError('')
    setNotice('')
    setConfirm('')
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-mark" aria-hidden="true">
          <Icon name="checkmark" size={26} />
        </div>
        <h1 className="auth-title">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth-sub">
          {isSignUp
            ? 'Your day, synced across every device you sign in on.'
            : 'Sign in to pick up where you left off.'}
        </p>

        {isSignUp && (
          <label className="auth-field">
            Username
            <input
              type="text"
              value={username}
              autoComplete="nickname"
              placeholder="What should we call you?"
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
        )}

        <label className="auth-field">
          Email
          <input
            type="email"
            value={email}
            autoComplete="email"
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="auth-field">
          Password
          <input
            type="password"
            value={password}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            placeholder={isSignUp ? 'At least 8 characters' : 'Your password'}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {isSignUp && (
          <label className="auth-field">
            Confirm password
            <input
              type="password"
              value={confirm}
              autoComplete="new-password"
              placeholder="Type it again"
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
        )}

        {error && <p className="auth-error">{error}</p>}
        {notice && <p className="auth-notice">{notice}</p>}

        <button type="submit" className="primary-btn auth-submit" disabled={busy}>
          {busy ? 'One moment…' : isSignUp ? 'Create account' : 'Sign in'}
        </button>

        <button type="button" className="auth-swap" onClick={swap}>
          {isSignUp ? 'Already have an account? Sign in' : "New here? Create an account"}
        </button>
      </form>
    </div>
  )
}
