import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import CoinIcon from './CoinIcon'
import { fetchTrending, type CoinData } from '@/api/client'

export default function TrendingView() {
  const [activeNewsIndex, setActiveNewsIndex] = useState(0)

  const { data: byPrice = [], isLoading: loadingPrice } = useQuery({
    queryKey: ['trending', 'pure'],
    queryFn: () => fetchTrending('pure', true),
  })

  const { data: byVolume = [], isLoading: loadingVolume } = useQuery({
    queryKey: ['trending', 'volume_adjusted'],
    queryFn: () => fetchTrending('volume_adjusted', true),
  })

  // Detect coins present in BOTH price momentum and volume surge lists
  const volumeSet = new Set(byVolume.map((v) => v.id))
  const convergent = new Set(byPrice.filter((c) => volumeSet.has(c.id)).map((c) => c.id))

  const trendingNewsCoins = byPrice.slice(0, 5)
  const currentNewsCoin: CoinData | undefined = trendingNewsCoins[activeNewsIndex]

  return (
    <div className="p-4 space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Trending Now</h1>
        <p className="text-white/40 text-xs mt-0.5">
          Two signals, side by side — price momentum vs volume-backed surge
        </p>
      </div>

      <div
        className="rounded-3xl p-4"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div
            className="text-center py-1.5 rounded-xl text-xs font-semibold"
            style={{
              background: 'rgba(99,102,241,0.15)',
              color: '#a5b4fc',
              border: '1px solid rgba(99,102,241,0.3)',
            }}
          >
            Price Momentum
          </div>
          <div
            className="text-center py-1.5 rounded-xl text-xs font-semibold"
            style={{
              background: 'rgba(34,211,238,0.12)',
              color: '#67e8f9',
              border: '1px solid rgba(34,211,238,0.25)',
            }}
          >
            Volume Surge
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Price Momentum Column */}
          <div className="space-y-1.5">
            {loadingPrice ? (
              <div className="text-xs text-white/30 text-center py-4 animate-pulse">Loading...</div>
            ) : (
              byPrice.slice(0, 8).map((coin, i) => {
                const isHot = convergent.has(coin.id)
                const change = coin.price_change_percentage_24h ?? 0
                return (
                  <div
                    key={coin.id}
                    className="flex items-center gap-2 p-2 rounded-xl transition-all"
                    style={{
                      background: isHot ? 'rgba(255,255,255,0.07)' : 'transparent',
                      border: isHot ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                    }}
                  >
                    <span className="mono text-xs w-4 text-right flex-shrink-0 text-white/30">
                      {i + 1}
                    </span>
                    <CoinIcon symbol={coin.symbol} image={coin.image} size={22} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate uppercase">{coin.symbol}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="mono text-xs font-semibold" style={{ color: '#34d399' }}>
                        +{change.toFixed(1)}%
                      </span>
                      {isHot && (
                        <span className="block text-[9px]" style={{ color: '#fbbf24' }}>
                          ⚡ both
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Volume Surge Column */}
          <div className="space-y-1.5">
            {loadingVolume ? (
              <div className="text-xs text-white/30 text-center py-4 animate-pulse">Loading...</div>
            ) : (
              byVolume.slice(0, 8).map((coin, i) => {
                const isHot = convergent.has(coin.id)
                const volM = coin.total_volume ? (coin.total_volume / 1e6).toFixed(1) : '—'
                return (
                  <div
                    key={coin.id}
                    className="flex items-center gap-2 p-2 rounded-xl transition-all"
                    style={{
                      background: isHot ? 'rgba(255,255,255,0.07)' : 'transparent',
                      border: isHot ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                    }}
                  >
                    <span className="mono text-xs w-4 text-right flex-shrink-0 text-white/30">
                      {i + 1}
                    </span>
                    <CoinIcon symbol={coin.symbol} image={coin.image} size={22} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate uppercase">{coin.symbol}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="mono text-xs font-semibold" style={{ color: '#67e8f9' }}>
                        ${volM}M
                      </span>
                      {isHot && (
                        <span className="block text-[9px]" style={{ color: '#fbbf24' }}>
                          ⚡ both
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div
          className="mt-4 pt-3 flex items-start gap-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span style={{ color: '#fbbf24', fontSize: 13 }}>⚡</span>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Coins appearing in both lists have price momentum backed by high volume — a stronger signal than price movement alone.
          </p>
        </div>
      </div>

      {/* Why Trending Section */}
      {currentNewsCoin && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-white font-semibold text-sm">Why Trending</h2>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{
                background: 'rgba(245,158,11,0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245,158,11,0.25)',
              }}
            >
              best-effort
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {trendingNewsCoins.map((coin, i) => (
              <button
                key={coin.id}
                onClick={() => setActiveNewsIndex(i)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs whitespace-nowrap flex-shrink-0 transition-all font-medium cursor-pointer"
                style={{
                  background: activeNewsIndex === i ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                  color: activeNewsIndex === i ? 'white' : 'rgba(255,255,255,0.45)',
                  border: activeNewsIndex === i ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <CoinIcon symbol={coin.symbol} image={coin.image} size={16} />
                <span className="uppercase">{coin.symbol}</span>
              </button>
            ))}
          </div>

          <div className="glass rounded-2xl p-4 space-y-3 mt-2">
            <div className="flex items-center gap-3">
              <CoinIcon symbol={currentNewsCoin.symbol} image={currentNewsCoin.image} size={44} />
              <div>
                <p className="text-white font-bold text-base">{currentNewsCoin.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="mono text-sm font-semibold" style={{ color: '#34d399' }}>
                    +{(currentNewsCoin.price_change_percentage_24h ?? 0).toFixed(2)}%
                  </span>
                  <span className="text-xs text-white/35">24h</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span
                className="text-[10px] px-2 py-1 rounded-lg font-semibold flex-shrink-0 mt-0.5"
                style={{
                  background: 'rgba(245,158,11,0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245,158,11,0.25)',
                }}
              >
                Likely reason
              </span>
              <p className="text-sm leading-relaxed text-white/70">
                Strong 24h market momentum with total volume exceeding ${( (currentNewsCoin.total_volume ?? 0) / 1e6 ).toFixed(1)}M. News sentiment analysis added in Sprint 4.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
