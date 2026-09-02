import GlassCard from '@/components/GlassCard'

export default function Gainers() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        Top Gainers
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        30-day and 1-year top performers — live in Sprint 3
      </p>
      <div className="flex gap-2 mb-6">
        {['30d', '1y'].map((p) => (
          <button
            key={p}
            className="px-4 py-1.5 rounded-full text-sm font-medium glass transition-all"
            style={{
              color: p === '30d' ? 'var(--accent-brand)' : 'var(--text-muted)',
              background: p === '30d' ? 'var(--accent-brand-dim)' : undefined,
            }}
          >
            {p}
          </button>
        ))}
      </div>
      <GlassCard padding="none">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-3 border-b last:border-b-0"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold w-5" style={{ color: 'var(--text-muted)' }}>
                {i + 1}
              </span>
              <div className="w-7 h-7 rounded-full bg-[var(--glass-fill)] animate-pulse" />
              <div>
                <div className="h-3 w-20 rounded bg-[var(--glass-fill)] animate-pulse mb-1" />
                <div className="h-2 w-10 rounded bg-[var(--glass-fill)] animate-pulse" />
              </div>
            </div>
            <div className="h-3 w-14 rounded bg-[var(--glass-fill)] animate-pulse" />
          </div>
        ))}
      </GlassCard>
    </div>
  )
}
