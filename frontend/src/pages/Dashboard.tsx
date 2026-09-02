import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import GlassCard from '@/components/GlassCard'
import { fetchCoins } from '@/api/client'

export default function Dashboard() {
  const [binanceOnly, setBinanceOnly] = useState(true)
  const [search, setSearch] = useState('')

  const { data: coins = [], isLoading, error } = useQuery({
    queryKey: ['coins', binanceOnly, search],
    queryFn: () => fetchCoins(binanceOnly, search),
    refetchInterval: 60000, // Refresh every minute
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Market Overview
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Real-time market prices from backend DB
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search coin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 rounded-[var(--radius-md)] text-xs glass text-[var(--text-primary)] focus:outline-none"
            style={{ background: 'var(--glass-fill)' }}
          />

          <button
            onClick={() => setBinanceOnly(!binanceOnly)}
            className="px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold glass transition-all"
            style={{
              color: binanceOnly ? 'var(--accent-up)' : 'var(--text-muted)',
              borderColor: binanceOnly ? 'var(--accent-up-dim)' : 'var(--glass-border)',
            }}
          >
            {binanceOnly ? 'Binance Only ✓' : 'All Coins'}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <GlassCard key={i}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[var(--glass-fill)] animate-pulse" />
                <div className="space-y-1">
                  <div className="h-3 w-16 rounded bg-[var(--glass-fill)] animate-pulse" />
                  <div className="h-2 w-10 rounded bg-[var(--glass-fill)] animate-pulse" />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {error && (
        <GlassCard className="text-center py-8">
          <p className="text-xs text-[var(--accent-down)]">
            Failed to fetch coin prices from backend. Check API connection.
          </p>
        </GlassCard>
      )}

      {!isLoading && !error && coins.length === 0 && (
        <GlassCard className="text-center py-12">
          <p className="text-sm font-medium text-[var(--text-secondary)]">No coins in database</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Backend price sync scheduled job will populate coins from CoinGecko.
          </p>
        </GlassCard>
      )}

      {!isLoading && !error && coins.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coins.map((coin) => {
            const isUp = (coin.price_change_percentage_24h ?? 0) >= 0
            return (
              <GlassCard key={coin.id} hoverable>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    {coin.image ? (
                      <img src={coin.image} alt={coin.name} className="w-7 h-7 rounded-full" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[var(--accent-brand-dim)] flex items-center justify-center text-xs font-bold">
                        {coin.symbol.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                        {coin.name}
                      </h3>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase">
                        {coin.symbol}
                      </span>
                    </div>
                  </div>
                  {coin.is_binance_listed && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-brand-dim)] text-[var(--accent-brand)] font-medium">
                      Binance
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-base font-bold text-[var(--text-primary)]">
                    {coin.current_price !== null ? `$${coin.current_price.toLocaleString()}` : '—'}
                  </span>
                  <span
                    className={`text-xs font-semibold ${isUp ? 'text-up' : 'text-down'}`}
                  >
                    {isUp ? '+' : ''}
                    {coin.price_change_percentage_24h !== null
                      ? `${coin.price_change_percentage_24h.toFixed(2)}%`
                      : '—'}
                  </span>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
