import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Auth0Provider from '@/auth/Auth0Provider'
import ProtectedRoute from '@/auth/ProtectedRoute'
import AppShell from '@/layouts/AppShell'
import Dashboard from '@/pages/Dashboard'
import Gainers from '@/pages/Gainers'
import Trending from '@/pages/Trending'
import Alerts from '@/pages/Alerts'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Auth0Provider>
        <Routes>
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/gainers" element={<Gainers />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/alerts" element={<Alerts />} />
          </Route>
        </Routes>
      </Auth0Provider>
    </BrowserRouter>
  )
}
