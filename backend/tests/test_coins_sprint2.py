import pytest
from core.coingecko import CoinGeckoAPI


@pytest.mark.asyncio
async def test_coingecko_client_instantiation():
    client = CoinGeckoAPI()
    assert client.headers["accept"] == "application/json"


def test_trending_formula():
    import math
    pct_24h = 15.5
    volume = 50000000.0
    score = pct_24h * math.log10(max(volume, 1.0))
    assert score > 0
    assert round(score, 2) == 119.33
