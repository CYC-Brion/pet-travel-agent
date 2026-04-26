import time
from helper import fetch_qweather_now, fetch_qweather_forecast, fetch_qweather_minutely, fetch_qweather_indices


def weather_subagent(city):
    """Fetch qweather APIs and return envelopes plus elapsed time."""
    start = time.time()
    try:
        now = fetch_qweather_now(city)
        forecast = fetch_qweather_forecast(city, 3)
        minutely = fetch_qweather_minutely(city)
        indices = fetch_qweather_indices(city, days=1, index_type="0")
    except Exception:
        now = {"ok": False, "data": None}
        forecast = {"ok": False, "data": None}
        minutely = {"ok": False, "data": None}
        indices = {"ok": False, "data": None}
    return {
        "weather_now_env": now,
        "weather_forecast_env": forecast,
        "weather_minutely_env": minutely,
        "weather_indices_env": indices,
        "elapsed": time.time() - start,
    }
