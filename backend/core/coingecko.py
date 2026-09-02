"""
CoinGecko API async client wrapper.
Handles rate limiting and backoff natively.
Used EXCLUSIVELY by backend background scheduler jobs.
"""
import asyncio
import logging

import httpx

logger = logging.getLogger(__name__)

COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3"


class CoinGeckoAPI:
    def __init__(self):
        self.headers = {"accept": "application/json"}

    async def _get(self, endpoint: str, params: dict | None = None) -> dict | list:
        url = f"{COINGECKO_BASE_URL}{endpoint}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            for attempt in range(1, 4):
                try:
                    resp = await client.get(url, params=params, headers=self.headers)
                    if resp.status_code == 429:
                        wait = attempt * 5
                        logger.warning(f"CoinGecko 429 Rate Limited. Retrying in {wait}s...")
                        await asyncio.sleep(wait)
                        continue
                    resp.raise_for_status()
                    return resp.json()
                except (httpx.HTTPError, httpx.TimeoutException) as exc:
                    logger.error(f"CoinGecko API error on {endpoint} (attempt {attempt}): {exc}")
                    if attempt == 3:
                        raise
                    await asyncio.sleep(attempt * 2)
        return {}

    async def fetch_binance_listed_coin_ids(self) -> set[str]:
        """
        Paginates /exchanges/binance/tickers to extract every CoinGecko coin ID
        that is currently traded on Binance.
        """
        binance_coin_ids: set[str] = set()
        page = 1
        max_pages = 10  # Cover top traded tickers on Binance

        logger.info("Fetching Binance-listed tickers from CoinGecko...")
        while page <= max_pages:
            try:
                data = await self._get(
                    "/exchanges/binance/tickers",
                    params={"page": page, "order": "trust_score_desc"},
                )
                tickers = data.get("tickers", []) if isinstance(data, dict) else []
                if not tickers:
                    break

                for ticker in tickers:
                    coin_id = ticker.get("coin_id")
                    if coin_id:
                        binance_coin_ids.add(coin_id)

                page += 1
                await asyncio.sleep(1.5)  # Respect free tier rate limits
            except Exception as exc:
                logger.error(f"Error fetching Binance tickers page {page}: {exc}")
                break

        logger.info(f"Found {len(binance_coin_ids)} Binance-listed coins on CoinGecko.")
        return binance_coin_ids

    async def fetch_coins_markets(self, pages: int = 2, per_page: int = 250) -> list[dict]:
        """
        Fetches market data including 24h, 7d, 30d, 1y price change percentages.
        """
        all_coins: list[dict] = []
        for page in range(1, pages + 1):
            try:
                data = await self._get(
                    "/coins/markets",
                    params={
                        "vs_currency": "usd",
                        "order": "market_cap_desc",
                        "per_page": per_page,
                        "page": page,
                        "sparkline": "false",
                        "price_change_percentage": "24h,7d,30d,1y",
                    },
                )
                if isinstance(data, list):
                    all_coins.extend(data)
                await asyncio.sleep(1.5)
            except Exception as exc:
                logger.error(f"Error fetching coins/markets page {page}: {exc}")
                break
        return all_coins

    async def fetch_coin_history(self, coin_id: str, days: int = 7) -> dict:
        """
        Fetches market chart historical data for rendering price charts.
        """
        try:
            data = await self._get(
                f"/coins/{coin_id}/market_chart",
                params={"vs_currency": "usd", "days": days},
            )
            return data if isinstance(data, dict) else {}
        except Exception as exc:
            logger.error(f"Error fetching market chart for {coin_id}: {exc}")
            return {}


coingecko_client = CoinGeckoAPI()
