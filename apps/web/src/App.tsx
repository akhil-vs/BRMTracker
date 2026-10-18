import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { AuthProvider } from './lib/authContext'
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
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/embed" element={<EmbedPage />} />
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="auth" element={<AuthPage />} />
              <Route path="public" element={<PublicPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
              <Route
                path="organise"
                element={
                  <RequireAuth roles={['owner', 'admin']}>
                    <OrganisePage />
                  </RequireAuth>
                }
              />
              <Route
                path="calculator"
                element={
                  <RequireAuth roles={['owner', 'admin', 'volunteer']}>
                    <CalculatorPage />
                  </RequireAuth>
                }
              />
              <Route
                path="control-room"
                element={
                  <RequireAuth roles={['owner', 'admin', 'volunteer']}>
                    <ControlRoomPage />
                  </RequireAuth>
                }
              />
              <Route
                path="control-desk"
                element={
                  <RequireAuth roles={['owner', 'admin', 'volunteer']}>
                    <ControlDeskPage />
                  </RequireAuth>
                }
              />
              <Route
                path="results"
                element={
                  <RequireAuth roles={['owner', 'admin']}>
                    <ResultsPage />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  )
}
