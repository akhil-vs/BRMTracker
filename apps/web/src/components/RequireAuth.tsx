import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import type { UserRole } from '../lib/types'

type Props = {
  children: React.ReactNode
  /** If set, user must have one of these roles */
  roles?: UserRole[]
}

export function RequireAuth({ children, roles }: Props) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="muted">Checking session…</p>
  }

  if (!user) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{ from: location.pathname, reason: 'signin' }}
      />
    )
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <section className="panel stack gate-panel">
        <h1>Access restricted</h1>
        <p className="lead">
          Signed in as <strong>{user.displayName}</strong> ({user.role}). This
          area needs {roles.join(' or ')} access.
        </p>
        <p className="muted">
          Riders and field volunteers use the Android app. Club admins sign in
          with an organiser account.
        </p>
        <Link className="button secondary" to="/auth">
          Switch account
        </Link>
      </section>
    )
  }

  return children
}
