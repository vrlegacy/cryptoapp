import math

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy import asc, desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.coingecko import coingecko_client
from core.redis import get_json, set_json
from db.database import get_db
from db.models import Coin
from schedulers.jobs import sync_coin_prices

router = APIRouter(prefix="/coins", tags=["coins"])


@router.post("/sync")
async def force_sync_prices():
    """
    Manually forces a CoinGecko sync for prices and updates DB & Redis.
    Called from frontend to refresh data instantly.
    """
    try:
        await sync_coin_prices()
        return {"status": "success", "message": "Market data synced successfully"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(exc)}")


@router.get("")
async def get_coins(
    binance_only: bool = Query(default=True),
    search: str | None = Query(default=None),
    sort_by: str = Query(default="market_cap_rank"),
    order: str = Query(default="asc"),
    limit: int = Query(default=50, le=250),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns coin list.
    Reads from Redis hot cache if available, falling back to PostgreSQL DB.
    """
    cache_key = "coins:binance" if binance_only else "coins:all"
    cached_coins = await get_json(cache_key)

    if cached_coins and isinstance(cached_coins, list) and not search:
        # Filter and paginate from cache
        coins_data = cached_coins
        if sort_by:
            reverse = order.lower() == "desc"
            coins_data = sorted(
                coins_data,
                key=lambda c: c.get(sort_by) if c.get(sort_by) is not None else float("-inf" if reverse else "inf"),
                reverse=reverse,
            )
        return coins_data[offset : offset + limit]

    # Database Fallback
    query = select(Coin)
    if binance_only:
        query = query.where(Coin.is_binance_listed.is_(True))

    if search:
        pattern = f"%{search.lower()}%"
        query = query.where((Coin.name.ilike(pattern)) | (Coin.symbol.ilike(pattern)))

    sort_col = getattr(Coin, sort_by, Coin.market_cap_rank)
    if order.lower() == "desc":
        query = query.order_by(desc(sort_col).nulls_last())
    else:
        query = query.order_by(asc(sort_col).nulls_last())

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    coins = result.scalars().all()

    formatted = [
        {
            "id": coin.id,
            "symbol": coin.symbol,
            "name": coin.name,
            "image": coin.image,
            "is_binance_listed": coin.is_binance_listed,
            "current_price": coin.current_price,
            "market_cap": coin.market_cap,
            "total_volume": coin.total_volume,
            "price_change_percentage_24h": coin.price_change_percentage_24h,
            "price_change_percentage_7d": coin.price_change_percentage_7d,
            "price_change_percentage_30d": coin.price_change_percentage_30d,
            "price_change_percentage_1y": coin.price_change_percentage_1y,
            "market_cap_rank": coin.market_cap_rank,
            "last_updated": coin.last_updated.isoformat() if coin.last_updated else None,
        }
        for coin in coins
    ]

    return formatted


@router.get("/gainers")
async def get_gainers(
    period: str = Query(default="30d"),  # "30d" | "1y"
    binance_only: bool = Query(default=True),
    limit: int = Query(default=20, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Returns top gainer coins for the specified period."""
    query = select(Coin)

    if binance_only:
        query = query.where(Coin.is_binance_listed.is_(True))

    if period == "1y":
        query = query.where(Coin.price_change_percentage_1y.is_not(None))
        query = query.order_by(desc(Coin.price_change_percentage_1y))
    else:
        query = query.where(Coin.price_change_percentage_30d.is_not(None))
        query = query.order_by(desc(Coin.price_change_percentage_30d))

    query = query.limit(limit)
    result = await db.execute(query)
    coins = result.scalars().all()

    return [
        {
            "id": coin.id,
            "symbol": coin.symbol,
            "name": coin.name,
            "image": coin.image,
            "is_binance_listed": coin.is_binance_listed,
            "current_price": coin.current_price,
            "price_change_percentage": (
                coin.price_change_percentage_1y if period == "1y" else coin.price_change_percentage_30d
            ),
            "market_cap_rank": coin.market_cap_rank,
        }
        for coin in coins
    ]


@router.get("/trending")
async def get_trending(
    method: str = Query(default="pure"),  # "pure" | "volume_adjusted"
    binance_only: bool = Query(default=True),
    limit: int = Query(default=10, le=50),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns trending/momentum coins.
    Method 'pure': ranks by 24h % change.
    Method 'volume_adjusted': ranks by score = %change_24h * log(total_volume + 1).
    """
    query = select(Coin)

    if binance_only:
        query = query.where(Coin.is_binance_listed.is_(True))

    if method == "pure":
        query = query.where(Coin.price_change_percentage_24h.is_not(None))
        query = query.order_by(desc(Coin.price_change_percentage_24h)).limit(limit)
        result = await db.execute(query)
        coins = result.scalars().all()
    else:
        query = query.where(
            Coin.price_change_percentage_24h.is_not(None),
            Coin.total_volume.is_not(None),
        ).limit(100)
        result = await db.execute(query)
        candidates = result.scalars().all()

        def compute_score(c: Coin) -> float:
            pct = c.price_change_percentage_24h or 0.0
            vol = c.total_volume or 1.0
            return pct * math.log10(max(vol, 1.0))

        candidates.sort(key=compute_score, reverse=True)
        coins = candidates[:limit]

    return [
        {
            "id": coin.id,
            "symbol": coin.symbol,
            "name": coin.name,
            "image": coin.image,
            "is_binance_listed": coin.is_binance_listed,
            "current_price": coin.current_price,
            "total_volume": coin.total_volume,
            "price_change_percentage_24h": coin.price_change_percentage_24h,
            "market_cap_rank": coin.market_cap_rank,
        }
        for coin in coins
    ]


@router.get("/{coin_id}/history")
async def get_coin_history(
    coin_id: str,
    days: int = Query(default=7, ge=1, le=365),
):
    """
    Task 2.7 — Historical market chart price series for charting.
    Cached in Redis for 15 minutes.
    """
    cache_key = f"coin:history:{coin_id}:{days}"
    cached_history = await get_json(cache_key)
    if cached_history:
        return cached_history

    history = await coingecko_client.fetch_coin_history(coin_id=coin_id, days=days)
    if history:
        await set_json(cache_key, history, ttl_seconds=900)  # 15-minute TTL
    return history


@router.get("/{coin_id}")
async def get_coin_detail(coin_id: str, db: AsyncSession = Depends(get_db)):
    """Returns single coin details by ID."""
    result = await db.execute(select(Coin).where(Coin.id == coin_id))
    coin = result.scalar_one_or_none()
    if not coin:
        raise HTTPException(status_code=404, detail="Coin not found")
    return {
        "id": coin.id,
        "symbol": coin.symbol,
        "name": coin.name,
        "image": coin.image,
        "is_binance_listed": coin.is_binance_listed,
        "current_price": coin.current_price,
        "market_cap": coin.market_cap,
        "total_volume": coin.total_volume,
        "price_change_percentage_24h": coin.price_change_percentage_24h,
        "price_change_percentage_7d": coin.price_change_percentage_7d,
        "price_change_percentage_30d": coin.price_change_percentage_30d,
        "price_change_percentage_1y": coin.price_change_percentage_1y,
        "market_cap_rank": coin.market_cap_rank,
        "last_updated": coin.last_updated.isoformat() if coin.last_updated else None,
    }
