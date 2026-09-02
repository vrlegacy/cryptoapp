"""
Background worker entry point.
APScheduler runs here — all scheduled jobs are registered in this file.
The frontend NEVER calls external APIs directly; all external calls happen here.

Sprint 2+ will add:
  - price_sync_job (every 5 min)
  - binance_listing_sync_job (daily)
  - trending_sync_job (every 15 min)
  - news_sync_job (every 15-30 min)
  - alert_check_job (every 5 min, after price sync)
"""
import logging
import time

from apscheduler.schedulers.blocking import BlockingScheduler

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

scheduler = BlockingScheduler()


def heartbeat():
    """Placeholder job — replaced with real sync jobs in Sprint 2."""
    logger.info("Worker heartbeat — scheduler running. Real jobs added Sprint 2+.")


scheduler.add_job(heartbeat, "interval", minutes=5, id="heartbeat")

if __name__ == "__main__":
    logger.info("Starting CryptoApp background worker...")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Worker stopped.")
