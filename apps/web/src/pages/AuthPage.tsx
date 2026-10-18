import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  DEMO_PASSWORD,
  listDemoQuickAccounts,
} from '../lib/auth'
import { useAuth } from '../lib/authContext'
import type { UserRole } from '../lib/types'

type Mode = 'signin' | 'signup'

export function AuthPage() {
  const { user, signIn, register, signOut, usingDemoStore } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: string } | null)?.from ?? defaultHomeFor(user?.role)

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('admin@club.example')
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [name, setName] = useState('Event Admin')
  const [role, setRole] = useState<UserRole>('admin')
  const [clubName, setClubName] = useState('Pune Randonneurs')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const demos = useMemo(() => listDemoQuickAccounts(), [])

  async function submit() {
    setError(null)
    setBusy(true)
    try {
      const next =
        mode === 'signin'
          ? await signIn(email, password)
          : await register({
              email,
              password,
              displayName: name,
              role,
              clubName,
            })
      const dest =
        from && from !== '/auth' ? from : defaultHomeFor(next.role)
      navigate(dest, { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-hero" aria-labelledby="auth-brand">
        <p className="eyebrow">Account</p>
        <h1 id="auth-brand">BRM Tracker</h1>
        <p className="lead">
          One login for club admins on the web, and for riders and volunteers in
          the Android app. Public follow pages stay open — no account needed.
        </p>
      </section>

      <section className="auth-panel stack">
        {user ? (
          <>
            <h2>Signed in</h2>
            <p>
              <strong>{user.displayName}</strong>
              <span className="muted"> · {user.email}</span>
            </p>
            <p className="role-chip" data-role={user.role}>
              {labelRole(user.role)}
              {user.clubName ? ` · ${user.clubName}` : ''}
            </p>
            <div className="actions">
              <Link className="button" to={defaultHomeFor(user.role)}>
                Continue
              </Link>
              <button
                type="button"
                className="secondary"
                onClick={async () => {
                  await signOut()
                }}
              >
                Sign out
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mode-toggle" role="tablist" aria-label="Auth mode">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
                className={mode === 'signin' ? '' : 'secondary'}
                onClick={() => setMode('signin')}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                className={mode === 'signup' ? '' : 'secondary'}
                onClick={() => setMode('signup')}
              >
                Create account
              </button>
            </div>

            <p className="muted">
              {usingDemoStore
                ? 'Demo mode: accounts stay in this browser. Password for seeded users is demo-password.'
                : 'Supabase email and password. Role comes from club membership when available.'}
            </p>

            {mode === 'signup' && (
              <>
                <label>
                  Display name
                  <input
                    value={name}
                    autoComplete="name"
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label>
                  Role
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    <option value="admin">Club admin (web HQ)</option>
                    <option value="volunteer">Control volunteer (field)</option>
                    <option value="rider">Rider</option>
                  </select>
                </label>
                {(role === 'admin' || role === 'owner') && (
                  <label>
                    Club name
                    <input
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                    />
                  </label>
                )}
              </>
            )}

            <label>
              Email
              <input
                type="email"
                value={email}
                autoComplete="username"
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error && <p className="danger">{error}</p>}

            <button type="button" disabled={busy} onClick={() => void submit()}>
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>

            {usingDemoStore && (
              <div className="demo-accounts stack">
                <h3>Quick demo accounts</h3>
                <div className="actions">
                  {demos.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setMode('signin')
                        setEmail(d.email)
                        setPassword(DEMO_PASSWORD)
                        setName(d.displayName)
                        setRole(d.role)
                      }}
                    >
                      {labelRole(d.role)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

function labelRole(role: UserRole): string {
  switch (role) {
    case 'owner':
      return 'Owner'
    case 'admin':
      return 'Admin'
    case 'volunteer':
      return 'Volunteer'
    case 'rider':
      return 'Rider'
    default:
      return 'Member'
  }
}

function defaultHomeFor(role?: UserRole): string {
  if (!role) return '/'
  if (role === 'volunteer') return '/control-desk'
  if (role === 'rider' || role === 'member') return '/public'
  return '/organise'
}
