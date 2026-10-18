import { useEffect, useState } from 'react'
import {
  getSessionUser,
  signInDemo,
  signInWithPassword,
  signOut,
  usingDemoStore,
} from '../lib/api'
import type { AuthUser } from '../lib/types'

export function AuthPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [email, setEmail] = useState('organiser@club.example')
  const [password, setPassword] = useState('demo-password')
  const [name, setName] = useState('Event Admin')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void getSessionUser().then(setUser)
  }, [])

  return (
    <div className="stack">
      <section>
        <h1>Organiser sign-in</h1>
        <p className="lead">
          {usingDemoStore
            ? 'Demo mode stores a local organiser session in this browser. Connect Supabase for real auth.'
            : 'Sign in with your Supabase email/password.'}
        </p>
      </section>

      <section className="panel stack">
        {user ? (
          <>
            <p>
              Signed in as <strong>{user.displayName}</strong> ({user.email})
            </p>
            <button
              type="button"
              className="secondary"
              onClick={async () => {
                await signOut()
                setUser(null)
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <label>
              Display name
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {!usingDemoStore && (
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            )}
            {error && <p className="danger">{error}</p>}
            <button
              type="button"
              onClick={async () => {
                setError(null)
                try {
                  const u = usingDemoStore
                    ? await signInDemo(email, name)
                    : await signInWithPassword(email, password)
                  setUser(u)
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Sign-in failed')
                }
              }}
            >
              Sign in
            </button>
          </>
        )}
      </section>
    </div>
  )
}
