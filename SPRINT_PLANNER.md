# Sprint Planner — Crypto Tracker Platform

**Prepared by:** Project/Sprint Management
**Methodology:** Scrum, 1-week sprints (adjust to 2-week sprints and halve scope-per-sprint if working part-time — see §0.3)
**Total sprints:** 6 (MVP) + 1 stabilization sprint
**Status:** Ready to start — Sprint 1 can begin immediately

---

## 0. How to Use This Document

### 0.1 Sprint Structure
Every sprint below follows the same shape: **Goal → Backlog (with story points) → Definition of Done → Risks → Demo Criteria**. Story points use a modified Fibonacci scale (1, 2, 3, 5, 8) representing relative effort, not hours:

| Points | Rough meaning |
|---|---|
| 1 | Trivial — config, a single small function |
| 2 | Small — one endpoint or one simple component |
| 3 | Medium — a feature slice with FE+BE wiring |
| 5 | Large — a feature slice with real logic/design work |
| 8 | Extra large — should usually be split further; flagged if it appears |

### 0.2 Ceremonies (recommended cadence, adapt to team size)
| Ceremony | When | Purpose |
|---|---|---|
| Sprint Planning | Day 1 of sprint | Confirm goal, pull backlog items, size anything unsized |
| Daily Standup (or async check-in if solo/small team) | Daily | What's done, what's next, what's blocked |
| Sprint Review/Demo | Last day | Show working software against Demo Criteria below |
| Retrospective | Last day, after review | What worked / what didn't / one change for next sprint |

### 0.3 Solo-Developer / Part-Time Adjustment
This plan assumes roughly one focused full-time developer per sprint-week. If working part-time (evenings/weekends), **stretch each sprint to 2 weeks** and keep scope as-is rather than compressing — do not try to run 1-week sprints part-time, velocity estimates will be meaningless. Total timeline becomes ~12–14 weeks instead of 6–7.

### 0.4 Definition of Ready (applies before any item enters a sprint)
- The task has a clear description and acceptance criteria (already provided per-item below).
- Dependencies on earlier sprints are complete.
- Any needed third-party account (Auth0, CryptoPanic, Telegram BotFather, Supabase, Render, Cloudflare) is provisioned.

### 0.5 Global Definition of Done (applies to every item, in addition to per-sprint DoD)
- Code merged to main branch, passes CI (lint + tests).
- No secrets committed; relevant `.env.example` updated if new env vars introduced.
- Manually verified on both desktop width (≥1024px) and mobile width (375px) for any UI item.
- Deployed to the live Render/Cloudflare environment, not just local.

---

## Sprint 0 (Pre-Sprint) — Environment & Account Setup
*Not a scored sprint — a checklist to clear before Sprint 1 planning, ideally same day or day before.*

| Setup Item | Owner | Notes |
|---|---|---|
| GitHub repo created (monorepo: `/frontend`, `/backend`) | Dev | Add MIT `LICENSE`, `README.md` stub, `.gitignore` |
| Auth0 tenant + application created | Dev | Note down domain, client ID, client secret |
| Supabase project created | Dev | Note down connection string |
| Render account + web service + worker service scaffolded | Dev | Can be empty services initially |
| Cloudflare Pages project connected to repo | Dev | Point at `/frontend` build output |
| CryptoPanic API key obtained | Dev | Free tier signup |
| Telegram bot created via BotFather | Dev | Note down bot token |
| SMTP credentials (Gmail App Password or SendGrid) | Dev | For email alerts |
| `.env.example` drafted with all placeholder keys | Dev | Keeps secrets hygiene from day one |

---

## Sprint 1 — Foundation: Auth, Data Model, Design Tokens
**Sprint Goal:** A deployed skeleton app where a user can log in via Auth0, and the visual design system (glass tokens, base layout) is in place — nothing functional yet, but the walls are up.

| # | Task | Points | Side | Acceptance Criteria |
|---|---|---|---|---|
| 1.1 | DB schema + Alembic migrations: `users`, `coins`, `watchlist`, `alerts` tables | 3 | Backend | Migrations run clean against Supabase; tables match schema in Feasibility Report §3 |
| 1.2 | Auth0 SDK integration (`@auth0/auth0-react`) | 3 | Frontend | Login/logout redirect works end-to-end against real Auth0 tenant |
| 1.3 | JWT verification middleware (JWKS-based) | 3 | Backend | Protected test endpoint returns 401 without token, 200 with valid Auth0 token |
| 1.4 | App-side user profile linkage by Auth0 `sub` | 2 | Backend | First login auto-creates a `users` row keyed by `sub` |
| 1.5 | Tailwind design tokens (glass fill/border/blur, color palette, type scale) | 3 | Frontend | Tokens match §4 of the finalized report; visually verified with a static test page |
| 1.6 | `<GlassCard>` base component | 2 | Frontend | Reusable, used in at least one placeholder screen |
| 1.7 | Mobile-first shell layout (bottom tab nav mobile, two-pane desktop skeleton) | 5 | Frontend | Verified at 375px and 1024px+ |
| 1.8 | CI pipeline (lint + test on PR) | 2 | Both | GitHub Actions passes on a trivial PR |
| 1.9 | Deploy skeleton to Cloudflare Pages + Render | 3 | Both | Live URL reachable, login flow works in production |

**Sprint 1 Total: 26 points**

**Definition of Done (sprint-specific):** A visitor can reach the live URL, log in via Auth0, see an empty but styled shell with the glass/mobile-first layout, and log out. No coin data yet.

**Risks/Notes:** Auth0 free-tier configuration (allowed callback URLs) is a common first-time stumbling block — budget extra time here if this is the team's first Auth0 integration.

**Demo Criteria:** Live login/logout on the deployed URL, shown on both a phone-width browser window and desktop.

---

## Sprint 2 — Core Price Tracking + Binance Filter
**Sprint Goal:** The dashboard shows real, live-ish coin prices from CoinGecko, filtered to Binance-listed coins by default.

| # | Task | Points | Side | Acceptance Criteria |
|---|---|---|---|---|
| 2.1 | Binance-listing sync job (`/exchanges/binance/tickers`, paginated) | 3 | Backend | `is_binance_listed` flag correctly populated for a spot-checked sample of 10 known Binance coins |
| 2.2 | Price-sync job (`/coins/markets`, every 5 min) | 5 | Backend | Coin table refreshes on schedule; verified via timestamp column |
| 2.3 | Redis caching layer for hot coin data | 3 | Backend | `/coins` endpoint reads from cache, falls back to DB if cache miss |
| 2.4 | `GET /coins?binance_only=true|false` endpoint | 3 | Backend | Returns correct filtered/unfiltered list, paginated |
| 2.5 | Dashboard coin list UI (glass cards, sortable) | 5 | Frontend | Matches design tokens; sortable by price/% change |
| 2.6 | Binance-only toggle (default ON) | 2 | Frontend | Toggle persists per session; default state confirmed ON |
| 2.7 | `GET /coins/{id}/history` + basic line chart on coin detail page | 5 | Both | Chart renders real historical data for at least one coin |
| 2.8 | Mobile responsive pass on dashboard + detail page | 3 | Frontend | Verified 375px, 768px, 1024px+ |

**Sprint 2 Total: 29 points**

**Definition of Done:** A logged-in user sees real, auto-refreshing Binance-listed coin prices on the dashboard, can toggle to see all coins, and can open a coin detail page with a price chart.

**Risks/Notes:** First real integration with CoinGecko's live rate limits — monitor for 429s during testing; retry/backoff logic can be deferred to Sprint 6 hardening unless it blocks development.

**Demo Criteria:** Live dashboard showing real current prices, toggle demonstrated, one coin detail page with chart.

---

## Sprint 3 — Gainers Leaderboard + Trending/Momentum Engine
**Sprint Goal:** Users can see top 30d/1y gainers and both trending-momentum views (pure % change and volume-adjusted), each filterable by Binance-listed status.

| # | Task | Points | Side | Acceptance Criteria |
|---|---|---|---|---|
| 3.1 | `GET /gainers?period=30d\|1y&binance_only=` endpoint | 3 | Backend | Correct ranking verified against a manual spot-check of 3 coins |
| 3.2 | Gainers leaderboard UI (30d/1y toggle) | 5 | Frontend | Matches design system, mobile responsive |
| 3.3 | Losers view (inverted sort) | 2 | Both | Same endpoint/UI pattern, `sort=asc` |
| 3.4 | Trending fetch job (`/search/trending`, every 15 min) | 2 | Backend | Trending list refreshes on schedule |
| 3.5 | Momentum Formula A (pure % change ranking) | 2 | Backend | Ranking logic unit-tested |
| 3.6 | Momentum Formula B (volume-adjusted score) | 5 | Backend | Formula from Feasibility Report §Feature 4 implemented and unit-tested with sample data |
| 3.7 | `GET /trending?method=&binance_only=` endpoint | 3 | Backend | Both methods return distinct, correctly-ranked lists |
| 3.8 | Trending UI — two labeled sections/tabs | 5 | Frontend | "Pure Movers" and "Volume-Backed Movers" both visible and clearly labeled, per user's explicit request to show both separately |

**Sprint 3 Total: 27 points**

**Definition of Done:** Gainers and trending pages are live, both momentum formulas are visibly separate (not merged into one list), all filterable by Binance-listed status.

**Risks/Notes:** Volume-adjusted formula (3.6) is the most judgment-heavy item this sprint — validate the ranking "feels right" against a few known recent pumps before considering it done, not just that it runs without errors.

**Demo Criteria:** Gainers leaderboard (30d and 1y), trending page showing both ranking methods side by side.

---

## Sprint 4 — News Aggregation & "Why It's Trending"
**Sprint Goal:** Trending coins show a plausible, auto-generated reason they're trending, backed by real news headlines.

| # | Task | Points | Side | Acceptance Criteria |
|---|---|---|---|---|
| 4.1 | News-sync job (CryptoPanic, every 15–30 min, tagged by currency) | 3 | Backend | News rows populated and correctly tagged for a sample of 5 coins |
| 4.2 | Correlate trending coins ↔ matching news (top 2–3 headlines each) | 3 | Backend | Verified against a live trending coin with known recent news |
| 4.3 | Rule-based "why trending" summary generator | 5 | Backend | Produces a short, sensible blurb using keyword tagging (e.g. "ETF filing," "exchange listing") for at least 5 test cases |
| 4.4 | `GET /news` + `GET /trending/{id}/reason` endpoints | 3 | Backend | Both return correctly shaped data |
| 4.5 | News feed page (chronological, filterable by coin) | 5 | Frontend | Matches design system, mobile responsive |
| 4.6 | "Why trending" expandable panel on trending coin cards | 3 | Frontend | Tapping/clicking reveals reason + source headlines |

**Sprint 4 Total: 22 points**

**Definition of Done:** Every coin on the trending page has an expandable "why" panel showing a real, headline-backed explanation — even if occasionally generic for low-news-volume coins (acceptable per Feasibility Report §2.5 known limitations).

**Risks/Notes:** Keyword-based reasoning (4.3) is intentionally simple for v1 — flag it clearly in the UI copy as "likely reason" rather than presenting it as certain fact, consistent with the disclaimer approach in §2.4 of the finalized report.

**Demo Criteria:** Open the "why trending" panel on 2–3 live trending coins and show the correlated headlines.

---

## Sprint 5 — Alerts: Telegram, Email, and the Dynamic Island
**Sprint Goal:** Users can set price alerts and receive them via Telegram or email, with the Dynamic Island acting as the in-app notification center.

| # | Task | Points | Side | Acceptance Criteria |
|---|---|---|---|---|
| 5.1 | Alerts table + CRUD endpoints | 3 | Backend | Create/list/delete alerts via API, scoped to logged-in user |
| 5.2 | Alert-check job (runs in existing price-sync cycle) | 3 | Backend | Triggers correctly when a test coin crosses a test threshold |
| 5.3 | Telegram bot linking flow (`/start` command → chat_id capture) | 5 | Backend | A test user can link their Telegram account and receive a test message |
| 5.4 | Telegram alert delivery | 2 | Backend | Real alert message received within one sync cycle of threshold breach |
| 5.5 | Email alert delivery (SMTP template) | 3 | Backend | Real email received, correctly formatted |
| 5.6 | Alerts management UI (set target price + channel) | 5 | Frontend | Matches design system; validates input (positive number, valid direction) |
| 5.7 | Telegram linking UI (show link/QR, confirmation state) | 3 | Frontend | Clear success/pending/failed states shown |
| 5.8 | Dynamic Island component — collapsed/expanded states | 5 | Frontend | Smooth morph animation; collapsed shows summary, expanded shows recent triggered alerts |
| 5.9 | Wire triggered alerts into the Island as the notification surface | 3 | Both | A triggered alert appears in the Island within one refresh cycle of the frontend polling |

**Sprint 5 Total: 32 points** *(heaviest sprint — consider splitting 5.8/5.9 into their own mini-sprint if running solo and behind schedule)*

**Definition of Done:** A user can set an alert, get notified via their chosen channel(s), and see it reflected live in the Dynamic Island notification center.

**Risks/Notes:** This is the most animation/interaction-heavy sprint (Island morph, §5.8) — budget extra time for polish and cross-device testing; respect `prefers-reduced-motion` per the design system's restraint checklist.

**Demo Criteria:** Set a live alert on a real coin, trigger it (or simulate a threshold crossing), show the Telegram/email message arriving and the Island updating.

---

## Sprint 6 — Watchlist, Hardening, Accessibility, Launch Prep
**Sprint Goal:** Round out the feature set, hardened and accessible enough to point real users at.

| # | Task | Points | Side | Acceptance Criteria |
|---|---|---|---|---|
| 6.1 | Watchlist table + CRUD endpoints | 2 | Backend | Add/remove/list working |
| 6.2 | Watchlist UI (star/pin, "My Coins" view) | 3 | Frontend | Matches design system |
| 6.3 | Rate-limit backoff/retry around CoinGecko/CryptoPanic calls | 3 | Backend | Job survives a simulated 429 without crashing or corrupting cache |
| 6.4 | Sentry error monitoring wired into backend + frontend | 2 | Both | Test error appears in Sentry dashboard |
| 6.5 | Accessibility pass (focus rings, contrast, reduced-motion) | 3 | Frontend | Manual audit against WCAG AA contrast on glass panels; keyboard-only nav works |
| 6.6 | Full responsive re-pass across all screens | 3 | Frontend | Every screen re-verified at 375px/768px/1024px+ |
| 6.7 | Core pytest suite (auth, price-sync, alert-trigger) | 5 | Backend | Tests pass in CI |
| 6.8 | "Not financial advice" disclaimer + attribution footer | 1 | Frontend | Visible on relevant pages |
| 6.9 | `README.md`, `CONTRIBUTING.md`, `LICENSE` finalized for open-source repo | 2 | Both | Repo is genuinely clone-and-run-able by a stranger following the README |
| 6.10 | Production smoke test across full user journey | 3 | Both | Signup → dashboard → set alert → receive alert → watchlist, all verified live |

**Sprint 6 Total: 27 points**

**Definition of Done:** The app is feature-complete against the MVP scope, passes an accessibility spot-check, has monitoring in place, and a stranger could clone the open-source repo and run it from the README alone.

**Risks/Notes:** Resist scope creep here — this sprint is about hardening what exists, not adding new features (portfolio tracking and other stretch goals belong in a post-MVP backlog, not squeezed into Sprint 6).

**Demo Criteria:** Full user journey walkthrough, live, start to finish.

---

## Velocity Tracking Template

| Sprint | Planned Points | Completed Points | Notes |
|---|---|---|---|
| 1 | 26 | — | |
| 2 | 29 | — | |
| 3 | 27 | — | |
| 4 | 22 | — | |
| 5 | 32 | — | |
| 6 | 27 | — | |

Fill in "Completed Points" at each retro. If actual velocity trends meaningfully below planned (e.g. consistently <70% completion), rebalance later sprints rather than pushing through — cut scope from Sprint 6 stretch items first (watchlist, accessibility polish) before cutting core features.

---

## Risk Register (project-level, not sprint-specific)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| CoinGecko changes free-tier limits/terms mid-project | Low-Medium | Medium | Architecture already isolates all external calls to background jobs — a rate limit change means adjusting cadence, not rearchitecting |
| Auth0 free-tier terms change | Low | Medium | JWT verification is standard; swapping identity providers later is contained to Sprint-1-equivalent work, not a full rewrite |
| Solo developer availability/burnout | Medium | High | §0.3 part-time adjustment built in; Sprint 6 explicitly protects against scope creep |
| "Why trending" reasoning is misleading if not caveated | Medium | Medium-High | UI copy explicitly labels it "likely reason," not fact — decided in Sprint 4 acceptance criteria |
| Render/Cloudflare free-tier cold starts hurt alert timeliness | Low-Medium | Medium | Flagged in Feasibility Report §2.5; upgrade path is a config change, not a rebuild |

---

## Post-MVP Backlog (not scheduled — for future sprint planning)

- Portfolio tracking (holdings + P&L) — was flagged as a stretch goal under Feature 7.
- Google/GitHub social login via Auth0 (config-only toggle, low effort whenever prioritized).
- LLM-based "why trending" summarization to replace/augment the rule-based v1 approach.
- SMS alerts via Twilio, if budget for paid notifications is approved later.
- Public API rate-limit tiers if the app grows well beyond ~10 concurrent users.
