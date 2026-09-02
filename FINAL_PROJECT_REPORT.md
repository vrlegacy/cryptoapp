# Crypto Tracker Platform — Final Project Report

**Document type:** Feasibility Study, Technical Architecture, Design System & Full Project Tracker
**Status:** Finalized — approved baseline for Sprint 1 kickoff
**Companion documents:** `SPRINT_PLANNER.md` (execution plan), `PROJECT_OVERVIEW.md` (plain-language summary), `AI_CONTEXT_HANDOFF.md` (AI-assistant onboarding context)

---

**Stack:** React (frontend) + FastAPI (backend) + PostgreSQL (Supabase) + Redis
**Deployment:** Cloudflare Pages (frontend) + Render (backend + cron worker) + Supabase (DB)
**Auth:** Auth0
**Data sources:** CoinGecko free API (single source — price, gainers, trending, AND Binance-listing status) + CryptoPanic (news)
**Coin universe:** All CoinGecko-tracked coins, each flagged `is_binance_listed` (via CoinGecko's own `/exchanges/binance/tickers`), default view filtered to Binance-listed only with a toggle to see everything
**Notifications:** Telegram Bot + Email (SMTP)
**Users:** Public, multi-user, full authentication
**License:** Open source (MIT recommended — permissive, widely used for dev tools; swap to Apache-2.0 if you want explicit patent grant language)

---

## 1. Executive Summary

This is a **feasible, well-scoped MVP-to-production project**. All core requirements — live price tracking, gainer rankings, trending-coin detection with reasoning, news aggregation, and free-channel alerts — can be built entirely on free-tier infrastructure and free-tier APIs. The main engineering challenge isn't any single feature; it's **designing around free-API rate limits** so that a growing user base doesn't get throttled. That's solved with a caching + polling architecture (below), not by paying for a higher API tier — at least not initially.

Estimated MVP timeline: **4–6 weeks** for one developer working part-time, or **2–3 weeks** full-time.

---

## 2. Feasibility Study

### 2.1 Technical Feasibility — ✅ Feasible

| Concern | Assessment |
|---|---|
| Live price data | CoinGecko free API (`/coins/markets`) — spot price, market cap, volume, and **built-in** 24h/7d/30d/1y % change in a single call. No manual candle math needed. |
| Binance-listing flag | CoinGecko's `/exchanges/binance/tickers` (paginated) returns every coin currently trading on Binance, keyed by CoinGecko coin ID. Sync this periodically, store as an `is_binance_listed` boolean per coin. **This is more reliable than matching ticker symbols directly against Binance's own API**, since ticker symbols (e.g. `ADA`, `LUNA`) are reused across unrelated coins on different exchanges — going through CoinGecko's own exchange-tickers mapping avoids that ambiguity. |
| Monthly/Yearly gainers | CoinGecko `/coins/markets?price_change_percentage=24h,7d,30d,1y` gives this directly — no custom computation. |
| Trending coins | CoinGecko `/search/trending` gives top searched/trending coins, free, no key. Cross-reference each against your `is_binance_listed` flag to label/filter. |
| "Why trending" | Not available from price APIs — inferred by cross-referencing trending coin symbols against **CryptoPanic** news feed (free tier, votes/hotness score) and summarizing matching headlines. |
| Alerts (Telegram/Email) | Both free: `python-telegram-bot` (Telegram Bot API, no volume limits) and SMTP via Gmail App Password or free-tier SendGrid (100 emails/day free). |
| Auth (multi-user) | **Auth0** free tier (up to 25,000 monthly active users) — offload signup/login/JWT issuance entirely; backend just verifies Auth0-issued JWTs. |
| Real-time-ish updates | Not true real-time — with ~10 concurrent users, polling every **5–15 min** is more than enough (see §2.2 below) and keeps you well under CoinGecko's free-tier limits. |

### 2.2 API Rate Limits — Low Risk at Your Scale

CoinGecko's free/demo tier is rate-limited (roughly **~30 calls/minute**, plus a monthly call cap — always verify current limits, these change over time) — this is the one limit to design around, same as before.

**Mitigation (the key architectural decision, unchanged regardless of data source):**
- The **backend**, not the frontend/browser, ever calls CoinGecko/CryptoPanic.
- A scheduled job fetches prices/trending/news/binance-listing status **once** and writes to PostgreSQL/Redis — regardless of how many users are looking at the dashboard.
- All user-facing API requests are served from your own DB/cache — instant, and immune to third-party rate limits and outages.

**Given your actual usage pattern (~10 concurrent users, not thousands):**
- **Live prices (`/coins/markets`):** every 5 min. One call covers up to 250 coins per page — for a few hundred tracked coins, that's only 1–3 calls per cycle, nowhere near the 30/min ceiling.
- **Binance-listing sync (`/exchanges/binance/tickers`):** once per day (or even once a week) — this list barely changes day to day.
- **Trending (`/search/trending`):** every 15 min — single lightweight call.
- **News sync:** every 15–30 min.
- Net effect: even bundling all of the above, you'd use a small fraction of the per-minute limit and stay comfortably under any monthly cap, with large headroom before this needs revisiting.

### 2.3 Cost Feasibility — ✅ $0 to start

| Component | Free tier used | Paid trigger point |
|---|---|---|
| Frontend hosting | Cloudflare Pages free tier | Essentially never for this app's scale |
| Backend hosting | Render free tier | Sleep/cold-start becomes annoying → ~$7/mo paid tier |
| Database | Supabase free Postgres (~500MB) | Data outgrows free quota |
| Redis (cache) | Render Redis add-on / Upstash free tier | High cache volume |
| Auth | Auth0 free tier (up to 25,000 MAU) | Very high user growth only |
| Price/trending/exchange data | CoinGecko free/demo API | Need >30 calls/min or commercial redistribution → CoinGecko paid plan |
| News data | CryptoPanic free tier | Need higher request volume |
| Telegram alerts | Free, no limit | N/A |
| Email alerts | Gmail SMTP (free, ~500/day) or SendGrid free (100/day) | Higher volume → paid SendGrid |

Realistic run cost for an MVP with modest traffic: **$0/month**, rising to roughly **$5–15/month** once you outgrow free-tier sleep limits or DB storage.

### 2.4 Legal/Compliance Note
This app displays market data and news — it is **not** giving financial advice. Recommend a visible disclaimer ("Not financial advice, data may be delayed") in the footer/ToS. CoinGecko and CryptoPanic free tiers both require attribution — check their current terms before public launch.

### 2.5 Known Limitations to Set Expectations On
- Prices are near-real-time (1–5 min lag from your refresh cycle), not tick-by-tick.
- Free-tier backend hosts (Render/Railway free) "sleep" after inactivity — first request after idle can take 20–50s. Fine for MVP, worth upgrading before real users rely on alerts.
- "Why it's trending" is a **best-effort summary** generated from correlated news headlines/social volume — not a guaranteed causal explanation.

---

## 3. Recommended Architecture

```
┌──────────────┐   HTTPS + Auth0 JWT   ┌──────────────────┐
│    React     │ ◄────────────────────►│    FastAPI        │
│ (Cloudflare  │                       │    (Render)        │
│    Pages)    │                       └─────────┬─────────┘
└──────┬───────┘                                 │
       │                                          │
       │ login/signup redirect          ┌─────────┼─────────────────────┐
       ▼                                │         │                     │
┌──────────────┐               ┌────────▼───────┐ │           ┌─────────▼─────────┐
│    Auth0      │               │  PostgreSQL     │ │           │  Background Jobs    │
│ (hosted login,│               │  (Supabase)     │ │           │  APScheduler,        │
│  issues JWT)  │               │  users*, alerts,│ │           │  every 5-15 min       │
└───────────────┘               │  watchlists,    │ │           │  (cadence in §2.2)    │
                                 │  coins +         │ │           └──────────┬────────────┘
                                 │  is_binance_listed│ │                      │
                                 └─────────────────┘ │                      │
                                          ┌───────────▼──────┐   ┌──────────┼──────────────┐
                                          │      Redis        │   │          │              │
                                          │ (hot cache: live   │   │  ┌───────▼──────────┐ ┌─▼──────────┐
                                          │  prices, trending) │   │  │  CoinGecko API    │ │CryptoPanic │
                                          └────────────────────┘   │  │ (price/gainers/   │ │  (news)    │
                                                                    │  │ trending/binance- │ └────────────┘
                                                                    │  │ tickers mapping)  │
                                                                    │  └───────────────────┘
                                                                    │                              │
                                                                    │                      ┌────────▼────────┐
                                                                    │                      │ Telegram/SMTP    │
                                                                    │                      │ (send alerts)    │
                                                                    │                      └──────────────────┘
```
*\*Supabase Postgres stores app data (alerts, watchlists, coin cache) — Auth0 stores identity/credentials separately; link by Auth0 `sub` (user id).*

**Key principle:** background jobs are the only thing that talk to CoinGecko/CryptoPanic. Everything user-facing — including the Binance-listed filter/badge — reads from Postgres/Redis. The frontend never calls CoinGecko or CryptoPanic directly, and Binance's own API is never called at all.

---

## 4. UI/UX Design System

**Direction:** Glassmorphism + an Apple-style "Dynamic Island" pattern, mobile-first, restrained rather than busy. One memorable interaction (the island), everything else quiet and disciplined.

**Color (dark-first, since glass panels need a rich backdrop to read well):**
- `--bg-base: #0B0E14` — near-black background the glass sits on
- `--bg-elevated: #12161F` — slightly lifted surface (cards behind the glass)
- `--glass-fill: rgba(255,255,255,0.06)` — panel fill, layered with `backdrop-filter: blur(20px)`
- `--glass-border: rgba(255,255,255,0.12)` — 1px hairline border on glass panels, not a shadow
- `--accent-up: #34D399` — price gains (emerald, not neon)
- `--accent-down: #F87171` — price losses (soft red, not alarm-red)
- `--text-primary: #F5F6F8` / `--text-muted: rgba(245,246,248,0.6)`

**Type:** One family, Inter (or SF Pro Display if you have a license — Inter is the closest free/open equivalent and renders consistently across platforms). Use weight and size for hierarchy instead of color tricks: 600–700 for prices/headlines, 400–500 for body/labels. No all-caps labels, no single-word accent coloring — keep it calm per the "simple design" ask.

**The Dynamic Island component (the one bold element):**
- A pill-shaped, floating glass element fixed at the top of the viewport (mobile) or top-center (desktop).
- **Collapsed state:** shows a compact glanceable summary — e.g. your top watchlist mover, or "3 alerts triggered."
- **Expanded state (tap/click):** morphs (not swaps) into a panel showing live alert notifications, quick actions (mute, view coin), or a mini price ticker — using a single smooth spring animation, not a generic slide-fade.
- This becomes your **in-app notification center** for triggered price alerts — a natural, non-generic answer to "how do I show a live alert without a jarring popup."
- Reuse the same island shape/motion language for confirmations (e.g. "Alert set ✓") so the interaction vocabulary stays consistent app-wide, rather than introducing toasts, modals, and banners as separate patterns.

**Layout — mobile-first, then scale up:**
```
Mobile (< 640px)              Desktop (≥ 1024px)
┌─────────────────┐          ┌───────────────────────────┐
│   [ Island ]     │          │        [ Island ]          │
├─────────────────┤          ├───────────┬─────────────────┤
│ Coin card        │          │ Coin list  │  Detail panel   │
│ Coin card        │          │ (glass     │  (chart, stats, │
│ Coin card        │          │  rows)     │   alert form)   │
│  ...scroll        │          │            │                 │
├─────────────────┤          └───────────┴─────────────────┘
│ Bottom nav        │
│ (Dashboard/Gainers/│
│  Trending/Alerts)  │
└─────────────────┘
```
- Mobile: single-column glass cards, bottom tab bar (thumb-reachable), the island floats above scroll content.
- Desktop: two-pane layout (list + detail), island stays centered at the top rather than becoming a full nav bar — keep its identity consistent across breakpoints rather than swapping it for a different component on desktop.
- Every screen (dashboard, gainers, trending, alerts, coin detail) is built mobile-first with Tailwind responsive prefixes, tested at 375px width first, then scaled up — not the other way around.

**Restraint checklist (apply to every screen):** one accent color for gains/losses only, no gradient decoration for its own sake, no drop-shadow card kit — depth comes from the blur/border glass treatment, not shadows. Visible focus states and reduced-motion fallback for the island's spring animation (respect `prefers-reduced-motion`).

---

## 5. Tech Stack Detail

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + TypeScript + Vite | Fast dev loop, type safety |
| Frontend hosting | **Cloudflare Pages** | Free, fast global CDN, simple GitHub CI/CD |
| Styling | TailwindCSS | Speed, consistency |
| Charts | Recharts or Chart.js | Price history, gainer bar charts |
| State/data fetching | TanStack Query (React Query) | Caching, polling, loading states out of the box |
| Backend | FastAPI (Python, async) | Async fits polling/scheduling well, auto OpenAPI docs |
| Backend hosting | **Render** | Free/low-cost tier, supports a background worker process for the scheduler alongside the web service |
| ORM | SQLAlchemy 2.0 (async) + Alembic | Migrations, type-safe models |
| DB | **PostgreSQL via Supabase** | Free tier (~500MB), managed, includes handy dashboard/table editor |
| Cache | Redis (Render add-on or Upstash free tier) | Hot price/trending data, sub-ms reads |
| Scheduler | APScheduler (simple, sufficient at this scale) | Periodic CoinGecko/news fetch jobs — no need for Celery given low concurrency |
| Auth | **Auth0** (hosted login, JWT issuance) + FastAPI JWT-verification middleware | Offloads password storage/security entirely; free up to 25k MAU |
| Notifications | python-telegram-bot, smtplib/SendGrid | Both free |
| Price/candle/trending/exchange data | **CoinGecko free API** — single source for price, gainers, trending, and Binance-listing status | One API instead of two; built-in 30d/1y fields and trending endpoint save custom computation |
| Deployment | Cloudflare Pages (FE) + Render (BE + worker) + Supabase (DB) | All free-tier to start |
| License | MIT (suggested) | Open-source friendly, minimal restrictions for contributors |

---

## 6. Phased Implementation Plan

**Phase 1 — MVP (Weeks 1–2):** Auth, live price dashboard, top gainers (30d/1y), background price-sync job.
**Phase 2 — Intelligence layer (Weeks 3–4):** Trending coins + "why trending" via CryptoPanic correlation, news feed page.
**Phase 3 — Alerts (Week 5):** Telegram bot integration, email alerts, user-defined price triggers.
**Phase 4 — Polish & scale-readiness (Week 6):** Watchlists, rate-limit hardening, error monitoring, deploy hardening (move off free sleep tier if needed).

---

## 7. Project Tracker — Features Broken Into Subtasks

### Feature 1: User Authentication & Onboarding (Auth0)

| Task | Description | Side | Info |
|---|---|---|---|
| Auth0 tenant setup | Create app in Auth0 dashboard, configure allowed callback/logout URLs for Cloudflare Pages domain | Backend/Config | One-time setup, no code |
| Auth0 SDK integration | `@auth0/auth0-react` — login/logout/signup redirect flow | Frontend | Auth0 hosts the actual login page |
| JWT verification middleware | Validate Auth0-issued JWT (RS256, JWKS) on protected FastAPI routes | Backend | `python-jose` + Auth0 JWKS endpoint, no password handling in your own DB |
| App-side user profile table | Local `users` table keyed by Auth0 `sub`, storing app-specific data (telegram_chat_id, preferences) | Backend | Auth0 owns identity; your DB owns app data — link by `sub` |
| Protected routes | Redirect unauthenticated users to Auth0 login | Frontend | Auth0 React SDK route guards |
| (Optional) Social logins | Enable Google/GitHub login | Config | Toggle in Auth0 dashboard, zero extra code |

### Feature 2: Live Price Tracking Dashboard

| Task | Description | Side | Info |
|---|---|---|---|
| Binance-listing sync job | Paginate `/exchanges/binance/tickers`, extract CoinGecko coin IDs currently trading on Binance, store as `is_binance_listed` flag | Backend | Run daily/weekly — this list barely changes; avoids symbol-matching ambiguity entirely |
| Background price-sync job | Fetch `/coins/markets` (paginated, `price_change_percentage=24h,7d,30d,1y`) every 5 min, upsert into DB + Redis | Backend | 1–3 calls per cycle covers a few hundred coins — cheap on rate limit |
| `/coins?binance_only=true\|false` endpoint | List coins with price, % change fields, volume, and `is_binance_listed` flag; default filtered to Binance-listed, toggle for full universe | Backend | Reads from Redis cache, falls back to DB |
| `/coins/{id}/history` endpoint | Historical price series for charting | Backend | Cached from CoinGecko `/coins/{id}/market_chart` |
| Dashboard table/grid | Sortable, searchable coin list, "Binance" badge per row, filter toggle | Frontend | TanStack Table + TanStack Query polling every ~5 min |
| Coin detail page | Price chart, stats, add-to-watchlist button, Binance-listed badge | Frontend | Recharts line chart |
| Search/filter bar | Filter by name/symbol + Binance-only toggle | Frontend | Debounced input |

### Feature 3: Top Monthly & Yearly Gainers

| Task | Description | Side | Info |
|---|---|---|---|
| Gainers query logic | Sort cached coin list by `price_change_percentage_30d` / `_1y`, filterable by `is_binance_listed` | Backend | Built-in fields from CoinGecko — no custom candle math needed |
| `/gainers?period=30d\|1y&binance_only=true\|false` endpoint | Returns ranked top N gainers/losers | Backend | Pulled straight from cached `/coins/markets` data |
| Gainers leaderboard UI | Ranked list/cards, toggle 30d vs 1y, Binance-only toggle, badge per coin | Frontend | Reuses dashboard components |
| Losers view (bonus) | Same as gainers, inverted sort | Frontend/Backend | Low extra effort, good to include |

### Feature 4: Momentum / Trending Coins Engine

| Task | Description | Side | Info |
|---|---|---|---|
| Trending fetch job | Pull CoinGecko `/search/trending` every 15 min | Backend | Free endpoint, no key required |
| Momentum scoring — Formula A: Pure % change | Rank cached coins by short-term price % change (e.g. 24h or 7d) | Backend | Straightforward, from cached `/coins/markets` data |
| Momentum scoring — Formula B: Volume-adjusted | Rank by a composite score, e.g. `score = %change × log(volume_ratio)` where `volume_ratio` = current `total_volume` ÷ recent average volume — rewards moves backed by real volume, not thin-liquidity spikes | Backend | Uses CoinGecko's `total_volume` field, still cheap on cached data |
| `/trending?method=pct_change\|volume_adjusted&binance_only=true\|false` endpoint | Serve both ranked lists separately, filterable by Binance-listed status | Backend | Both computed from the same cached dataset — no extra API cost either way |
| Trending UI — two tabs/sections | "Pure Movers" vs "Volume-Backed Movers", each labeled with its ranking method, Binance badge/filter on both | Frontend | Toggle or side-by-side cards |

### Feature 5: News Aggregation & "Why It's Trending"

| Task | Description | Side | Info |
|---|---|---|---|
| News-sync job | Pull CryptoPanic feed every 15–30 min, tag articles by coin symbol/currency | Backend | CryptoPanic free API supports `currencies=` filter |
| Correlate trending ↔ news | For each trending coin, attach top 2–3 matching headlines | Backend | Simple symbol-match join; no ML needed for v1 |
| "Why trending" summary | Short auto-generated blurb per coin from matched headlines | Backend | Rule-based first (e.g. "ETF filing", "exchange listing" keyword tags); LLM summarization optional later |
| `/news` and `/trending/{id}/reason` endpoints | Serve news list + per-coin reasoning | Backend | — |
| News feed page | Chronological list, filterable by coin | Frontend | — |
| "Why trending" tooltip/panel | Shown on trending coin cards | Frontend | Expandable detail |

### Feature 6: Price Alerts & Notifications

| Task | Description | Side | Info |
|---|---|---|---|
| Alerts table | user_id, coin_id, target_price, direction (above/below), channel, status | Backend | Postgres schema |
| Alert-check job | Every cycle, compare cached prices against active alerts | Backend | Runs in same scheduler as price sync |
| Telegram bot setup | Register bot via BotFather, link chat_id to user account | Backend | `python-telegram-bot`; user sends `/start` to link |
| Telegram send function | Push message when alert triggers | Backend | Free, no rate concerns at this scale |
| Email send function | SMTP/SendGrid alert email | Backend | Template with coin, price, direction |
| `/alerts` CRUD endpoints | Create/list/delete alerts | Backend | — |
| Alerts management UI | Set target price + channel per coin | Frontend | Form + list of active alerts |
| Telegram linking UI | Show bot link/QR + confirmation status | Frontend | — |

### Feature 7: Watchlist & Portfolio (stretch goal)

| Task | Description | Side | Info |
|---|---|---|---|
| Watchlist table | user_id, coin_id | Backend | Simple many-to-many |
| Watchlist endpoints | Add/remove/list | Backend | — |
| Watchlist UI | Star/pin coins, dedicated "My Coins" view | Frontend | — |
| (Stretch) Portfolio tracking | Track holdings + P&L | Backend/Frontend | Post-MVP, larger scope |

### Feature 8: UI Design System & Mobile Responsiveness

| Task | Description | Side | Info |
|---|---|---|---|
| Design tokens setup | Tailwind config extended with the color/glass/type tokens from §4 | Frontend | `tailwind.config` custom colors, `backdrop-blur` utilities |
| Glass panel component | Reusable `<GlassCard>` — fill, border, blur, used for all coin cards/panels | Frontend | One component, reused everywhere for consistency |
| Dynamic Island component | Collapsed/expanded states, spring animation, doubles as alert notification center | Frontend | Framer Motion (or CSS `transition` + `@starting-style` if avoiding extra deps) for the morph animation |
| Bottom tab nav (mobile) | Dashboard / Gainers / Trending / Alerts, thumb-reachable | Frontend | Fixed position, hidden ≥1024px in favor of desktop layout |
| Responsive breakpoints pass | Every screen tested at 375px → 768px → 1024px+ | Frontend | Mobile-first Tailwind prefixes (`sm:`, `md:`, `lg:`) |
| Accessibility pass | Visible focus rings, `prefers-reduced-motion` fallback for island animation, sufficient contrast on glass text | Frontend | Quick but easy to skip — flag as a Phase 4 checklist item |

### Feature 9: Infra, DevOps & Hardening

| Task | Description | Side | Info |
|---|---|---|---|
| Repo setup + CI | GitHub repo, GitHub Actions for lint/test | Both | — |
| Env config & secrets | API keys, DB URL, JWT secret via env vars | Both | Never commit secrets |
| Deploy frontend | Cloudflare Pages, connect to GitHub repo/subfolder | Frontend | Auto-deploy on push |
| Deploy backend + worker | Render — one web service (FastAPI) + one background worker (APScheduler) | Backend | Configure via `render.yaml` for reproducible deploys |
| Provision database | Supabase project, run Alembic migrations against it | Backend | Free tier ~500MB, includes web dashboard for quick inspection |
| Rate-limit safeguard | Backoff/retry logic around CoinGecko/CryptoPanic calls, alerting if API fails | Backend | Protects against silent data staleness; low risk at current scale but cheap to add |
| Error monitoring | Sentry free tier | Both | Catch prod errors early |
| Basic tests | Auth flow, price-sync job, alert-trigger logic | Backend | Pytest |

---

## 8. Open Source Notes

- **License:** MIT recommended (simple, permissive, standard for this kind of dev tool). Add a `LICENSE` file at repo root and a `CONTRIBUTING.md` if you want outside contributors.
- **Secrets hygiene:** Since the repo is public, **CoinGecko free-tier calls need no key** for the endpoints this plan uses, but **Auth0 client secret, CryptoPanic API key, Supabase connection string, SMTP/Telegram bot token must never be committed** — use `.env` files (gitignored) locally and Render/Cloudflare Pages environment variable settings in production. Include a `.env.example` with placeholder keys so contributors know what to set up.
- **Repo structure suggestion:** monorepo with `/frontend` and `/backend` folders, or two repos if you prefer separate deploy pipelines — either works fine with Cloudflare Pages + Render.

## 9. Decisions Confirmed So Far

- ✅ Default view: **Binance-listed coins only**, toggle for full CoinGecko universe.
- ✅ UI: glassmorphism + Dynamic Island pattern, mobile-first/responsive, simple/restrained design.
- ✅ Momentum: both pure % change and volume-adjusted, shown as separate lists.
- ✅ Stack: Cloudflare Pages + Render + Supabase + Auth0, CoinGecko as sole external price/trending/exchange-status source, CryptoPanic for news, Telegram + Email for alerts.
- ✅ Open source, MIT license suggested.

## 10. Open Questions for You (answer whenever convenient — not blockers to starting)

1. **Branding:** Still open — happy to help brainstorm names once the MVP is functional, or anytime you'd like.

Nothing above blocks starting Phase 1.
