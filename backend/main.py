"""
FastAPI application entry point.
All external API calls (CoinGecko, CryptoPanic) happen ONLY in background jobs.
Frontend-facing endpoints read exclusively from PostgreSQL/Redis.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from routers import alerts, coins, health, users, watchlist

app = FastAPI(
    title="CryptoApp API",
    description="Crypto tracker backend — prices, gainers, trending, alerts.",
    version="0.1.0",
)

# CORS — allow the Cloudflare Pages frontend (read strictly from env CORS_ORIGINS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router)
app.include_router(users.router)
app.include_router(coins.router)
app.include_router(alerts.router)
app.include_router(watchlist.router)
