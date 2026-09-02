import GlassCard from '@/components/GlassCard'

export default function Trending() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        Trending
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        Two momentum views — live in Sprint 3
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        {['Pure Movers', 'Volume-Backed Movers'].map((title) => (
          <div key={title}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
              {title}
            </h2>
            <GlassCard padding="none">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 border-b last:border-b-0"
                  style={{ borderColor: 'var(--glass-border)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold w-4" style={{ color: 'var(--text-muted)' }}>
                      {i + 1}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-[var(--glass-fill)] animate-pulse" />
                    <div className="h-3 w-20 rounded bg-[var(--glass-fill)] animate-pulse" />
                  </div>
                  <div className="h-3 w-12 rounded bg-[var(--glass-fill)] animate-pulse" />
                </div>
              ))}
            </GlassCard>
          </div>
        ))}
      </div>
    </div>
  )
}
