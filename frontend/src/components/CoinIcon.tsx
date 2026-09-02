interface Props {
  symbol: string
  color?: string
  image?: string
  size?: number
}

// Map common coins to vibrant gradient accent colors
const coinColors: Record<string, string> = {
  btc: '#f7931a',
  eth: '#627eea',
  sol: '#14f195',
  bnb: '#f3ba2f',
  xrp: '#23292f',
  ada: '#0033ad',
  doge: '#c2a633',
  avax: '#e84142',
  dot: '#e6007a',
  link: '#375bd2',
  sui: '#4ca2ff',
  pepe: '#43a047',
}

export default function CoinIcon({ symbol, color, image, size = 36 }: Props) {
  const sym = symbol.toLowerCase()
  const bg = color || coinColors[sym] || '#6366f1'
  const label = symbol.length <= 3 ? symbol.toUpperCase() : symbol.slice(0, 2).toUpperCase()

  if (image) {
    return (
      <img
        src={image}
        alt={symbol}
        className="rounded-full flex-shrink-0 object-cover"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="flex items-center justify-center rounded-full flex-shrink-0 font-bold text-white"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${bg}cc 0%, ${bg}55 100%)`,
        boxShadow: `0 0 ${size * 0.4}px ${bg}44`,
        fontSize: size * 0.32,
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '-0.02em',
      }}
    >
      {label}
    </div>
  )
}
