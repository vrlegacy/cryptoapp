import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

interface Props {
  onClose: () => void
}

export default function AuthModal({ onClose }: Props) {
  const { loginWithRedirect } = useAuth0()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Trigger Auth0 Universal Login flow (Sign In or Sign Up)
    loginWithRedirect({
      authorizationParams: {
        screen_hint: mode === 'signup' ? 'signup' : 'login',
        login_hint: email || undefined,
      },
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <div
        className="glass-strong rounded-3xl p-6 w-full max-w-sm space-y-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-lg leading-none transition-colors cursor-pointer"
          style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)' }}
        >
          ×
        </button>

        <div className="text-center pt-1">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{
              background: 'linear-gradient(135deg, rgba(250,204,21,0.3), rgba(245,158,11,0.2))',
              border: '1px solid rgba(250,204,21,0.4)',
              boxShadow: '0 0 24px rgba(250,204,21,0.15)',
            }}
          >
            <svg className="w-6 h-6" style={{ color: '#facc15' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h2 className="text-white font-bold text-xl tracking-tight">cryDaily</h2>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.38)' }}>
            {mode === 'signin' ? 'Welcome back' : 'Create your free account'}
          </p>
        </div>

        <div
          className="rounded-full p-1 flex"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer"
              style={{
                background: mode === m ? 'rgba(250,204,21,0.15)' : 'transparent',
                color: mode === m ? '#facc15' : 'rgba(255,255,255,0.38)',
                border: mode === m ? '1px solid rgba(250,204,21,0.3)' : '1px solid transparent',
              }}
            >
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div
              className="flex items-center rounded-xl px-4"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 bg-transparent py-3 text-white outline-none text-sm"
                style={{ caretColor: '#facc15' }}
              />
            </div>
          )}
          <div
            className="flex items-center rounded-xl px-4"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-transparent py-3 text-white outline-none text-sm"
              style={{ caretColor: '#facc15' }}
            />
          </div>
          <div
            className="flex items-center rounded-xl px-4"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-transparent py-3 text-white outline-none text-sm"
              style={{ caretColor: '#facc15' }}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-sm font-bold transition-all btn-yellow cursor-pointer"
          >
            {mode === 'signin' ? 'Sign In with Auth0' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs pb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
          By continuing you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
