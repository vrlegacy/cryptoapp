import { Outlet } from 'react-router-dom'
import BottomNav from '@/components/BottomNav'
import DynamicIsland from '@/components/DynamicIsland'
import DesktopNav from '@/components/DesktopNav'

/**
 * App shell — wraps all pages.
 *
 * Mobile (< 1024px):
 *   DynamicIsland (fixed top) → single-column content → BottomNav (fixed bottom)
 *
 * Desktop (≥ 1024px):
 *   DynamicIsland (fixed top-center) → DesktopNav (fixed left sidebar) → two-pane content area
 */
export default function AppShell() {
  return (
    <div className="min-h-dvh flex flex-col lg:flex-row" style={{ background: 'var(--bg-base)' }}>
      {/* Dynamic Island — always visible, centered at top */}
      <DynamicIsland />

      {/* Desktop sidebar nav — hidden on mobile */}
      <DesktopNav />

      {/* Main content */}
      <main
        className={[
          // Mobile: full width, padding for island + bottom nav
          'flex-1 px-4 pt-20 pb-24',
          // Desktop: offset for sidebar, extra top padding for island
          'lg:ml-64 lg:px-8 lg:pt-24 lg:pb-8',
        ].join(' ')}
      >
        <Outlet />
      </main>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  )
}
