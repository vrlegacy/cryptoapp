import { useAuth0 } from '@auth0/auth0-react'
import { useEffect } from 'react'
import { config } from '@/config'

/**
 * Automatically syncs authenticated Auth0 user with FastAPI backend (POST /users/me).
 * First login auto-creates the user row in Supabase PostgreSQL keyed by Auth0 sub.
 */
export default function AuthSync() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0()

  useEffect(() => {
    if (!isAuthenticated) return

    async function syncUser() {
      try {
        const token = await getAccessTokenSilently()
        const res = await fetch(`${config.backendUrl}/users/me`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        if (res.ok) {
          const profile = await res.json()
          console.log('User profile synced with backend DB:', profile)
        }
      } catch (err) {
        console.error('Failed to sync user profile with backend:', err)
      }
    }

    syncUser()
  }, [isAuthenticated, getAccessTokenSilently])

  return null
}
