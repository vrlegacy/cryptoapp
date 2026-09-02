import GlassCard from '@/components/GlassCard'
import { BellIcon } from '@heroicons/react/24/outline'

export default function Alerts() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        Price Alerts
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        Telegram and email notifications — live in Sprint 5
      </p>
      <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'var(--accent-brand-dim)' }}
        >
          <BellIcon className="w-8 h-8" style={{ color: 'var(--accent-brand)' }} />
        </div>
        <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          No alerts yet
        </h2>
        <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>
          Alert management UI will be built in Sprint 5. Telegram and email delivery, no SMS.
        </p>
      </GlassCard>
    </div>
  )
}
