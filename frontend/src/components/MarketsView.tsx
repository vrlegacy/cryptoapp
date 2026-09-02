import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import CoinIcon from './CoinIcon'
import { fetchCoins, type CoinData } from '@/api/client'

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return '—'
  if (price >= 10000) return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (price >= 100) return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (price >= 1) return '$' + price.toFixed(4)
  if (price >= 0.001) return '$' + price.toFixed(5)
  return '$' + price.toFixed(7)
}

function ChangePill({ value }: { value: number | null }) {
  if (value === null || value === undefined) return <span className="text-xs text-white/30">—</span>
  const pos = value >= 0
  return (
    <span
      className="mono text-xs font-medium px-2 py-0.5 rounded-full"
      style={{
        color: pos ? '#4ade80' : '#f87171',
        background: pos ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
      }}
    >
      {pos ? '+' : ''}
      {value.toFixed(2)}%
    </span>
  )
}

type SortKey = 'marketCap' | 'price' | 'change24h' | 'volume24h'

export default function MarketsView() {
  const [binanceOnly, setBinanceOnly] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('marketCap')

  const { data: rawCoins = [], isLoading, error } = useQuery({
    queryKey: ['coins', binanceOnly, search],
    queryFn: () => fetchCoins(binanceOnly, search),
    refetchInterval: 60000,
  })

  // Client-side sorting
  const filtered = [...rawCoins].sort((a: CoinData, b: CoinData) => {
    if (sortBy === 'marketCap') return (b.market_cap ?? 0) - (a.market_cap ?? 0)
    if (sortBy === 'price') return (b.current_price ?? 0) - (a.current_price ?? 0)
    if (sortBy === 'change24h') return (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0)
    if (sortBy === 'volume24h') return (b.total_volume ?? 0) - (a.total_volume ?? 0)
    return 0
  })

  const sortLabels: Record<SortKey, string> = {
    marketCap: 'Mkt Cap',
    price: 'Price',
    change24h: '24h',
    volume24h: 'Volume',
  }

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Markets</h1>
          <p className="text-white/40 text-xs mt-0.5">
            {filtered.length} coins · live backend data
          </p>
        </div>
        <div
          className="rounded-full p-1 flex text-sm"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <button
            onClick={() => setBinanceOnly(true)}
            className="px-3 py-1.5 rounded-full transition-all text-xs font-medium cursor-pointer"
            style={{
              background: binanceOnly ? 'rgba(250,204,21,0.15)' : 'transparent',
              color: binanceOnly ? '#facc15' : 'rgba(255,255,255,0.4)',
            }}
          >
            Binance
          </button>
          <button
            onClick={() => setBinanceOnly(false)}
            className="px-3 py-1.5 rounded-full transition-all text-xs font-medium cursor-pointer"
            style={{
              background: !binanceOnly ? 'rgba(250,204,21,0.15)' : 'transparent',
              color: !binanceOnly ? '#facc15' : 'rgba(255,255,255,0.4)',
            }}
          >
            All
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div
        className="rounded-2xl flex items-center gap-3 px-4 py-3"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <svg
          className="w-4 h-4 flex-shrink-0"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search coins..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-white outline-none flex-1 text-sm"
          style={{ caretColor: '#6366f1' }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-white/30 hover:text-white/60 transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* Sort Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(Object.keys(sortLabels) as SortKey[]).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all cursor-pointer"
            style={{
              background: sortBy === s ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.04)',
              color: sortBy === s ? '#facc15' : 'rgba(255,255,255,0.4)',
              border: sortBy === s ? '1px solid rgba(250,204,21,0.35)' : '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {sortLabels[s]}
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="glass rounded-2xl p-4 flex items-center gap-3 animate-pulse"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <div className="w-9 h-9 rounded-full bg-white/10" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-20 bg-white/10 rounded" />
                <div className="h-3 w-32 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-12 glass rounded-2xl">
          <p className="text-xs text-red-400">Failed to load market data from backend API.</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="text-center py-16 glass rounded-2xl">
          <p className="text-sm font-semibold text-white/70">No coins found</p>
          <p className="text-xs text-white/40 mt-1">
            Background price sync job will populate market data into database.
          </p>
        </div>
      )}

      {/* Coins List */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((coin, i) => (
            <div
              key={coin.id}
              className="glass rounded-2xl p-3 flex items-center gap-3 hover:bg-white/[0.07] transition-colors cursor-pointer"
            >
              <span
                className="mono text-xs w-5 text-right flex-shrink-0"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                {i + 1}
              </span>

              <CoinIcon symbol={coin.symbol} image={coin.image} size={40} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-semibold text-sm uppercase">
                    {coin.symbol}
                  </span>
                  {!coin.is_binance_listed && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        background: 'rgba(245,158,11,0.15)',
                        color: '#fbbf24',
                        border: '1px solid rgba(245,158,11,0.3)',
                      }}
                    >
                      CG only
                    </span>
                  )}
                </div>
                <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {coin.name}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="mono text-white font-semibold text-sm">
                  {formatPrice(coin.current_price)}
                </p>
                <div className="mt-0.5">
                  <ChangePill value={coin.price_change_percentage_24h} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
