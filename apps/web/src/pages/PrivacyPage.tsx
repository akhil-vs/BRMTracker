import { useI18n } from '../lib/i18n'

export function PrivacyPage() {
  const { t } = useI18n()

  return (
    <div className="stack">
      <section>
        <h1>Privacy &amp; safety</h1>
        <p className="lead">
          Draft consent wording for club review. Have a qualified person check
          this against India’s Digital Personal Data Protection Act, 2023 before
          a real event.
        </p>
      </section>

      <section className="panel stack">
        <h2>What we collect</h2>
        <ul>
          <li>Nickname, bib, optional emergency contact</li>
          <li>GPS points during the event (if you opt in)</li>
          <li>Check-in times (auto or volunteer)</li>
          <li>Follow emails if you request notifications</li>
        </ul>
        <h2>Your choices</h2>
        <ul>
          <li>
            <strong>Public</strong> — delayed map for everyone
          </li>
          <li>
            <strong>Followers only</strong> — only people you allow
          </li>
          <li>
            <strong>Organiser only</strong> — staff control room, not public map
          </li>
        </ul>
        <h2>Safeguards</h2>
        <ul>
          <li>Public positions delayed (default 15 minutes)</li>
          <li>Start/finish trim to reduce home-location exposure</li>
          <li>Fine GPS purged after retention window (default 30 days)</li>
          <li>Deletion on request via your club organiser</li>
        </ul>
        <h2>Safety disclaimer</h2>
        <p>{t('sosDisclaimer')}</p>
        <p className="muted">
          Retention SQL helper: <code>purge_old_positions(30)</code> in Supabase.
        </p>
      </section>
    </div>
  )
}
