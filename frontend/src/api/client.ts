import { config } from '@/config'

export interface CoinData {
  id: string
  symbol: string
  name: string
  image?: string
  is_binance_listed: boolean
  current_price: number | null
  market_cap: number | null
  total_volume: number | null
  price_change_percentage_24h: number | null
  price_change_percentage_7d: number | null
  price_change_percentage_30d: number | null
  price_change_percentage_1y: number | null
  price_change_percentage?: number | null
  market_cap_rank: number | null
  last_updated?: string | null
}

export interface AlertData {
  id: string
  coin_id: string
  target_price: number
  direction: 'above' | 'below'
  channel: 'telegram' | 'email'
  status: 'active' | 'triggered' | 'cancelled'
  created_at: string
  triggered_at?: string | null
}

export async function fetchCoins(binanceOnly: boolean = true, search: string = ''): Promise<CoinData[]> {
  const url = new URL('/coins', config.backendUrl)
  url.searchParams.set('binance_only', String(binanceOnly))
  if (search) url.searchParams.set('search', search)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Failed to fetch coins: ${res.statusText}`)
  return res.json()
}

export async function forceSyncCoins(): Promise<{ status: string; message: string }> {
  const url = new URL('/coins/sync', config.backendUrl)
  const res = await fetch(url.toString(), { method: 'POST' })
  if (!res.ok) throw new Error(`Failed to sync coins: ${res.statusText}`)
  return res.json()
}

export async function fetchGainers(period: '30d' | '1y' = '30d', binanceOnly: boolean = true): Promise<CoinData[]> {
  const url = new URL('/coins/gainers', config.backendUrl)
  url.searchParams.set('period', period)
  url.searchParams.set('binance_only', String(binanceOnly))

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Failed to fetch gainers: ${res.statusText}`)
  return res.json()
}

export async function fetchTrending(method: 'pure' | 'volume_adjusted' = 'pure', binanceOnly: boolean = true): Promise<CoinData[]> {
  const url = new URL('/coins/trending', config.backendUrl)
  url.searchParams.set('method', method)
  url.searchParams.set('binance_only', String(binanceOnly))

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Failed to fetch trending: ${res.statusText}`)
  return res.json()
}

export async function fetchAlerts(getToken: () => Promise<string>): Promise<AlertData[]> {
  const token = await getToken()
  const res = await fetch(new URL('/alerts', config.backendUrl).toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.statusText}`)
  return res.json()
}

export async function createAlert(
  data: { coin_id: string; target_price: number; direction: 'above' | 'below'; channel: 'telegram' | 'email' },
  getToken: () => Promise<string>
): Promise<AlertData> {
  const token = await getToken()
  const res = await fetch(new URL('/alerts', config.backendUrl).toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Failed to create alert: ${res.statusText}`)
  return res.json()
}

export async function deleteAlert(alertId: string, getToken: () => Promise<string>): Promise<void> {
  const token = await getToken()
  const res = await fetch(new URL(`/alerts/${alertId}`, config.backendUrl).toString(), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to delete alert: ${res.statusText}`)
}

export async function fetchWatchlist(getToken: () => Promise<string>): Promise<CoinData[]> {
  const token = await getToken()
  const res = await fetch(new URL('/users/watchlist', config.backendUrl).toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    if (res.status === 401) return [] // if unauthorized, return empty for safety
    throw new Error(`Failed to fetch watchlist: ${res.statusText}`)
  }
  return res.json()
}

export async function toggleWatchlist(coinId: string, getToken: () => Promise<string>): Promise<{ action: 'added' | 'removed' }> {
  const token = await getToken()
  const res = await fetch(new URL(`/users/watchlist/${coinId}`, config.backendUrl).toString(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to toggle watchlist: ${res.statusText}`)
  return res.json()
}
