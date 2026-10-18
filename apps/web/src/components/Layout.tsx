import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { useI18n } from '../lib/i18n'

export function Layout() {
  const { t, lang, setLang } = useI18n()
  const { user, usingDemoStore, canAccessAdmin, canAccessDesk, canAccessHq, signOut } =
    useAuth()

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          BRM Tracker
        </NavLink>
        <nav className="nav" aria-label="Primary">
          <NavLink to="/" end>
            {t('home')}
          </NavLink>
          <NavLink to="/public">{t('publicBoard')}</NavLink>
          {canAccessAdmin && (
            <>
              <NavLink to="/organise">{t('organise')}</NavLink>
              <NavLink to="/calculator">{t('calculator')}</NavLink>
              <NavLink to="/results">{t('results')}</NavLink>
            </>
          )}
          {canAccessHq && (
            <NavLink to="/control-room">{t('controlRoom')}</NavLink>
          )}
          {canAccessDesk && (
            <NavLink
              to="/control-desk"
              title="Laptop fallback — field volunteers use the app"
            >
              {t('controlDesk')}
            </NavLink>
          )}
          <NavLink to="/privacy">{t('privacy')}</NavLink>
          {!user && <NavLink to="/auth">{t('auth')}</NavLink>}
        </nav>
        <div className="actions topbar-actions">
          <select
            aria-label="Language"
            value={lang}
            onChange={(e) => setLang(e.target.value as 'en' | 'hi')}
          >
            <option value="en">EN</option>
            <option value="hi">HI</option>
          </select>
          <span className={`badge ${usingDemoStore ? '' : 'live'}`}>
            {usingDemoStore ? t('demoStore') : t('supabaseOn')}
          </span>
          {user && (
            <>
              <span className="user-chip" title={user.email}>
                {user.displayName}
              </span>
              <button
                type="button"
                className="secondary ghost"
                onClick={() => void signOut()}
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </header>
      {!user && (
        <p className="field-hint muted">{t('fieldHint')}</p>
      )}
      <Outlet />
    </div>
  )
}
