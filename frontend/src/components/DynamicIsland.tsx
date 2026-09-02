import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface IslandAlert {
  id: string
  coinName: string
  message: string
  type: 'up' | 'down'
  time: string
}

interface DynamicIslandProps {
  alerts?: IslandAlert[]
  summaryText?: string
}

/**
 * Apple-style Dynamic Island — the app's in-app notification center.
 * Collapsed: glanceable pill summary.
 * Expanded: full panel with recent triggered alerts.
 * Wired to live alert data in Sprint 5.
 */
export default function DynamicIsland({
  alerts = [],
  summaryText,
}: DynamicIslandProps) {
  const [expanded, setExpanded] = useState(false)

  const defaultSummary =
    alerts.length > 0
      ? `${alerts.length} alert${alerts.length > 1 ? 's' : ''} triggered`
      : 'No alerts'

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
      <AnimatePresence mode="wait">
        {!expanded ? (
          /* ── Collapsed pill ── */
          <motion.button
            key="collapsed"
            onClick={() => setExpanded(true)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              background: 'var(--island-bg)',
              border: '1px solid var(--island-border)',
              boxShadow: 'var(--island-shadow)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-island)] cursor-pointer"
            aria-label="Open notification center"
          >
            <BellIcon className="w-4 h-4 text-[var(--accent-brand)]" />
            <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
              {summaryText ?? defaultSummary}
            </span>
            {alerts.length > 0 && (
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: 'var(--accent-up)' }}
              />
            )}
          </motion.button>
        ) : (
          /* ── Expanded panel ── */
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.92, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -8 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            style={{
              background: 'var(--island-bg)',
              border: '1px solid var(--island-border)',
              boxShadow: 'var(--island-shadow)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
            className="w-80 rounded-[var(--radius-lg)] p-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BellIcon className="w-4 h-4 text-[var(--accent-brand)]" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  Notifications
                </span>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Close notifications"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Alert list */}
            {alerts.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-4">
                No alerts triggered yet
              </p>
            ) : (
              <ul className="space-y-2">
                {alerts.map((alert) => (
                  <li
                    key={alert.id}
                    className="flex items-start gap-3 rounded-[var(--radius-sm)] p-2"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <span
                      className="mt-0.5 w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background:
                          alert.type === 'up'
                            ? 'var(--accent-up)'
                            : 'var(--accent-down)',
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                        {alert.coinName}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {alert.message}
                      </p>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">
                      {alert.time}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
