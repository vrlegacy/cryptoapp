"""
FastAPI application entry point.
All external API calls (CoinGecko, CryptoPanic) happen ONLY in background jobs.
Frontend-facing endpoints read exclusively from PostgreSQL/Redis.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from routers import health, users

app = FastAPI(
    title="CryptoApp API",
    description="Crypto tracker backend — prices, gainers, trending, alerts.",
    version="0.1.0",
)

# CORS — allow the Cloudflare Pages frontend (and local dev)
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
