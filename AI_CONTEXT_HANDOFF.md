# PROJECT_CONTEXT.md — Crypto Tracker Platform

> Purpose of this file: give an AI coding assistant (Claude Code, Cursor, Copilot, or any future model) enough context to work on this codebase correctly without re-deriving decisions already made. Keep this file updated as the source of truth alongside the code. When in doubt, this file wins over assumptions from general training knowledge about "how a crypto app is usually built."

## 1. Project Identity

- **What it is:** A web app for tracking cryptocurrency prices, gainers, trending/momentum coins, related news, and price alerts.
- **Scope constraint:** Coin universe is CoinGecko's full tracked list, but the **default view is filtered to coins listed on Binance only**, via an `is_binance_listed` flag. A toggle shows the full universe.
- **Not in scope (v1):** Trading, wallet integration, portfolio P&L tracking, SMS alerts, real-time (sub-minute) price streaming.
- **License:** Open source, MIT.
- **Current phase:** Pre-development / Sprint 1 not yet started (as of this document's writing). Check `SPRINT_PLANNER.md` for live sprint status if this file is stale.

## 2. Non-Negotiable Architectural Rule

**The frontend NEVER calls CoinGecko, CryptoPanic, Telegram, or SMTP services directly.** All external API calls happen exclusively in scheduled backend background jobs, which write to PostgreSQL/Redis. All frontend-facing endpoints read only from the app's own database/cache. This is the single most important constraint in the system — it exists to survive CoinGecko's free-tier rate limit (~30 calls/min) regardless of concurrent user count. If you (the AI assistant) are asked to add a feature that seems to need fresh external data on-demand, default to "add/adjust a background job + serve from cache," not "call the external API from the request handler."

## 3. Tech Stack (exact, do not substitute without being asked)

| Layer | Technology | Notes |
|---|---|---|
| Frontend framework | React + TypeScript + Vite | |
| Frontend hosting | Cloudflare Pages | |
| Styling | TailwindCSS | Custom design tokens — see §6 |
| Data fetching (frontend) | TanStack Query (React Query) | Polling intervals should match backend sync cadence (§4), not be faster |
| Charts | Recharts or Chart.js | Either acceptable, prefer consistency once one is chosen |
| Backend framework | FastAPI (Python, async) | |
| Backend hosting | Render | One web service + one background worker (APScheduler) |
| ORM | SQLAlchemy 2.0 (async) + Alembic for migrations | |
| Database | PostgreSQL, hosted on Supabase | |
| Cache | Redis (Render add-on or Upstash) | Hot price/trending reads |
| Scheduler | APScheduler | Not Celery — deliberately kept simple given low concurrency (~10 users) |
| Auth | Auth0 | Hosted login/signup. Backend verifies JWTs via JWKS; backend does NOT store passwords. |
| Price/gainers/trending/exchange-listing data | CoinGecko free/demo API | Single source of truth — see §4 |
| News data | CryptoPanic free tier | |
| Alert delivery | python-telegram-bot (Telegram Bot API) + SMTP (Gmail App Password or SendGrid free tier) | Both free channels only — SMS explicitly rejected due to per-message cost |
| Error monitoring | Sentry free tier | |

## 4. External Data Sources — Exact Endpoints and Why

| Need | Endpoint | Sync cadence | Rationale |
|---|---|---|---|
| Live prices, market cap, volume, 24h/7d/30d/1y % change | `GET /coins/markets` (CoinGecko) | Every 5 min | Built-in % change fields avoid manual candle computation |
| Which coins are Binance-listed | `GET /exchanges/binance/tickers` (CoinGecko, paginated) | Daily/weekly | **Deliberately NOT using Binance's own API for this.** CoinGecko's exchange-tickers endpoint maps directly to CoinGecko coin IDs, avoiding ticker-symbol collisions (the same symbol, e.g. `ADA`, can refer to different coins on different exchanges — matching by symbol string is unreliable) |
| Trending coins | `GET /search/trending` (CoinGecko) | Every 15 min | |
| News, tagged by coin | CryptoPanic API with `currencies=` filter | Every 15–30 min | |

**If asked to add Binance's own REST API back in:** don't, unless explicitly instructed — this was a deliberate architecture decision made after evaluating both approaches (see project history: Binance API was initially considered for direct price data, but reverted in favor of CoinGecko-only + the exchange-tickers mapping, because it eliminated the need for manual 30d/1y candle math and symbol-matching ambiguity).

## 5. Data Model (conceptual — exact columns TBD in Alembic migrations)

- `users` — keyed by Auth0 `sub` (not a locally-generated ID as primary identity), holds app-specific fields like `telegram_chat_id`.
- `coins` — CoinGecko coin ID as key, cached price/market data, `is_binance_listed` boolean, `price_change_percentage_24h/7d/30d/1y`, `total_volume`.
- `alerts` — `user_id`, `coin_id`, `target_price`, `direction` (above/below), `channel` (telegram/email), `status`.
- `watchlist` — `user_id`, `coin_id` (many-to-many).
- `news` — CryptoPanic article data, tagged with coin symbol/currency for correlation.

## 6. Design System (do not deviate without explicit instruction)

- **Aesthetic:** Glassmorphism + Apple-style "Dynamic Island" pattern. Dark-first (glass needs a rich dark backdrop to read well). Restrained/simple — one accent color pairing (emerald for gains, soft red for losses), no gradient decoration for decoration's sake, no generic SaaS drop-shadow card kit.
- **Key tokens:** `--bg-base: #0B0E14`, `--glass-fill: rgba(255,255,255,0.06)` with `backdrop-filter: blur(20px)`, `--glass-border: rgba(255,255,255,0.12)`, `--accent-up: #34D399`, `--accent-down: #F87171`. Full token list in the finalized project report.
- **Typography:** One family (Inter), hierarchy via weight/size, not color. No all-caps labels.
- **The Dynamic Island is functional, not decorative:** it's the app's in-app notification center for triggered price alerts. Collapsed = glanceable summary; expanded = recent alerts/quick actions. Reuse this same component/motion language for confirmations app-wide rather than adding separate toast/modal patterns.
- **Mobile-first, always:** every screen designed/tested at 375px width first, then scaled to tablet/desktop. Bottom tab nav on mobile; two-pane layout on desktop (≥1024px).
- Full rationale and ASCII wireframes: see the finalized project report, §4 (UI/UX Design System).

## 7. Feature List (for a full spec of each, see SPRINT_PLANNER.md and the finalized project report)

1. Auth (Auth0, JWT verification)
2. Live price dashboard, Binance-filtered by default
3. Top gainers/losers, 30d and 1y
4. Trending/momentum — TWO separate ranked lists shown side by side: pure % change AND volume-adjusted score (`score = %change × log(volume_ratio)`) — this dual-list requirement is explicit and should not be collapsed into a single blended ranking
5. News aggregation + rule-based "why trending" reasoning (keyword-tagged, explicitly labeled as "likely reason" in UI copy, not presented as certain fact)
6. Price alerts via Telegram and Email (not SMS — explicitly rejected for cost reasons)
7. Watchlist (portfolio P&L tracking is post-MVP, not in scope yet)

## 8. Known Constraints an AI Assistant Should Respect

- Never suggest paid API tiers as a first solution to a rate-limit problem — the caching/polling architecture (§2) is the intended solution, and the team has ~10 concurrent users, so free tiers have large headroom.
- Never commit secrets. Auth0 client secret, CryptoPanic API key, Supabase connection string, SMTP/Telegram bot token all go through environment variables, never hardcoded, never in example code shown in the public repo beyond `.env.example` placeholders.
- Don't introduce Celery/RabbitMQ or other heavier job infrastructure without being asked — APScheduler was deliberately chosen for simplicity at this scale.
- Don't build true real-time (WebSocket streaming) price updates unless explicitly requested — polling on a 5-minute cadence is an intentional, documented decision, not an oversight.
- Treat "why trending" output as inherently a best-effort heuristic — do not present it or engineer it to sound more authoritative than "likely reason, based on recent headlines."

## 9. Where to Look for More Detail

- `FINAL_PROJECT_REPORT.md` — full feasibility study, architecture diagrams, cost analysis, complete design system spec.
- `SPRINT_PLANNER.md` — sprint-by-sprint task breakdown with acceptance criteria; treat as the current source of truth for "what's being built right now."
- `PROJECT_OVERVIEW.md` — plain-language explanation of the project for a human (or AI) encountering it for the first time, less implementation-detail-dense than this file.
