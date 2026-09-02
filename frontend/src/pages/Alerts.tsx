import { useAuth0 } from '@auth0/auth0-react'
import { useQuery } from '@tanstack/react-query'
import GlassCard from '@/components/GlassCard'
import { BellIcon } from '@heroicons/react/24/outline'
import { fetchAlerts } from '@/api/client'

export default function Alerts() {
  const { getAccessTokenSilently } = useAuth0()

  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => fetchAlerts(() => getAccessTokenSilently()),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Price Alerts
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Telegram and Email alert triggers
          </p>
        </div>
      </div>

      {isLoading && (
        <GlassCard padding="none">
          <div className="p-8 text-center text-xs text-[var(--text-muted)] animate-pulse">
            Loading alerts...
          </div>
        </GlassCard>
      )}

      {error && (
        <GlassCard className="text-center py-8">
          <p className="text-xs text-[var(--accent-down)]">
            Failed to fetch user alerts from backend.
          </p>
        </GlassCard>
      )}

      {!isLoading && !error && alerts.length === 0 && (
        <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'var(--accent-brand-dim)' }}
          >
            <BellIcon className="w-7 h-7" style={{ color: 'var(--accent-brand)' }} />
          </div>
          <h2 className="text-sm font-semibold mb-1 text-[var(--text-primary)]">
            No price alerts created yet
          </h2>
          <p className="text-xs max-w-xs text-[var(--text-muted)]">
            Alert management UI is wired to backend `/alerts` CRUD API. Set target prices for Telegram or Email notifications.
          </p>
        </GlassCard>
      )}

      {!isLoading && !error && alerts.length > 0 && (
        <GlassCard padding="none">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between px-4 py-3 border-b last:border-b-0"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              <div>
                <span className="text-sm font-semibold text-[var(--text-primary)] uppercase">
                  {alert.coin_id}
                </span>
                <p className="text-xs text-[var(--text-muted)]">
                  Notify when {alert.direction} ${alert.target_price} via {alert.channel}
                </p>
              </div>

              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  alert.status === 'triggered'
                    ? 'bg-[var(--accent-up-dim)] text-up'
                    : 'bg-[var(--glass-fill)] text-[var(--text-muted)]'
                }`}
              >
                {alert.status}
              </span>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  )
}
