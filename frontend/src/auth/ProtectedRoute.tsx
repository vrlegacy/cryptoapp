import { useAuth0 } from '@auth0/auth0-react'
import { type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Redirects unauthenticated users to Auth0 login.
 * Preserves the intended path in appState for post-login redirect.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent-brand)' }}
        />
      </div>
    )
  }

  if (!isAuthenticated) {
    loginWithRedirect({ appState: { returnTo: location.pathname } })
    return null
  }

  return <>{children}</>
}
