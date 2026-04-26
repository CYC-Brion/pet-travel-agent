import time
from concurrent.futures import ThreadPoolExecutor
from helper import (
    fetch_google_maps_restaurants,
    fetch_google_maps_attractions,
    fetch_google_hotels_search,
    fetch_google_flights,
    query_cosmos_hotels,
)

def hotels_subagent(city: str, check_in: str, check_out: str):
    """Agent 2 – Google Hotels (SerpAPI), queried by Cosmos DB hotel names."""
    start = time.time()

    cosmos_hotels = query_cosmos_hotels(city)
    queries = [h.get("name") or h.get("Name") for h in cosmos_hotels if h.get("name") or h.get("Name")] or [city]

    def _search(q):
        try:
            return fetch_google_hotels_search(
                q=q, check_in_date=check_in, check_out_date=check_out,
                currency="CNY", sort_by="8",
            )
        except Exception:
            return {"ok": False, "data": None}

    with ThreadPoolExecutor(max_workers=5) as ex:
        results = list(ex.map(_search, queries[:5]))

    merged = [r for r in results if r.get("ok")]
    search_env = merged[0] if len(merged) == 1 else {"ok": bool(merged), "data": [r.get("data") for r in merged]}

    return {
        "hotels_search_env": search_env,
        "cosmos_hotels": cosmos_hotels,
        "elapsed": time.time() - start,
    }



def maps_subagent(city: str):
    start = time.time()

    try:
        restaurants = fetch_google_maps_restaurants(
            q=f"restaurant near {city}"
        )
        attractions = fetch_google_maps_attractions(
            q=f"attraction near {city}"
        )
    except Exception:
        restaurants = {"ok": False, "data": None}
        attractions = {"ok": False, "data": None}

    return {
        "restaurants_env": restaurants,
        "attractions_env": attractions,
        "elapsed": time.time() - start,
    }


def flights_subagent(
    departure_id: str,
    arrival_id: str,
    outbound_date: str,
    return_date: str = None,
):
    start = time.time()

    try:
        flights = fetch_google_flights(
            departure_id=departure_id,
            arrival_id=arrival_id,
            outbound_date=outbound_date,
            return_date=return_date,
            currency="CNY",
        )
    except Exception:
        flights = {"ok": False, "data": None}

    return {
        "flights_env": flights,
        "elapsed": time.time() - start,
    }