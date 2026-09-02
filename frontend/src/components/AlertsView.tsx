import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import CoinIcon from './CoinIcon'
import { fetchAlerts, createAlert, deleteAlert, type AlertData } from '@/api/client'

function formatPrice(p: number): string {
  if (p >= 1000) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (p >= 1) return '$' + p.toFixed(2)
  return '$' + p.toFixed(5)
}

interface NotifService {
  id: 'telegram' | 'email'
  label: string
  description: string
  color: string
  glowColor: string
  icon: React.ReactNode
}

const SERVICES: NotifService[] = [
  {
    id: 'telegram',
    label: 'Telegram',
    description: 'Instant push via your Telegram bot',
    color: '#38bdf8',
    glowColor: 'rgba(14,165,233,0.2)',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.94 8.26l-2.02 9.52c-.15.68-.54.84-1.09.52l-3-2.21-1.45 1.39c-.16.16-.29.29-.6.29l.21-3.06 5.49-4.96c.24-.21-.05-.33-.37-.12L6.33 14.46 3.36 13.5c-.65-.2-.66-.65.14-.96l11.63-4.48c.54-.2 1.02.13.81.2z" />
      </svg>
    ),
  },
  {
    id: 'email',
    label: 'Email',
    description: 'Alert emails to your inbox',
    color: '#f87171',
    glowColor: 'rgba(239,68,68,0.18)',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
      </svg>
    ),
  },
]

export default function AlertsView() {
  const { getAccessTokenSilently, isAuthenticated, loginWithRedirect } = useAuth0()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [connected, setConnected] = useState<Record<string, boolean>>({
    telegram: false,
    email: false,
  })

  // Form state
  const [coinId, setCoinId] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [direction, setDirection] = useState<'above' | 'below'>('above')
  const [channel, setChannel] = useState<'telegram' | 'email'>('telegram')

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => fetchAlerts(() => getAccessTokenSilently()),
    enabled: isAuthenticated,
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => createAlert(data, () => getAccessTokenSilently()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      setShowForm(false)
      setCoinId('')
      setTargetPrice('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAlert(id, () => getAccessTokenSilently()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  const activeAlerts = alerts.filter((a: AlertData) => a.status === 'active')
  const triggeredAlerts = alerts.filter((a: AlertData) => a.status === 'triggered')

  function toggleConnect(svcId: string) {
    if (!isAuthenticated) return loginWithRedirect()
    setConnected((prev) => ({ ...prev, [svcId]: !prev[svcId] }))
  }

  function handleCreateAlert(e: React.FormEvent) {
    e.preventDefault()
    if (!isAuthenticated) return loginWithRedirect()
    if (!coinId || !targetPrice) return

    createMutation.mutate({
      coin_id: coinId.toLowerCase().trim(),
      target_price: parseFloat(targetPrice),
      direction,
      channel,
    })
  }

  return (
    <div className="p-4 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Price Alerts</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {activeAlerts.length} active · {triggeredAlerts.length} triggered
          </p>
        </div>
        <button
          onClick={() => {
            if (!isAuthenticated) return loginWithRedirect()
            setShowForm((s) => !s)
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all btn-yellow cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={showForm ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'} />
          </svg>
          {showForm ? 'Cancel' : 'New Alert'}
        </button>
      </div>

      {/* Notification Services */}
      <div className="space-y-2">
        {SERVICES.map((svc) => {
          const isConnected = connected[svc.id]
          return (
            <div
              key={svc.id}
              className="rounded-2xl p-4 flex items-center gap-3 transition-all"
              style={{
                background: isConnected ? `${svc.glowColor}` : 'rgba(255,255,255,0.03)',
                border: isConnected ? `1px solid ${svc.color}44` : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: isConnected ? `${svc.color}30` : 'rgba(255,255,255,0.07)',
                  color: isConnected ? svc.color : 'rgba(255,255,255,0.4)',
                }}
              >
                {svc.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: isConnected ? 'white' : 'rgba(255,255,255,0.7)' }}>
                    {svc.label}
                  </p>
                  {isConnected && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{
                        background: 'rgba(52,211,153,0.15)',
                        color: '#4ade80',
                        border: '1px solid rgba(52,211,153,0.25)',
                      }}
                    >
                      ✓ connected
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {svc.description}
                </p>
              </div>
              <button
                onClick={() => toggleConnect(svc.id)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex-shrink-0 cursor-pointer"
                style={
                  isConnected
                    ? {
                        background: 'rgba(248,113,113,0.12)',
                        color: '#f87171',
                        border: '1px solid rgba(248,113,113,0.3)',
                      }
                    : {
                        background: 'rgba(250,204,21,0.12)',
                        color: '#facc15',
                        border: '1px solid rgba(250,204,21,0.3)',
                      }
                }
              >
                {isConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          )
        })}
      </div>

      {showForm && (
        <form onSubmit={handleCreateAlert} className="glass rounded-2xl p-5 space-y-4">
          <p className="text-sm font-semibold text-white">Create New Alert</p>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-white/40 block mb-1">Coin ID (e.g. bitcoin)</label>
              <input
                type="text"
                value={coinId}
                onChange={(e) => setCoinId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/50"
                placeholder="bitcoin"
                required
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[11px] font-medium text-white/40 block mb-1">Target Price ($)</label>
                <input
                  type="number"
                  step="any"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/50"
                  placeholder="65000"
                  required
                />
              </div>
              <div className="w-1/3">
                <label className="text-[11px] font-medium text-white/40 block mb-1">Direction</label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as 'above' | 'below')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/50 appearance-none"
                >
                  <option value="above" className="bg-gray-800">Above</option>
                  <option value="below" className="bg-gray-800">Below</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-white/40 block mb-1">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as 'telegram' | 'email')}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/50 appearance-none"
              >
                <option value="telegram" className="bg-gray-800">Telegram</option>
                <option value="email" className="bg-gray-800">Email</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-2.5 rounded-xl text-xs font-bold btn-yellow cursor-pointer disabled:opacity-50"
          >
            {createMutation.isPending ? 'Saving...' : 'Save Alert'}
          </button>
        </form>
      )}

      {isLoading && (
        <div className="glass rounded-2xl p-6 text-center text-xs text-white/40 animate-pulse">
          Loading alerts from backend...
        </div>
      )}

      {!isLoading && !isAuthenticated && (
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

      {isAuthenticated && !isLoading && activeAlerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Active
          </p>
          {activeAlerts.map((alert: AlertData) => (
            <div key={alert.id} className="glass rounded-2xl p-4 flex items-center gap-3">
              <CoinIcon symbol={alert.coin_id} size={38} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm uppercase">{alert.coin_id}</span>
                  <span
                    className="mono text-xs font-semibold"
                    style={{ color: alert.direction === 'above' ? '#4ade80' : '#f87171' }}
                  >
                    {alert.direction === 'above' ? '↑' : '↓'} {formatPrice(alert.target_price)}
                  </span>
                </div>
                <p className="text-xs capitalize mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  via {alert.channel}
                </p>
              </div>
              <button
                onClick={() => deleteMutation.mutate(alert.id)}
                disabled={deleteMutation.isPending}
                className="p-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer text-white/30 hover:text-red-400 disabled:opacity-50"
                title="Delete Alert"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {isAuthenticated && !isLoading && activeAlerts.length === 0 && !showForm && (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No active alerts</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.18)' }}>
            Tap "New Alert" to get notified when a coin crosses your target price
          </p>
        </div>
      )}
    </div>
  )
}
