"""
Async Redis Cache Manager.
Used for caching hot market data, trending ranks, and coin history series.
"""
import json
import logging

import redis.asyncio as redis

from core.config import settings

logger = logging.getLogger(__name__)

_redis_client: redis.Redis | None = None


def get_redis_client() -> redis.Redis | None:
    global _redis_client
    if _redis_client is None and settings.redis_url:
        try:
            _redis_client = redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
            logger.info("Async Redis client initialized.")
        except Exception as exc:
            logger.error(f"Failed to initialize Redis client: {exc}")
            _redis_client = None
    return _redis_client


async def get_json(key: str) -> dict | list | None:
    client = get_redis_client()
    if not client:
        return None
    try:
        data = await client.get(key)
        if data:
            return json.loads(data)
    except Exception as exc:
        logger.error(f"Redis get_json error for key '{key}': {exc}")
    return None


async def set_json(key: str, data: dict | list, ttl_seconds: int = 300) -> bool:
    client = get_redis_client()
    if not client:
        return False
    try:
        serialized = json.dumps(data)
        await client.set(key, serialized, ex=ttl_seconds)
        return True
    except Exception as exc:
        logger.error(f"Redis set_json error for key '{key}': {exc}")
        return False


async def delete_key(key: str) -> bool:
    client = get_redis_client()
    if not client:
        return False
    try:
        await client.delete(key)
        return True
    except Exception as exc:
        logger.error(f"Redis delete_key error for key '{key}': {exc}")
        return False
