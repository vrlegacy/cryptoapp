from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import get_current_user
from db.database import get_db
from db.models import Alert, User

router = APIRouter(prefix="/alerts", tags=["alerts"])


class AlertCreate(BaseModel):
    coin_id: str
    target_price: float = Field(gt=0)
    direction: str = Field(pattern="^(above|below)$")
    channel: str = Field(pattern="^(telegram|email)$")


@router.get("")
async def list_alerts(
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lists all price alerts for the current authenticated user."""
    sub = payload["sub"]
    user_res = await db.execute(select(User).where(User.auth0_sub == sub))
    user = user_res.scalar_one_or_none()
    if not user:
        return []

    result = await db.execute(
        select(Alert).where(Alert.user_id == user.id).order_by(Alert.created_at.desc())
    )
    alerts = result.scalars().all()

    return [
        {
            "id": str(alert.id),
            "coin_id": alert.coin_id,
            "target_price": alert.target_price,
            "direction": alert.direction,
            "channel": alert.channel,
            "status": alert.status,
            "created_at": alert.created_at.isoformat(),
            "triggered_at": alert.triggered_at.isoformat() if alert.triggered_at else None,
        }
        for alert in alerts
    ]


@router.post("", status_code=201)
async def create_alert(
    body: AlertCreate,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Creates a new price alert for the current authenticated user."""
    sub = payload["sub"]
    user_res = await db.execute(select(User).where(User.auth0_sub == sub))
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User profile not initialized.",
        )

    alert = Alert(
        user_id=user.id,
        coin_id=body.coin_id,
        target_price=body.target_price,
        direction=body.direction,
        channel=body.channel,
        status="active",
    )
    db.add(alert)
    await db.flush()

    return {
        "id": str(alert.id),
        "coin_id": alert.coin_id,
        "target_price": alert.target_price,
        "direction": alert.direction,
        "channel": alert.channel,
        "status": alert.status,
        "created_at": alert.created_at.isoformat(),
    }


@router.delete("/{alert_id}", status_code=204)
async def delete_alert(
    alert_id: str,
    payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deletes an alert by ID for the current authenticated user."""
    sub = payload["sub"]
    user_res = await db.execute(select(User).where(User.auth0_sub == sub))
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Alert not found")

    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.user_id == user.id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    await db.delete(alert)
    return None
