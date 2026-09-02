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
  { to: '/',        label: 'Dashboard', Icon: ChartBarIcon, ActiveIcon: ChartBarSolid },
  { to: '/gainers', label: 'Gainers',   Icon: TrophyIcon,   ActiveIcon: TrophySolid },
  { to: '/trending',label: 'Trending',  Icon: FireIcon,     ActiveIcon: FireSolid },
  { to: '/alerts',  label: 'Alerts',    Icon: BellIcon,     ActiveIcon: BellSolid },
]

/**
 * Mobile bottom tab navigation — thumb-reachable, hidden on desktop (≥1024px).
 */
export default function BottomNav() {
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
      </ul>
    </nav>
  )
}
