# Project Overview — Crypto Tracker Platform

*A plain-language explanation of what this project is, why it's built the way it is, and where things stand. Read this first if you're new to the project — for implementation-level detail, see the Finalized Project Report and Sprint Planner.*

## What is this?

A website (and eventually mobile-responsive web app) where people can:
- See live-ish crypto prices, but **only for coins actually listed on Binance** by default (with an option to see everything CoinGecko tracks).
- See which coins gained the most over the last month and the last year.
- See what's "trending" right now — ranked two different ways side by side, so a user can judge momentum both by raw price movement and by whether that movement is backed by real trading volume.
- Read a short, auto-generated explanation of *why* a coin is trending, sourced from real news headlines.
- Set price alerts and get notified by Telegram or email when a coin crosses a target price.
- Keep a personal watchlist of coins they care about.

It's a public, multi-user app — anyone can sign up and use it, not just a personal tool for one person.

## Why was it built this way?

A few decisions shaped everything else, worth understanding upfront:

**1. Everything runs on free-tier services, by design, not by accident.** The frontend is on Cloudflare Pages, the backend on Render, the database on Supabase, authentication through Auth0, and all the market/news data comes from free APIs (CoinGecko, CryptoPanic). This keeps running costs at effectively $0/month for the expected scale (~10 concurrent users), and the architecture is built so that staying on free tiers doesn't mean cutting corners on features.

**2. The app never lets your browser talk to CoinGecko directly.** This is the single most important engineering decision in the whole system. Free APIs limit how many requests you can make per minute. If every visitor's browser called CoinGecko on its own, the app would get rate-limited almost immediately. Instead, a background job on the server checks prices every few minutes, and your browser only ever talks to *our own* server, which serves data instantly from its own cache. This is invisible to users but is why the app can scale to more users without breaking.

**3. "Binance-listed" status comes from CoinGecko, not Binance.** It might seem more obvious to check Binance's own systems for "is this coin on Binance," but ticker symbols get reused across different coins on different exchanges (two unrelated coins can both be called "XYZ" on two different exchanges). CoinGecko has its own reliable mapping of exactly which of *its* coins currently trade on Binance, so using that mapping avoids a whole class of "wrong coin flagged" bugs.

**4. The visual design is intentional, not default.** The interface uses a glass, translucent look (glassmorphism) and borrows Apple's "Dynamic Island" idea — a small floating pill at the top of the screen. Rather than being pure decoration, that island is repurposed as the app's notification center: it shows a quick summary when collapsed, and expands to show your recent triggered price alerts. Every screen is designed mobile-first, since that's the harder constraint to retrofit later.

**5. "Why is this trending" is a best-effort explanation, not a fact.** There's no reliable way to know for certain why a coin is moving. The app cross-references trending coins against recent news headlines and produces a short, honestly-labeled "likely reason" rather than presenting a guess as certain fact.

## What's NOT in this version

To keep scope realistic, the following are deliberately excluded from the first version:
- Actual trading or wallet connection — this is a tracking tool, not an exchange.
- Portfolio/profit-and-loss tracking — flagged as a future addition.
- SMS alerts — Telegram and email were chosen because both are free; SMS costs money per message and was explicitly dropped for that reason.
- True real-time, tick-by-tick price streaming — prices refresh every few minutes, which is enough for a tracking dashboard (not a trading terminal).

## Where things stand

Check `SPRINT_PLANNER.md` for the live, sprint-by-sprint build status. As of this document, the project is fully planned but pre-development — Sprint 1 (foundational setup: authentication, database schema, base design system) has not yet started.

## Who should read what

| If you are... | Read this |
|---|---|
| A new team member trying to understand the "why" | This document |
| A developer picking up a sprint task | `SPRINT_PLANNER.md` |
| Someone wanting the full technical/architectural detail, cost breakdown, and design spec | `FINAL_PROJECT_REPORT.md` |
| An AI coding assistant about to work on the codebase | `AI_CONTEXT_HANDOFF.md` |
