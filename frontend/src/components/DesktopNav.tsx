import { NavLink } from 'react-router-dom'
import {
  ChartBarIcon,
  TrophyIcon,
  FireIcon,
  BellIcon,
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

      {/* Footer */}
      <div className="mt-auto px-3">
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Not financial advice. Data may be delayed.
        </p>
      </div>
    </aside>
  )
}
