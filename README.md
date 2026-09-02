# Crypto Tracker Platform

> Live crypto prices, gainers, momentum trends, news, and price alerts — all on free-tier infrastructure.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + TypeScript + Vite (Cloudflare Pages) |
| Styling | TailwindCSS (glassmorphism design system) |
| Backend | FastAPI async Python (Render) |
| Database | PostgreSQL via Supabase |
| Cache | Redis (Render / Upstash) |
| Auth | Auth0 (JWT) |
| Data | CoinGecko free API + CryptoPanic |
| Alerts | Telegram Bot + SMTP Email |

## Local Development

### Prerequisites
- Node 20+
- Python 3.12+
- [Auth0 account](https://auth0.com), [Supabase project](https://supabase.com)

### Setup

```bash
# Clone
git clone git@vrlegacy:vrlegacy/cryptoapp.git
cd cryptoapp

# Frontend
cd frontend
cp ../.env.example .env.local    # fill in values
npm install
npm run dev

# Backend (new terminal)
cd backend
cp ../.env.example .env          # fill in values
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload
```

## Environment Variables

See `.env.example` for all required keys.

## License

MIT
