import GlassCard from '@/components/GlassCard'

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
        Dashboard
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <GlassCard key={i} hoverable>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--glass-fill)] animate-pulse" />
                <div>
                  <div className="h-3 w-16 rounded bg-[var(--glass-fill)] animate-pulse mb-1" />
                  <div className="h-2 w-10 rounded bg-[var(--glass-fill)] animate-pulse" />
                </div>
              </div>
              <div className="h-3 w-12 rounded bg-[var(--glass-fill)] animate-pulse" />
            </div>
            <div className="h-4 w-24 rounded bg-[var(--glass-fill)] animate-pulse" />
          </GlassCard>
        ))}
      </div>
      <p className="mt-8 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
        Live prices load in Sprint 2 — design system active ✓
      </p>
    </div>
  )
}
