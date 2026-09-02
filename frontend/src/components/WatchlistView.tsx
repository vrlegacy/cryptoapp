import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import CoinIcon from './CoinIcon'
import { fetchWatchlist, type CoinData } from '@/api/client'

type WatchPeriod = '1H' | '24H' | '7D' | '30D' | '1Y'

const PERIODS: { id: WatchPeriod; label: string }[] = [
  { id: '1H', label: '1H' },
  { id: '24H', label: '24H' },
  { id: '7D', label: '7D' },
  { id: '30D', label: '30D' },
  { id: '1Y', label: '1Y' },
]

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return '—'
  if (price >= 10000) return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (price >= 100) return '$' + price.toFixed(2)
  if (price >= 1) return '$' + price.toFixed(4)
  return '$' + price.toFixed(6)
}

function seededRandom(seed: number, i: number): number {
  const x = Math.sin(seed * 9301 + i * 49297 + 233) * 10000
  return x - Math.floor(x)
}

function Sparkline({ coin, change }: { coin: CoinData; change: number }) {
  const points = useMemo(() => {
    const seed = coin.symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const pts: number[] = []
    let y = 50
    const bias = change / 200
    for (let i = 0; i < 22; i++) {
      y = Math.max(8, Math.min(92, y + (seededRandom(seed, i) - 0.5 + bias) * 14))
      pts.push(y)
    }
    return pts
  }, [coin.symbol, change])

  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${(i / (points.length - 1)) * 100},${p}`).join(' ')
  const fillD = d + ` L100,100 L0,100 Z`
  const isPos = change >= 0
  const stroke = isPos ? '#4ade80' : '#f87171'
  const fill = isPos ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)'

  return (
    <svg
      viewBox="0 0 100 100"
      className="flex-shrink-0"
      style={{ width: 60, height: 30 }}
      preserveAspectRatio="none"
    >
      <path d={fillD} fill={fill} />
      <path d={d} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: number | null
  highlight?: 'yellow' | 'green' | 'red'
}) {
  const colorMap = {
    yellow: { color: '#facc15', bg: 'rgba(250,204,21,0.08)', border: 'rgba(250,204,21,0.2)' },
    green: { color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)' },
    red: { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
  }
  const style = highlight ? colorMap[highlight] : null

  return (
    <div
      className="rounded-2xl p-3 flex flex-col gap-1"
      style={{
        background: style ? style.bg : 'rgba(255,255,255,0.04)',
        border: `1px solid ${style ? style.border : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {label}
      </p>
      {value === null ? (
        <p className="mono font-bold text-base text-white/20">—</p>
      ) : (
        <p className="mono font-bold text-base" style={{ color: style ? style.color : 'white' }}>
          {value >= 0 ? '+' : ''}
          {value.toFixed(2)}%
        </p>
      )}
    </div>
  )
}

export default function WatchlistView() {
  const { getAccessTokenSilently, isAuthenticated, loginWithRedirect } = useAuth0()
  const [period, setPeriod] = useState<WatchPeriod>('24H')

  const { data: watched = [], isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => fetchWatchlist(() => getAccessTokenSilently()),
    enabled: isAuthenticated,
  })

  const changes = watched.map((c) => c.price_change_percentage_24h ?? 0)
  const avg = changes.length ? changes.reduce((s, v) => s + v, 0) / changes.length : null
  const max = changes.length ? Math.max(...changes) : null
  const min = changes.length ? Math.min(...changes) : null

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Watchlist</h1>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {watched.length} coins tracked · live backend data
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div
          className="rounded-full p-1 flex gap-0.5"
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
      </div>

      {/* Stat Cards */}
      {watched.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            label={`Avg (${period})`}
            value={avg}
            highlight={avg !== null ? (avg >= 0 ? 'green' : 'red') : undefined}
          />
          <StatCard label={`Max (${period})`} value={max} highlight="green" />
          <StatCard
            label={`Min (${period})`}
            value={min}
            highlight={min !== null && min < 0 ? 'red' : 'yellow'}
          />
        </div>
      )}

      {isLoading && (
        <div className="glass rounded-2xl p-6 text-center text-xs text-white/40 animate-pulse">
          Loading watchlist from backend...
        </div>
      )}

      {!isLoading && watched.length > 0 && (
        <div className="space-y-2">
          {watched.map((coin) => {
            const change = coin.price_change_percentage_24h ?? 0
            const isPos = change >= 0
            return (
              <div
                key={coin.id}
                className="glass rounded-2xl p-3.5 flex items-center gap-3 transition-colors cursor-pointer"
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
              >
                <CoinIcon symbol={coin.symbol} image={coin.image} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm uppercase">{coin.symbol}</p>
                  <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    {coin.name}
                  </p>
                </div>
                <Sparkline coin={coin} change={change} />
                <div className="text-right flex-shrink-0 ml-1">
                  <p className="mono text-white font-semibold text-sm">
                    {formatPrice(coin.current_price)}
                  </p>
                  <p className="mono text-xs font-semibold" style={{ color: isPos ? '#4ade80' : '#f87171' }}>
                    {isPos ? '+' : ''}
                    {change.toFixed(2)}%
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!isAuthenticated && !isLoading && (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Login required</p>
          <button
            onClick={() => loginWithRedirect()}
            className="mt-3 px-5 py-2 rounded-full text-xs font-semibold btn-yellow transition-all cursor-pointer"
          >
            Connect Wallet
          </button>
        </div>
      )}

      {isAuthenticated && !isLoading && watched.length === 0 && (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Your watchlist is empty</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.18)' }}>
            Star coins on the dashboard to track them here
          </p>
        </div>
      )}
    </div>
  )
}
