import { NavLink, Outlet } from 'react-router-dom'
import { usingDemoStore } from '../lib/api'
import { useI18n } from '../lib/i18n'

export function Layout() {
  const { t, lang, setLang } = useI18n()

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          {t('brand')}
        </NavLink>
        <nav className="nav" aria-label="Admin">
          <NavLink to="/" end>
            {t('home')}
          </NavLink>
          <NavLink to="/auth">{t('auth')}</NavLink>
          <NavLink to="/organise">{t('organise')}</NavLink>
          <NavLink to="/calculator">{t('calculator')}</NavLink>
          <NavLink to="/control-room">{t('controlRoom')}</NavLink>
          <NavLink to="/results">{t('results')}</NavLink>
          <NavLink to="/public">{t('publicBoard')}</NavLink>
          <NavLink to="/privacy">{t('privacy')}</NavLink>
          <NavLink to="/control-desk" title="Laptop fallback — field volunteers use the app">
            {t('controlDesk')}
          </NavLink>
        </nav>
        <div className="actions">
          <select
            aria-label="Language"
            value={lang}
            onChange={(e) => setLang(e.target.value as 'en' | 'hi')}
            style={{ width: 'auto' }}
          >
            <option value="en">EN</option>
            <option value="hi">HI</option>
          </select>
          <span className={`badge ${usingDemoStore ? '' : 'live'}`}>
            {usingDemoStore ? t('demoStore') : t('supabaseOn')}
          </span>
        </div>
      </header>
      <p className="muted" style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
        {t('fieldHint')}
      </p>
      <Outlet />
    </div>
  )
}
