"""
SQLAlchemy 2.0 ORM models.
All tables use CoinGecko coin IDs as foreign keys where applicable.
Users are keyed by Auth0 sub — no passwords stored here.
"""
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    auth0_sub: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telegram_chat_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    alerts: Mapped[list["Alert"]] = relationship("Alert", back_populates="user", cascade="all, delete-orphan")
    watchlist: Mapped[list["Watchlist"]] = relationship("Watchlist", back_populates="user", cascade="all, delete-orphan")


class Coin(Base):
    __tablename__ = "coins"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)  # CoinGecko coin ID e.g. "bitcoin"
    symbol: Mapped[str] = mapped_column(String(20), index=True)
    name: Mapped[str] = mapped_column(String(255))
    image: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_binance_listed: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Price data cached from CoinGecko /coins/markets
    current_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    market_cap: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_volume: Mapped[float | None] = mapped_column(Float, nullable=True)
    price_change_percentage_24h: Mapped[float | None] = mapped_column(Float, nullable=True)
    price_change_percentage_7d: Mapped[float | None] = mapped_column(Float, nullable=True)
    price_change_percentage_30d: Mapped[float | None] = mapped_column(Float, nullable=True)
    price_change_percentage_1y: Mapped[float | None] = mapped_column(Float, nullable=True)
    market_cap_rank: Mapped[int | None] = mapped_column(nullable=True)

    last_updated: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    alerts: Mapped[list["Alert"]] = relationship("Alert", back_populates="coin")
    watchlist: Mapped[list["Watchlist"]] = relationship("Watchlist", back_populates="coin")
    news: Mapped[list["News"]] = relationship("News", back_populates="coin")


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    coin_id: Mapped[str] = mapped_column(ForeignKey("coins.id", ondelete="CASCADE"), nullable=False)
    target_price: Mapped[float] = mapped_column(Float, nullable=False)
    direction: Mapped[str] = mapped_column(String(10), nullable=False)  # "above" | "below"
    channel: Mapped[str] = mapped_column(String(20), nullable=False)     # "telegram" | "email"
    status: Mapped[str] = mapped_column(String(20), default="active")    # "active" | "triggered" | "cancelled"
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    triggered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="alerts")
    coin: Mapped["Coin"] = relationship("Coin", back_populates="alerts")


class Watchlist(Base):
    __tablename__ = "watchlist"
    __table_args__ = (UniqueConstraint("user_id", "coin_id", name="uq_watchlist_user_coin"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    coin_id: Mapped[str] = mapped_column(ForeignKey("coins.id", ondelete="CASCADE"), nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="watchlist")
    coin: Mapped["Coin"] = relationship("Coin", back_populates="watchlist")


class News(Base):
    __tablename__ = "news"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    coin_id: Mapped[str | None] = mapped_column(ForeignKey("coins.id", ondelete="SET NULL"), nullable=True, index=True)
    external_id: Mapped[str] = mapped_column(String(255), unique=True)   # CryptoPanic article ID
    title: Mapped[str] = mapped_column(Text)
    url: Mapped[str] = mapped_column(Text)
    source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    votes_positive: Mapped[int] = mapped_column(default=0)
    votes_negative: Mapped[int] = mapped_column(default=0)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    coin: Mapped["Coin | None"] = relationship("Coin", back_populates="news")
