import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import GlassCard from '@/components/GlassCard'
import { fetchGainers } from '@/api/client'

export default function Gainers() {
  const [period, setPeriod] = useState<'30d' | '1y'>('30d')
  const [binanceOnly, setBinanceOnly] = useState(true)

  const { data: coins = [], isLoading, error } = useQuery({
    queryKey: ['gainers', period, binanceOnly],
    queryFn: () => fetchGainers(period, binanceOnly),
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Top Gainers
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Top performers over {period === '30d' ? '30 days' : '1 year'} from backend DB
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 rounded-[var(--radius-md)] glass">
            {(['30d', '1y'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-3 py-1 rounded-[var(--radius-sm)] text-xs font-semibold transition-all"
                style={{
                  color: period === p ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: period === p ? 'var(--accent-brand-dim)' : 'transparent',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => setBinanceOnly(!binanceOnly)}
            className="px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold glass transition-all"
            style={{
              color: binanceOnly ? 'var(--accent-up)' : 'var(--text-muted)',
            }}
          >
            {binanceOnly ? 'Binance Only ✓' : 'All Coins'}
          </button>
        </div>
      </div>

      {isLoading && (
        <GlassCard padding="none">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border-b border-[var(--glass-border)] animate-pulse">
              <div className="h-4 w-32 bg-[var(--glass-fill)] rounded" />
            </div>
          ))}
        </GlassCard>
      )}

      {error && (
        <GlassCard className="text-center py-8">
          <p className="text-xs text-[var(--accent-down)]">Failed to fetch gainers from backend.</p>
        </GlassCard>
      )}

      {!isLoading && !error && coins.length === 0 && (
        <GlassCard className="text-center py-12">
          <p className="text-sm font-medium text-[var(--text-secondary)]">No gainers available yet</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Data will populate as backend price synchronization runs.
          </p>
        </GlassCard>
      )}

      {!isLoading && !error && coins.length > 0 && (
        <GlassCard padding="none">
          {coins.map((coin, index) => (
            <div
              key={coin.id}
              className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 hover:bg-[var(--glass-fill)] transition-colors"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold w-6 text-center text-[var(--text-muted)]">
                  {index + 1}
                </span>
                {coin.image ? (
                  <img src={coin.image} alt={coin.name} className="w-7 h-7 rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[var(--accent-brand-dim)] flex items-center justify-center text-xs font-bold">
                    {coin.symbol.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">{coin.name}</h4>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase">
                    {coin.symbol}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-up">
                  +{(coin.price_change_percentage ?? 0).toFixed(2)}%
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  ${coin.current_price?.toLocaleString() ?? '—'}
                </p>
              </div>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  )
}
