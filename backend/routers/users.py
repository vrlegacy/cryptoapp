from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import get_current_user
from db.database import get_db
from db.models import User

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/me", status_code=201)
async def upsert_me(
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Called after Auth0 login. Creates a user row if one doesn't exist yet,
    or returns the existing one. Keyed by Auth0 sub.
    """
    sub = payload["sub"]
    email = payload.get("email")

    result = await db.execute(select(User).where(User.auth0_sub == sub))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(auth0_sub=sub, email=email)
        db.add(user)
        await db.flush()

    return {
        "id": str(user.id),
        "auth0_sub": user.auth0_sub,
        "email": user.email,
        "telegram_chat_id": user.telegram_chat_id,
        "created_at": user.created_at.isoformat(),
    }


@router.get("/me")
async def get_me(
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns current authenticated user's profile."""
    sub = payload["sub"]
    result = await db.execute(select(User).where(User.auth0_sub == sub))
    user = result.scalar_one_or_none()
    if user is None:
        return {"detail": "User not found — call POST /users/me first."}
    return {
        "id": str(user.id),
        "auth0_sub": user.auth0_sub,
        "email": user.email,
        "telegram_chat_id": user.telegram_chat_id,
        "created_at": user.created_at.isoformat(),
    }
