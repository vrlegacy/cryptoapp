import { NavLink } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import {
  ChartBarIcon,
  TrophyIcon,
  FireIcon,
  BellIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import {
  ChartBarIcon as ChartBarSolid,
  TrophyIcon as TrophySolid,
  FireIcon as FireSolid,
  BellIcon as BellSolid,
  UserIcon as UserSolid,
} from '@heroicons/react/24/solid'

const tabs = [
  { to: '/',        label: 'Dashboard', Icon: ChartBarIcon, ActiveIcon: ChartBarSolid },
  { to: '/gainers', label: 'Gainers',   Icon: TrophyIcon,   ActiveIcon: TrophySolid },
  { to: '/trending',label: 'Trending',  Icon: FireIcon,     ActiveIcon: FireSolid },
  { to: '/alerts',  label: 'Alerts',    Icon: BellIcon,     ActiveIcon: BellSolid },
]

/**
 * Mobile bottom tab navigation — thumb-reachable, hidden on desktop (≥1024px).
 * Includes user login/logout status toggle on mobile.
 */
export default function BottomNav() {
  const { isAuthenticated, loginWithRedirect, logout } = useAuth0()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
      style={{
        background: 'rgba(11, 14, 20, 0.90)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--glass-border)',
      }}
      aria-label="Main navigation"
    >
      <ul className="flex justify-around items-center h-16 px-2">
        {tabs.map(({ to, label, Icon, ActiveIcon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              id={`nav-${label.toLowerCase()}`}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-0.5 py-2 px-3 rounded-[var(--radius-md)] transition-all duration-200',
                  isActive
                    ? 'text-[var(--accent-brand)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <ActiveIcon className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}

        {/* Mobile Auth Button */}
        <li className="flex-1">
          {isAuthenticated ? (
            <button
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className="w-full flex flex-col items-center gap-0.5 py-2 px-3 rounded-[var(--radius-md)] text-[var(--accent-down)]"
              aria-label="Log Out"
            >
              <UserSolid className="w-6 h-6" />
              <span className="text-[10px] font-medium">Log Out</span>
            </button>
          ) : (
            <button
              onClick={() => loginWithRedirect()}
              className="w-full flex flex-col items-center gap-0.5 py-2 px-3 rounded-[var(--radius-md)] text-[var(--accent-brand)]"
              aria-label="Log In"
            >
              <UserIcon className="w-6 h-6" />
              <span className="text-[10px] font-medium">Log In</span>
            </button>
          )}
        </li>
      </ul>
    </nav>
  )
}
