import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { I18nProvider } from './lib/i18n'
import { AuthPage } from './pages/AuthPage'
import { CalculatorPage } from './pages/CalculatorPage'
import { ControlDeskPage } from './pages/ControlDeskPage'
import { ControlRoomPage } from './pages/ControlRoomPage'
import { EmbedPage } from './pages/EmbedPage'
import { HomePage } from './pages/HomePage'
import { OrganisePage } from './pages/OrganisePage'
import { PrivacyPage } from './pages/PrivacyPage'
import { PublicPage } from './pages/PublicPage'
import { ResultsPage } from './pages/ResultsPage'

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/embed" element={<EmbedPage />} />
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="calculator" element={<CalculatorPage />} />
            <Route path="organise" element={<OrganisePage />} />
            <Route path="control-room" element={<ControlRoomPage />} />
            <Route path="control-desk" element={<ControlDeskPage />} />
            <Route path="public" element={<PublicPage />} />
            <Route path="results" element={<ResultsPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="auth" element={<AuthPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  )
}
