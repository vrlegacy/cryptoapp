import { NavLink } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import {
  ChartBarIcon,
  TrophyIcon,
  FireIcon,
  BellIcon,
  ArrowRightStartOnRectangleIcon,
  ArrowLeftEndOnRectangleIcon,
} from '@heroicons/react/24/outline'
import {
  ChartBarIcon as ChartBarSolid,
  TrophyIcon as TrophySolid,
  FireIcon as FireSolid,
  BellIcon as BellSolid,
} from '@heroicons/react/24/solid'

const tabs = [
  { to: '/',         label: 'Dashboard', Icon: ChartBarIcon, ActiveIcon: ChartBarSolid },
  { to: '/gainers',  label: 'Gainers',   Icon: TrophyIcon,   ActiveIcon: TrophySolid },
  { to: '/trending', label: 'Trending',  Icon: FireIcon,     ActiveIcon: FireSolid },
  { to: '/alerts',   label: 'Alerts',    Icon: BellIcon,     ActiveIcon: BellSolid },
]

/**
 * Desktop sidebar navigation — visible only on lg+ screens.
 */
export default function DesktopNav() {
  const { isAuthenticated, user, loginWithRedirect, logout } = useAuth0()

  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 z-40 px-4 py-8"
      style={{
        background: 'rgba(11, 14, 20, 0.80)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--glass-border)',
      }}
    >
      {/* Logo */}
      <div className="mb-10 px-3">
        <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          cry<span style={{ color: 'var(--accent-brand)' }}>Daily</span>
        </span>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Crypto Tracker
        </p>
      </div>

      {/* Nav links */}
      <nav aria-label="Desktop navigation">
        <ul className="space-y-1">
          {tabs.map(({ to, label, Icon, ActiveIcon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                id={`desktop-nav-${label.toLowerCase()}`}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] transition-all duration-200 text-sm font-medium',
                    isActive
                      ? 'text-[var(--accent-brand)] bg-[var(--accent-brand-dim)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--glass-fill)]',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive ? <ActiveIcon className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Auth Section */}
      <div className="mt-auto px-3 space-y-3">
        {isAuthenticated ? (
          <div className="p-3 rounded-[var(--radius-md)] glass space-y-2">
            <div className="flex items-center gap-2">
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[var(--accent-brand-dim)] flex items-center justify-center text-[10px] font-bold text-[var(--accent-brand)]">
                  {user?.email?.slice(0, 2).toUpperCase() ?? 'U'}
                </div>
              )}
              <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                {user?.email ?? user?.name}
              </span>
            </div>
            <button
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold text-[var(--accent-down)] bg-[var(--accent-down-dim)] hover:opacity-90 transition-opacity"
            >
              <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
              Log Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => loginWithRedirect()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-xs font-semibold text-[var(--text-primary)] bg-[var(--accent-brand-dim)] hover:bg-[var(--glass-fill)] transition-colors border border-[var(--accent-brand)]"
          >
            <ArrowLeftEndOnRectangleIcon className="w-4 h-4 text-[var(--accent-brand)]" />
            Log In / Sign Up
          </button>
        )}

        <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
          Not financial advice. Data may be delayed.
        </p>
      </div>
    </aside>
  )
}
