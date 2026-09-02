import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import GlassCard from '@/components/GlassCard'
import { fetchTrending } from '@/api/client'

export default function Trending() {
  const [binanceOnly, setBinanceOnly] = useState(true)

  const { data: pureMovers = [], isLoading: pureLoading } = useQuery({
    queryKey: ['trending', 'pure', binanceOnly],
    queryFn: () => fetchTrending('pure', binanceOnly),
  })

  const { data: volumeMovers = [], isLoading: volLoading } = useQuery({
    queryKey: ['trending', 'volume_adjusted', binanceOnly],
    queryFn: () => fetchTrending('volume_adjusted', binanceOnly),
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Trending / Momentum
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Side-by-side comparison of raw price movement vs volume-backed momentum
          </p>
        </div>

        <button
          onClick={() => setBinanceOnly(!binanceOnly)}
          className="px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold glass transition-all self-start sm:self-auto"
          style={{
            color: binanceOnly ? 'var(--accent-up)' : 'var(--text-muted)',
          }}
        >
          {binanceOnly ? 'Binance Only ✓' : 'All Coins'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Section 1: Pure Movers */}
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center justify-between" style={{ color: 'var(--text-secondary)' }}>
            <span>Pure Price Movers</span>
            <span className="text-[10px] text-[var(--text-muted)]">24h % change</span>
          </h2>
          <GlassCard padding="none">
            {pureLoading ? (
              <div className="p-6 text-center text-xs text-[var(--text-muted)] animate-pulse">
                Loading pure movers...
              </div>
            ) : pureMovers.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                No trending data yet. Sync job running in background.
              </div>
            ) : (
              pureMovers.map((coin, i) => (
                <div
                  key={coin.id}
                  className="flex items-center justify-between px-4 py-3 border-b last:border-b-0"
                  style={{ borderColor: 'var(--glass-border)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold w-4 text-[var(--text-muted)]">{i + 1}</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{coin.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">{coin.symbol}</span>
                  </div>
                  <span className={`text-xs font-semibold ${(coin.price_change_percentage_24h ?? 0) >= 0 ? 'text-up' : 'text-down'}`}>
                    {(coin.price_change_percentage_24h ?? 0) >= 0 ? '+' : ''}
                    {coin.price_change_percentage_24h?.toFixed(2) ?? '—'}%
                  </span>
                </div>
              ))
            )}
          </GlassCard>
        </div>

        {/* Section 2: Volume-Backed Movers */}
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center justify-between" style={{ color: 'var(--text-secondary)' }}>
            <span>Volume-Backed Movers</span>
            <span className="text-[10px] text-[var(--text-muted)]">Score = %Change × log(Volume)</span>
          </h2>
          <GlassCard padding="none">
            {volLoading ? (
              <div className="p-6 text-center text-xs text-[var(--text-muted)] animate-pulse">
                Loading volume-backed movers...
              </div>
            ) : volumeMovers.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                No trending data yet. Sync job running in background.
              </div>
            ) : (
              volumeMovers.map((coin, i) => (
                <div
                  key={coin.id}
                  className="flex items-center justify-between px-4 py-3 border-b last:border-b-0"
                  style={{ borderColor: 'var(--glass-border)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold w-4 text-[var(--text-muted)]">{i + 1}</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{coin.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">{coin.symbol}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-semibold ${(coin.price_change_percentage_24h ?? 0) >= 0 ? 'text-up' : 'text-down'}`}>
                      {(coin.price_change_percentage_24h ?? 0) >= 0 ? '+' : ''}
                      {coin.price_change_percentage_24h?.toFixed(2) ?? '—'}%
                    </span>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Vol: ${coin.total_volume ? (coin.total_volume / 1e6).toFixed(1) + 'M' : '—'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
