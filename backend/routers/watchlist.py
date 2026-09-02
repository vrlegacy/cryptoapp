from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import get_current_user
from db.database import get_db
from db.models import Watchlist, User, Coin

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.get("")
async def get_watchlist(
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns watchlisted coins for the current authenticated user."""
    sub = payload["sub"]
    user_res = await db.execute(select(User).where(User.auth0_sub == sub))
    user = user_res.scalar_one_or_none()
    if not user:
        return []

    result = await db.execute(
        select(Coin)
        .join(Watchlist, Watchlist.coin_id == Coin.id)
        .where(Watchlist.user_id == user.id)
    )
    coins = result.scalars().all()

    return [
        {
            "id": coin.id,
            "symbol": coin.symbol,
            "name": coin.name,
            "image": coin.image,
            "is_binance_listed": coin.is_binance_listed,
            "current_price": coin.current_price,
            "price_change_percentage_24h": coin.price_change_percentage_24h,
            "market_cap_rank": coin.market_cap_rank,
        }
        for coin in coins
    ]


@router.post("/{coin_id}", status_code=201)
async def add_to_watchlist(
    coin_id: str,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Adds a coin to the current user's watchlist."""
    sub = payload["sub"]
    user_res = await db.execute(select(User).where(User.auth0_sub == sub))
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User profile not initialized.",
        )

    # Check if coin exists
    coin_res = await db.execute(select(Coin).where(Coin.id == coin_id))
    if not coin_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Coin not found")

    # Check if already added
    existing = await db.execute(
        select(Watchlist).where(Watchlist.user_id == user.id, Watchlist.coin_id == coin_id)
    )
    if existing.scalar_one_or_none():
        return {"detail": "Already in watchlist"}

    item = Watchlist(user_id=user.id, coin_id=coin_id)
    db.add(item)
    return {"detail": "Added to watchlist", "coin_id": coin_id}


@router.delete("/{coin_id}", status_code=204)
async def remove_from_watchlist(
    coin_id: str,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Removes a coin from the current user's watchlist."""
    sub = payload["sub"]
    user_res = await db.execute(select(User).where(User.auth0_sub == sub))
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Watchlist item not found")

    result = await db.execute(
        select(Watchlist).where(Watchlist.user_id == user.id, Watchlist.coin_id == coin_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")

    await db.delete(item)
    return None
