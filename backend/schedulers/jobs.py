"""
Background Sync Jobs.
Executed periodically by APScheduler worker process.
The frontend NEVER calls external APIs directly; all market data ingestion happens here.
"""
import logging
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert

from core.coingecko import coingecko_client
from core.redis import set_json
from db.database import AsyncSessionLocal
from db.models import Coin

logger = logging.getLogger(__name__)


async def sync_binance_listings():
    """
    Task 2.1 — Binance-listing sync job.
    Fetches all CoinGecko IDs currently listed on Binance.
    Updates `is_binance_listed` boolean flag in PostgreSQL `coins` table.
    """
    logger.info("Starting Binance listings synchronization job...")
    binance_coin_ids = await coingecko_client.fetch_binance_listed_coin_ids()
    if not binance_coin_ids:
        logger.warning("No Binance coin IDs fetched. Skipping update.")
        return

    async with AsyncSessionLocal() as session:
        try:
            # 1. Reset all coins to false first or update matched coins
            await session.execute(update(Coin).values(is_binance_listed=False))
            await session.commit()

            # 2. Update matched Binance coins
            for coin_id in binance_coin_ids:
                stmt = (
                    update(Coin)
                    .where(Coin.id == coin_id)
                    .values(is_binance_listed=True)
                )
                await session.execute(stmt)

            await session.commit()
            logger.info(f"Binance listings sync completed for {len(binance_coin_ids)} coins.")
        except Exception as exc:
            await session.rollback()
            logger.error(f"Failed to update Binance listings in DB: {exc}")


async def sync_coin_prices():
    """
    Task 2.2 & 2.3 — Price-sync job & Redis hot cache update.
    Fetches market prices, volume, market cap, and % change fields from CoinGecko.
    Upserts into PostgreSQL database and caches hot list in Redis (5-min TTL).
    """
    logger.info("Starting coin price synchronization job...")
    raw_coins = await coingecko_client.fetch_coins_markets(pages=2, per_page=250)
    if not raw_coins:
        logger.warning("No coin market data fetched. Skipping price sync.")
        return

    now = datetime.now(timezone.utc)
    cached_coins_all = []
    cached_coins_binance = []

    async with AsyncSessionLocal() as session:
        try:
            # Fetch existing Binance listed flags to preserve them on upsert
            existing_binance_res = await session.execute(select(Coin.id, Coin.is_binance_listed))
            binance_map = {row[0]: row[1] for row in existing_binance_res.all()}

            for item in raw_coins:
                coin_id = item["id"]
                symbol = item["symbol"].lower()
                name = item["name"]
                image = item.get("image")
                is_binance = binance_map.get(coin_id, False)

                current_price = item.get("current_price")
                market_cap = item.get("market_cap")
                total_volume = item.get("total_volume")
                rank = item.get("market_cap_rank")

                pct_24h = item.get("price_change_percentage_24h_in_currency") or item.get("price_change_percentage_24h")
                pct_7d = item.get("price_change_percentage_7d_in_currency")
                pct_30d = item.get("price_change_percentage_30d_in_currency")
                pct_1y = item.get("price_change_percentage_1y_in_currency")

                coin_dict = {
                    "id": coin_id,
                    "symbol": symbol,
                    "name": name,
                    "image": image,
                    "is_binance_listed": is_binance,
                    "current_price": current_price,
                    "market_cap": market_cap,
                    "total_volume": total_volume,
                    "price_change_percentage_24h": pct_24h,
                    "price_change_percentage_7d": pct_7d,
                    "price_change_percentage_30d": pct_30d,
                    "price_change_percentage_1y": pct_1y,
                    "market_cap_rank": rank,
                    "last_updated": now.isoformat(),
                }

                cached_coins_all.append(coin_dict)
                if is_binance:
                    cached_coins_binance.append(coin_dict)

                # PostgreSQL Upsert (ON CONFLICT DO UPDATE)
                stmt = insert(Coin).values(
                    id=coin_id,
                    symbol=symbol,
                    name=name,
                    image=image,
                    is_binance_listed=is_binance,
                    current_price=current_price,
                    market_cap=market_cap,
                    total_volume=total_volume,
                    price_change_percentage_24h=pct_24h,
                    price_change_percentage_7d=pct_7d,
                    price_change_percentage_30d=pct_30d,
                    price_change_percentage_1y=pct_1y,
                    market_cap_rank=rank,
                    last_updated=now,
                )
                stmt = stmt.on_conflict_do_update(
                    index_elements=[Coin.id],
                    set_={
                        "symbol": symbol,
                        "name": name,
                        "image": image,
                        "current_price": current_price,
                        "market_cap": market_cap,
                        "total_volume": total_volume,
                        "price_change_percentage_24h": pct_24h,
                        "price_change_percentage_7d": pct_7d,
                        "price_change_percentage_30d": pct_30d,
                        "price_change_percentage_1y": pct_1y,
                        "market_cap_rank": rank,
                        "last_updated": now,
                    },
                )
                await session.execute(stmt)

            await session.commit()
            logger.info(f"Upserted {len(raw_coins)} coins into PostgreSQL.")

            # Update Redis Hot Cache (5-minute TTL)
            await set_json("coins:all", cached_coins_all, ttl_seconds=300)
            await set_json("coins:binance", cached_coins_binance, ttl_seconds=300)
            logger.info("Updated Redis hot cache keys 'coins:all' and 'coins:binance'.")

        except Exception as exc:
            await session.rollback()
            logger.error(f"Failed to sync coin prices: {exc}")
