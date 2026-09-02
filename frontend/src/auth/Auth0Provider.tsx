import { Auth0Provider as Auth0ProviderLib } from '@auth0/auth0-react'
import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { config } from '@/config'

interface Auth0ProviderProps {
  children: ReactNode
}

export default function Auth0Provider({ children }: Auth0ProviderProps) {
  const navigate = useNavigate()

  // Only include audience if specified to avoid "Service not found" errors when API is not registered yet
  const authorizationParams: Record<string, string> = {
    redirect_uri: window.location.origin,
  }

  if (config.auth0Audience && config.auth0Audience.trim() !== '') {
    authorizationParams.audience = config.auth0Audience
  }

  return (
    <Auth0ProviderLib
      domain={config.auth0Domain}
      clientId={config.auth0ClientId}
      authorizationParams={authorizationParams}
      onRedirectCallback={(appState) => {
        navigate(appState?.returnTo ?? window.location.pathname)
      }}
    >
      {children}
    </Auth0ProviderLib>
  )
}
