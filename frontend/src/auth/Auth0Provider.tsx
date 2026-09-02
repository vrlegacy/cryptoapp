import { Auth0Provider as Auth0ProviderLib } from '@auth0/auth0-react'
import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface Auth0ProviderProps {
  children: ReactNode
}

export default function Auth0Provider({ children }: Auth0ProviderProps) {
  const navigate = useNavigate()

  const domain = import.meta.env.VITE_AUTH0_DOMAIN
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE

  return (
    <Auth0ProviderLib
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience,
      }}
      onRedirectCallback={(appState) => {
        navigate(appState?.returnTo ?? window.location.pathname)
      }}
    >
      {children}
    </Auth0ProviderLib>
  )
}
