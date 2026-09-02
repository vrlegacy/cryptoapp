import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import DynamicIsland from '@/components/DynamicIsland'
import AuthModal from '@/components/AuthModal'
import {
  ChartBarIcon,
  TrophyIcon,
  FireIcon,
  BellIcon,
  StarIcon,
} from '@heroicons/react/24/outline'
import {
  ChartBarIcon as ChartBarSolid,
  TrophyIcon as TrophySolid,
  FireIcon as FireSolid,
  BellIcon as BellSolid,
  StarIcon as StarSolid,
} from '@heroicons/react/24/solid'

const NAV = [
  { to: '/', label: 'Markets', Icon: ChartBarIcon, ActiveIcon: ChartBarSolid },
  { to: '/gainers', label: 'Gainers', Icon: TrophyIcon, ActiveIcon: TrophySolid },
  { to: '/trending', label: 'Trending', Icon: FireIcon, ActiveIcon: FireSolid },
  { to: '/alerts', label: 'Alerts', Icon: BellIcon, ActiveIcon: BellSolid },
  { to: '/watchlist', label: 'Watch', Icon: StarIcon, ActiveIcon: StarSolid },
]

function Avatar({
  userEmail,
  onClick,
}: {
  userEmail: string | null
  onClick: () => void
}) {
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : null

  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center rounded-full transition-all cursor-pointer"
      style={{
        width: 34,
        height: 34,
        background: userEmail
          ? 'linear-gradient(135deg, #facc15 0%, #f59e0b 100%)'
          : 'rgba(255,255,255,0.08)',
        border: userEmail
          ? '2px solid rgba(250,204,21,0.5)'
          : '2px solid rgba(255,255,255,0.12)',
        boxShadow: userEmail ? '0 0 12px rgba(250,204,21,0.3)' : 'none',
      }}
    >
      {userEmail ? (
        <span
          className="font-bold text-xs"
          style={{ color: '#000', fontFamily: 'Outfit, sans-serif' }}
        >
          {initials}
        </span>
      ) : (
        <span
          className="font-bold text-base leading-none"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          ?
        </span>
      )}
    </button>
  )
}

export default function AppShell({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAuth0()
  const [showAuth, setShowAuth] = useState(false)

  const userEmail = isAuthenticated ? (user?.email ?? user?.name ?? 'user@crydaily.app') : null

  return (
    <div
      className="size-full min-h-dvh flex flex-col relative overflow-x-hidden"
      style={{ background: '#000' }}
    >
      {/* subtle ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 20% 0%, rgba(250,204,21,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(250,204,21,0.03) 0%, transparent 50%)',
        }}
      />

      <DynamicIsland />

      {/* Top Avatar / Profile Trigger */}
      <div className="absolute top-3 right-4 z-40">
        <Avatar
          userEmail={userEmail}
          onClick={() => (isAuthenticated ? logout({ logoutParams: { returnTo: window.location.origin } }) : setShowAuth(true))}
        />
      </div>

      {/* Main Content Area */}
      <main
        className="flex-1 overflow-y-auto relative"
        style={{ paddingTop: '64px', paddingBottom: '80px' }}
      >
        {children}
      </main>

      {/* Bottom Nav Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(32px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all',
                ].join(' ')
              }
              style={({ isActive }) => ({
                color: isActive ? '#facc15' : 'rgba(255,255,255,0.3)',
                background: isActive ? 'rgba(250,204,21,0.1)' : 'transparent',
              })}
            >
              {({ isActive }) => (
                <>
                  {isActive ? <item.ActiveIcon className="w-5 h-5" /> : <item.Icon className="w-5 h-5" />}
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
