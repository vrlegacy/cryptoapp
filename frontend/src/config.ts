const isProd = typeof window !== 'undefined' && window.location.hostname.includes('pages.dev');
export const config = {
  auth0Domain: import.meta.env.VITE_AUTH0_DOMAIN ?? '',
  auth0ClientId: import.meta.env.VITE_AUTH0_CLIENT_ID ?? '',
  auth0Audience: import.meta.env.VITE_AUTH0_AUDIENCE ?? '',
  backendUrl: import.meta.env.VITE_BACKEND_URL || (isProd ? 'https://cryptoapp-i0ag.onrender.com' : ''),
}
