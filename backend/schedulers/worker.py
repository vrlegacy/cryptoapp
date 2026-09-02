"""
Background worker entry point.
APScheduler runs here — registers price and Binance listing sync jobs.
"""
import asyncio
import logging

from apscheduler.schedulers.blocking import BlockingScheduler

from schedulers.jobs import sync_binance_listings, sync_coin_prices

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

scheduler = BlockingScheduler()


def run_sync_coin_prices():
    logger.info("Executing scheduled sync_coin_prices job...")
    asyncio.run(sync_coin_prices())


def run_sync_binance_listings():
    logger.info("Executing scheduled sync_binance_listings job...")
    asyncio.run(sync_binance_listings())


# 1. Price sync every 5 minutes
scheduler.add_job(run_sync_coin_prices, "interval", minutes=5, id="sync_coin_prices")

# 2. Binance listing sync once a day
scheduler.add_job(run_sync_binance_listings, "interval", hours=24, id="sync_binance_listings")

if __name__ == "__main__":
    logger.info("Starting CryptoApp background worker...")
    # Initial sync on worker startup
    try:
        logger.info("Running initial sync on startup...")
        run_sync_coin_prices()
        run_sync_binance_listings()
    except Exception as exc:
        logger.error(f"Error during initial worker sync: {exc}")

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Worker stopped.")
