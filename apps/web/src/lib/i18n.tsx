import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type Lang = 'en' | 'hi'

const strings = {
  en: {
    brand: 'BRM Tracker Admin',
    home: 'Home',
    calculator: 'Calculator',
    organise: 'Events',
    controlRoom: 'HQ room',
    controlDesk: 'HQ desk',
    publicBoard: 'Public',
    results: 'Results',
    auth: 'Sign in',
    privacy: 'Privacy',
    demoStore: 'Local demo store',
    supabaseOn: 'Supabase connected',
    followSoon: 'Follow (email notify — coming soon)',
    sosDisclaimer:
      'This app supports safety awareness but does not replace emergency services (112) or the organiser’s procedures.',
    adminNav: 'Admin',
    fieldHint: 'Riders & volunteers use the Android app',
  },
  hi: {
    brand: 'BRM ट्रैकर एडमिन',
    home: 'होम',
    calculator: 'कैलकुलेटर',
    organise: 'इवेंट',
    controlRoom: 'HQ रूम',
    controlDesk: 'HQ डेस्क',
    publicBoard: 'सार्वजनिक',
    results: 'परिणाम',
    auth: 'साइन इन',
    privacy: 'गोपनीयता',
    demoStore: 'लोकल डेमो',
    supabaseOn: 'Supabase जुड़ा',
    followSoon: 'फॉलो (ईमेल — जल्द)',
    sosDisclaimer:
      'यह ऐप सुरक्षा में मदद करता है, लेकिन आपातकालीन सेवाओं (112) या आयोजक प्रक्रियाओं का विकल्प नहीं है।',
    adminNav: 'एडमिन',
    fieldHint: 'राइडर और स्वयंसेवक Android ऐप उपयोग करें',
  },
} as const

type Key = keyof (typeof strings)['en']

const I18nContext = createContext<{
  lang: Lang
  setLang: (l: Lang) => void
  t: (k: Key) => string
} | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(
    () => (localStorage.getItem('brmtracker.lang') as Lang) || 'en',
  )
  const set = useCallback((l: Lang) => {
    localStorage.setItem('brmtracker.lang', l)
    setLang(l)
  }, [])
  const t = useCallback((k: Key) => strings[lang][k] ?? strings.en[k], [lang])
  const value = useMemo(() => ({ lang, setLang: set, t }), [lang, set, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('I18nProvider missing')
  return ctx
}
