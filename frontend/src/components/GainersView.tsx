import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import CoinIcon from './CoinIcon'
import { fetchGainers } from '@/api/client'

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return '—'
  if (price >= 10000) return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (price >= 1) return '$' + price.toFixed(2)
  return '$' + price.toFixed(4)
}

type Period = '30d' | '1y'

const PERIODS: { id: Period; label: string; desc: string }[] = [
  { id: '30d', label: '30D', desc: 'Last 30 days' },
  { id: '1y', label: '1Y', desc: 'Last 1 year' },
]

export default function GainersView() {
  const [period, setPeriod] = useState<Period>('30d')

  const { data: gainers = [], isLoading, error } = useQuery({
    queryKey: ['gainers', period],
    queryFn: () => fetchGainers(period, true),
  })

  const maxGain = gainers[0] ? Math.max(gainers[0].price_change_percentage ?? 1, 1) : 1
  const periodDesc = PERIODS.find((p) => p.id === period)?.desc ?? ''

  return (
    <div className="p-4 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Top Gainers</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Binance · {periodDesc} · live backend data
          </p>
        </div>
      </div>

      {/* Period Selector */}
      <div
        className="rounded-full p-1 flex gap-1 w-48"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className="flex-1 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
            style={{
              background: period === p.id ? 'rgba(250,204,21,0.18)' : 'transparent',
              color: period === p.id ? '#facc15' : 'rgba(255,255,255,0.38)',
              border: period === p.id ? '1px solid rgba(250,204,21,0.35)' : '1px solid transparent',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-4 animate-pulse">
              <div className="h-4 w-32 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12 glass rounded-2xl">
          <p className="text-xs text-red-400">Failed to load top gainers from backend.</p>
        </div>
      )}

      {!isLoading && !error && gainers.length === 0 && (
        <div className="text-center py-16 glass rounded-2xl">
          <p className="text-sm font-semibold text-white/70">No gainer data available yet</p>
          <p className="text-xs text-white/40 mt-1">
            Data will populate automatically as background price sync runs.
          </p>
        </div>
      )}

      {!isLoading && !error && gainers.length > 0 && (
        <div className="space-y-2">
          {gainers.map((coin, i) => {
            const change = coin.price_change_percentage ?? 0
            const isPos = change >= 0
            const barWidth = maxGain !== 0 ? Math.min(Math.abs(change / maxGain) * 100, 100) : 0

            return (
              <div
                key={coin.id}
                className="glass rounded-2xl p-4 relative overflow-hidden cursor-pointer transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
              >
                {/* Visual percentage rank bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 rounded-2xl"
                  style={{
                    width: `${barWidth}%`,
                    background:
                      i === 0
                        ? isPos
                          ? 'linear-gradient(90deg, rgba(250,204,21,0.12), transparent)'
                          : 'linear-gradient(90deg, rgba(248,113,113,0.1), transparent)'
                        : isPos
                        ? 'linear-gradient(90deg, rgba(74,222,128,0.06), transparent)'
                        : 'linear-gradient(90deg, rgba(248,113,113,0.06), transparent)',
                    transition: 'width 500ms ease',
                  }}
                />

                <div className="relative flex items-center gap-3">
                  <span
                    className="mono text-lg font-bold w-7 text-right flex-shrink-0"
                    style={{
                      color:
                        i === 0
                          ? '#facc15'
                          : i === 1
                          ? 'rgba(250,204,21,0.6)'
                          : i === 2
                          ? 'rgba(250,204,21,0.4)'
                          : 'rgba(255,255,255,0.18)',
                    }}
                  >
                    {i + 1}
                  </span>

                  <CoinIcon symbol={coin.symbol} image={coin.image} size={40} />

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold uppercase">{coin.symbol}</p>
                    <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>
                      {coin.name}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="mono font-bold text-xl" style={{ color: isPos ? '#4ade80' : '#f87171' }}>
                      {isPos ? '+' : ''}
                      {change.toFixed(change < 10 && change > -10 ? 2 : 1)}%
                    </p>
                    <p className="mono text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {formatPrice(coin.current_price)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-center text-xs pb-2" style={{ color: 'rgba(255,255,255,0.18)' }}>
        Real market data fetched via CoinGecko & backend DB. Past performance does not predict future results.
      </p>
    </div>
  )
}
