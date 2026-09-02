import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Auth0Provider from '@/auth/Auth0Provider'
import ProtectedRoute from '@/auth/ProtectedRoute'
import AppShell from '@/layouts/AppShell'
import Dashboard from '@/pages/Dashboard'
import Gainers from '@/pages/Gainers'
import Trending from '@/pages/Trending'
import Alerts from '@/pages/Alerts'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Auth0Provider>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/gainers" element={<Gainers />} />
              <Route path="/trending" element={<Trending />} />
              <Route
                path="/alerts"
                element={
                  <ProtectedRoute>
                    <Alerts />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </Auth0Provider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
