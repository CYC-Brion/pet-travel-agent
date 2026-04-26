import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta

from agent2_rules import rule_evaluator
from agent2_weather import weather_subagent
from agent2_gaode import gaode_subagent
from agent2_serpapi import hotels_subagent, maps_subagent, flights_subagent


def _serpapi_subagent(city: str, trip_context: dict):
    """2D — runs all three SerpAPI calls and merges results."""
    travel_date = trip_context.get("date", "")
    trip_days = 1
    try:
        trip_days = int(trip_context.get("days", 1))
    except Exception:
        pass

    check_in = ""
    check_out = ""
    try:
        parsed = datetime.strptime(str(travel_date), "%Y-%m-%d")
        check_in = parsed.strftime("%Y-%m-%d")
        check_out = (parsed + timedelta(days=max(trip_days, 1))).strftime("%Y-%m-%d")
    except Exception:
        pass

    departure_id = trip_context.get("departure_id", "")
    arrival_id = trip_context.get("arrival_id", "")
    return_date = trip_context.get("return_date", "")

    hotels_arg = (city, check_in, check_out) if check_in else None
    flights_arg = (departure_id, arrival_id, check_in, return_date) if (departure_id and arrival_id and check_in) else None

    with ThreadPoolExecutor(max_workers=3) as ex:
        f_hotels  = ex.submit(hotels_subagent, *hotels_arg) if hotels_arg else None
        f_maps    = ex.submit(maps_subagent, city)
        f_flights = ex.submit(flights_subagent, *flights_arg) if flights_arg else None

        hotels  = f_hotels.result()  if f_hotels  else {"hotels_search_env": {"ok": False, "data": None}, "elapsed": 0}
        maps    = f_maps.result()
        flights = f_flights.result() if f_flights else {"flights_env": {"ok": False, "data": None}, "elapsed": 0}

    return {"hotels": hotels, "maps": maps, "flights": flights}


def _build_retrieval_result(rules_res, weather_res, gaode_res, serpapi_res, start):
    return {
        "rules": rules_res.get("rules"),
        "rules_evaluation": rules_res,
        "agent_policy": rules_res.get("agent_policy"),
        "pet_travel_experience": rules_res.get("pet_travel_experience"),
        "breed_info": rules_res.get("breed_info"),
        "weather": {
            "now": (weather_res.get("weather_now_env") or {}).get("data") or {},
            "forecast": (weather_res.get("weather_forecast_env") or {}).get("data") or [],
            "minutely": (weather_res.get("weather_minutely_env") or {}).get("data") or {},
            "indices": (weather_res.get("weather_indices_env") or {}).get("data") or [],
        },
        "canonical_location": gaode_res.get("canonical_location"),
        "pois": gaode_res.get("poi_results"),
        "enriched_pois": gaode_res.get("enriched"),
        "routes": gaode_res.get("routes") or {},
        "prices": {
            "hotels_search_env": serpapi_res["hotels"].get("hotels_search_env"),
            "restaurants_env": serpapi_res["maps"].get("restaurants_env"),
            "attractions_env": serpapi_res["maps"].get("attractions_env"),
            "flights_env": serpapi_res["flights"].get("flights_env"),
        },
        "tools": {
            "tool.gaode.geocode": gaode_res.get("geocode"),
            "tool.gaode.poi_keyword": gaode_res.get("poi_envelopes"),
            "tool.gaode.poi_around": gaode_res.get("around_poi_envelopes"),
            "tool.gaode.poi_detail": gaode_res.get("poi_details"),
            "tool.gaode.routes": gaode_res.get("routes"),
            "tool.gaode.route_matrix": (gaode_res.get("tools_partial") or {}).get("route_matrix"),
            "tool.gaode.distance": (gaode_res.get("tools_partial") or {}).get("distance"),
            "tool.qweather.now": weather_res.get("weather_now_env"),
            "tool.qweather.forecast": weather_res.get("weather_forecast_env"),
            "tool.qweather.minutely": weather_res.get("weather_minutely_env"),
            "tool.qweather.indices": weather_res.get("weather_indices_env"),
            "tool.google.hotels": serpapi_res["hotels"].get("hotels_search_env"),
            "tool.google.maps": {"restaurants": serpapi_res["maps"].get("restaurants_env"), "attractions": serpapi_res["maps"].get("attractions_env")},
            "tool.google.flights": serpapi_res["flights"].get("flights_env"),
        },
        "provenance": {
            "elapsed_sec": time.time() - start,
            "subtasks": {
                "weather_elapsed": weather_res.get("elapsed"),
                "gaode_elapsed": gaode_res.get("elapsed"),
                "hotels_elapsed": serpapi_res["hotels"].get("elapsed"),
                "maps_elapsed": serpapi_res["maps"].get("elapsed"),
                "flights_elapsed": serpapi_res["flights"].get("elapsed"),
            },
        },
    }


_EMPTY_SERPAPI = {
    "hotels": {"hotels_search_env": {"ok": False, "data": None}, "elapsed": 0},
    "maps": {"restaurants_env": None, "attractions_env": None},
    "flights": {"flights_env": {"ok": False, "data": None}, "elapsed": 0},
}


_CITY_ZH = {
    "beijing": "北京", "shanghai": "上海", "guangzhou": "广州", "shenzhen": "深圳",
    "chengdu": "成都", "hangzhou": "杭州", "chongqing": "重庆", "xiamen": "厦门",
    "wuhan": "武汉", "xian": "西安", "nanjing": "南京", "suzhou": "苏州",
    "qingdao": "青岛", "tianjin": "天津", "kunming": "昆明", "guilin": "桂林",
    "sanya": "三亚", "harbin": "哈尔滨", "zhengzhou": "郑州", "changsha": "长沙",
}


def _zh_city(city: str) -> str:
    """Return Chinese city name for Gaode if available, else original."""
    return _CITY_ZH.get(city.strip().lower(), city)


def agent2_retrieval(user_profile: dict, city: str, trip_context: dict = None):
    if trip_context is None:
        trip_context = {}
    start = time.time()
    gaode_city = _zh_city(city)
    with ThreadPoolExecutor(max_workers=4) as ex:
        f_rules = ex.submit(rule_evaluator, user_profile, city)
        f_weather = ex.submit(weather_subagent, gaode_city)
        f_gaode = ex.submit(gaode_subagent, gaode_city, pet_type=user_profile.get("pet_type"))
        f_serpapi = ex.submit(_serpapi_subagent, city, trip_context)
        rules_res = f_rules.result()
        weather_res = f_weather.result()
        gaode_res = f_gaode.result()
        serpapi_res = f_serpapi.result()
    return _build_retrieval_result(rules_res, weather_res, gaode_res, serpapi_res, start)


def agent2_retrieval_streaming(user_profile: dict, city: str, trip_context: dict, on_partial: callable):
    """Fire on_partial(partial_data) as soon as rules+weather+gaode are ready,
    before serpapi finishes. Returns full result once serpapi completes.
    """
    if trip_context is None:
        trip_context = {}
    start = time.time()
    gaode_city = _zh_city(city)
    with ThreadPoolExecutor(max_workers=4) as ex:
        f_rules = ex.submit(rule_evaluator, user_profile, city)
        f_weather = ex.submit(weather_subagent, gaode_city)
        f_gaode = ex.submit(gaode_subagent, gaode_city, pet_type=user_profile.get("pet_type"))
        f_serpapi = ex.submit(_serpapi_subagent, city, trip_context)
        rules_res = f_rules.result()
        weather_res = f_weather.result()
        gaode_res = f_gaode.result()
        on_partial(_build_retrieval_result(rules_res, weather_res, gaode_res, _EMPTY_SERPAPI, start))
        serpapi_res = f_serpapi.result()
    return _build_retrieval_result(rules_res, weather_res, gaode_res, serpapi_res, start)
