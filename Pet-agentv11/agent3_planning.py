import os
import json
import re
from typing import Any, Tuple
from helper import openai_chat

# Try to use jsonschema if available for strict validation
try:
    import jsonschema
    HAS_JSONSCHEMA = True
except Exception:
    HAS_JSONSCHEMA = False


def _flatten_pois(pois_dict):
    """Convert retrieval POI dict into simple candidate lists."""
    flat = {}
    for label, items in (pois_dict or {}).items():
        if not isinstance(items, list):
            continue
        flat[label] = []
        for it in items:
            flat[label].append({
                "id": str(it.get("id") or it.get("poi_id") or ""),
                "name": it.get("name") or it.get("title") or "",
                "location": it.get("location") or it.get("latlng") or "",
                "raw": it,
            })
    return flat


SCORING_INSTRUCTION = (
    "Score each candidate on a 0-100 scale for suitability given the user's pet, budget, time, and preferences. "
    "Provide a short reason for each score. Return strict JSON with keys: hotels, attractions, restaurants, hospitals, transport, routes, budget_estimate, notes. "
    "Each list item must be an object: {name, id, score, reason, metadata(optional)}."
)

# JSON Schema for planner output
PLANNER_SCHEMA = {
    "type": "object",
    "required": ["hotels", "attractions", "restaurants", "hospitals", "transport", "budget_estimate", "notes"],
    "properties": {
        "hotels": {"type": "array"},
        "attractions": {"type": "array"},
        "restaurants": {"type": "array"},
        "hospitals": {"type": "array"},
        "transport": {"type": "array"},
        "routes": {"type": ["array", "null"]},
        "budget_estimate": {"type": ["number", "integer", "object"]},
        "notes": {"type": "array"},
    },
}


def _basic_validate(parsed: Any) -> Tuple[bool, str]:
    """Fallback validator that checks presence and types at a shallow level."""
    if not isinstance(parsed, dict):
        return False, "top-level is not an object"
    for key in ["hotels", "attractions", "restaurants", "hospitals", "transport", "notes"]:
        if key not in parsed:
            return False, f"missing key: {key}"
        if not isinstance(parsed[key], list):
            return False, f"{key} is not a list"
    if "budget_estimate" not in parsed or not isinstance(parsed["budget_estimate"], (int, float, dict)):
        return False, "budget_estimate missing or not numeric"
    # check items shape for first few entries
    for cat in ["hotels", "attractions", "restaurants", "hospitals", "transport"]:
        items = parsed.get(cat, [])
        for it in items[:3]:
            if not isinstance(it, dict):
                return False, f"{cat} item not object"
            if not it.get("name") or not ("score" in it):
                return False, f"{cat} item missing name or score"
    return True, ""


def validate_planner_output(parsed: Any) -> Tuple[bool, str]:
    """Validate planner output using jsonschema if available, else basic check."""
    if HAS_JSONSCHEMA:
        try:
            jsonschema.validate(instance=parsed, schema=PLANNER_SCHEMA)
            # additional deeper checks: ensure items have name & score
            ok, reason = _basic_validate(parsed)
            return ok, reason
        except Exception as exc:
            return False, str(exc)
    else:
        return _basic_validate(parsed)


def _extract_json_from_text(text: str) -> Any:
    """Attempt to find and parse JSON inside text using heuristics."""
    text = text.strip()
    # If entire text is JSON
    try:
        return json.loads(text)
    except Exception:
        pass
    # Try to extract the largest {...} or [...] block
    matches = list(re.finditer(r"(\{.*\}|\[.*\])", text, re.DOTALL))
    if not matches:
        # strip code fences
        fenced = re.search(r"```(?:json)?\n(.+?)\n```", text, re.DOTALL)
        if fenced:
            try:
                return json.loads(fenced.group(1))
            except Exception:
                pass
        raise ValueError("No JSON object found in text")
    # pick the longest match (most likely full JSON)
    best = max(matches, key=lambda m: m.end() - m.start())
    candidate = best.group(0)
    return json.loads(candidate)


def _build_planner_prompt(user_profile, trip_days, retrieval_data, lang: str = "en") -> list:
    user_block = json.dumps({"user_profile": user_profile, "trip_days": trip_days}, ensure_ascii=False)
    pois = _flatten_pois(retrieval_data.get("pois", {}))
    tools_summary = {k: (v if isinstance(v, dict) else {}) for k, v in retrieval_data.get("tools", {}).items()}

    # Use the original hardcoded system message (no YAML integration for now).
    system_msg = "You are Agent 3: Trip Planner and Recommender."
    if lang == 'zh':
        system_msg += " 请用中文返回，并严格遵守输出 JSON 格式。"
    else:
        system_msg += " Please reply in English and return strictly valid JSON."

    # Compose message
    prompt = [
        {"role": "system", "content": system_msg + "\n" + SCORING_INSTRUCTION},
        {"role": "user", "content": "User/context: " + user_block},
        {"role": "user", "content": "Candidates: " + json.dumps(pois, ensure_ascii=False)},
        {"role": "user", "content": "Tools: " + json.dumps(tools_summary, ensure_ascii=False)},
        {"role": "user", "content": "Prices: " + json.dumps(retrieval_data.get("prices", {}), ensure_ascii=False)},
        {"role": "user", "content": "Constraints: be concise. Return JSON only."},
    ]

    return prompt


# Retry settings
MAX_RETRIES = 3
RETRY_INSTRUCTION_SUFFIX = (
    "\nIf your previous reply was not valid JSON or did not match the required schema, please return valid JSON only. "
    "Do not add any explanation. Output only the JSON object."
)


# ----------------------
# Distance matrix & itinerary optimizer
# ----------------------
import math
from typing import List, Dict, Optional


def _parse_location(loc: str) -> Optional[Dict[str, float]]:
    """Parse location strings like 'lng,lat' or 'lat,lng' and return {'lat':..,'lon':..}"""
    if not loc or not isinstance(loc, str):
        return None
    parts = [p.strip() for p in re.split('[,， ]+', loc) if p.strip()]
    if len(parts) < 2:
        return None
    try:
        a = float(parts[0])
        b = float(parts[1])
        # Heuristic: if abs(a) > 90 then it's likely lon,lat (lng,lat)
        if abs(a) > 90:
            lon, lat = a, b
        else:
            lat, lon = a, b
        return {"lat": float(lat), "lon": float(lon)}
    except Exception:
        return None


def _haversine_km(a: Dict[str, float], b: Dict[str, float]) -> float:
    # expects {'lat', 'lon'}
    lat1, lon1 = math.radians(a['lat']), math.radians(a['lon'])
    lat2, lon2 = math.radians(b['lat']), math.radians(b['lon'])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    r = 6371.0
    return 2 * r * math.asin(math.sqrt(math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2))


def _build_distance_matrix(candidates: List[Dict]) -> List[List[float]]:
    pts = []
    for c in candidates:
        loc = _parse_location(c.get('location') or c.get('raw', {}).get('location') or '')
        pts.append(loc)
    n = len(pts)
    mat = [[0.0]*n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i==j or pts[i] is None or pts[j] is None:
                mat[i][j] = float('inf') if i!=j else 0.0
            else:
                mat[i][j] = _haversine_km(pts[i], pts[j])
    return mat


def _greedy_route(start_idx: int, dist_mat: List[List[float]]) -> List[int]:
    n = len(dist_mat)
    unvisited = set(range(n))
    path = [start_idx]
    unvisited.remove(start_idx)
    current = start_idx
    while unvisited:
        # find nearest
        nearest = min(unvisited, key=lambda x: dist_mat[current][x] if dist_mat[current][x] is not None else float('inf'))
        path.append(nearest)
        unvisited.remove(nearest)
        current = nearest
    return path


def _generate_itineraries_from_candidates(
    hotels: List[Dict],
    attractions: List[Dict],
    trip_days: int,
    constraints: Optional[Dict] = None,
    transport_rate_per_km: float = 2.5,
):
    """Generate 3 itinerary tiers (Premium/Comfort/Economy).

    Applies constraint filtering (weather, pet, opening hours) before sequencing.
    Estimates visit time per attraction from POI data, commute time from haversine.
    Outputs total cost and total daily duration per tier.
    """
    days = max(1, int(trip_days or 1))
    constraints = constraints or {}
    weather_avoid = (constraints.get("weather") or {}).get("avoid_conditions", [])
    max_daily_min = int((constraints.get("operational") or {}).get("max_daily_travel_minutes") or 480)

    # --- Filter attractions against constraints ---
    def _passes(a):
        if a.get("pet_friendly") is False:
            return False
        # weather: skip outdoor venues in bad weather
        if weather_avoid:
            vtype = str(a.get("type") or (a.get("raw") or {}).get("type") or "").lower()
            if any(c in weather_avoid for c in ["rain", "high_temperature"]):
                if any(k in vtype for k in ["park", "outdoor", "beach", "zoo"]):
                    return False
        # opening hours: skip if explicitly closed
        hours = a.get("opening_hours") or (a.get("raw") or {}).get("opening_hours") or ""
        if "closed" in str(hours).lower():
            return False
        return True

    valid_attractions = [a for a in attractions if _passes(a)]

    # --- Pick hotel start point ---
    start = next((h for h in hotels if _parse_location(
        h.get("location") or (h.get("raw") or {}).get("location") or "")), None)
    if start is None and valid_attractions:
        start = valid_attractions[0]
    if not valid_attractions and not start:
        return []

    # Tier configs: (max_attractions_per_day, hotel_tier, ticket_multiplier)
    tier_cfg = {
        "Premium":  (4, "luxury",  1.0),
        "Comfort":  (3, "comfort", 1.0),
        "Economy":  (2, "budget",  0.5),
    }
    # Static cost KB (CNY) — fallback only when live hotel price is unavailable
    hotel_cost = {"luxury": 1200, "comfort": 600, "budget": 300}
    meal_cost  = {"luxury": 300,  "comfort": 150, "budget": 80}
    pet_fee    = {"luxury": 150,  "comfort": 80,  "budget": 40}

    def _hotel_nightly_price(h):
        """Prefer live SerpAPI hotel nightly price, otherwise fall back to tier table."""
        live = h.get("live_hotel") if isinstance(h, dict) else None
        candidates = []
        if isinstance(live, dict):
            candidates.extend([
                live.get("price"),
                live.get("nightly_rate"),
                live.get("rate_per_night"),
                live.get("lowest"),
                live.get("extracted_lowest"),
                live.get("total_rate"),
                live.get("total_price"),
            ])
        candidates.extend([
            h.get("price") if isinstance(h, dict) else None,
            h.get("nightly_rate") if isinstance(h, dict) else None,
            h.get("rate_per_night") if isinstance(h, dict) else None,
            (h.get("raw") or {}).get("price") if isinstance(h, dict) else None,
            (h.get("raw") or {}).get("avg_price") if isinstance(h, dict) else None,
        ])
        for val in candidates:
            if isinstance(val, (int, float)):
                parsed = float(val)
            elif isinstance(val, str):
                m = re.search(r"\d+(?:[.,]\d+)?", val.replace(",", ""))
                parsed = float(m.group(0).replace(",", "")) if m else None
            elif isinstance(val, dict):
                parsed = None
                for key in ("extracted_lowest", "lowest", "amount", "value", "price", "nightly_rate", "rate_per_night", "before_taxes_fees", "total_rate", "total_price"):
                    sub = val.get(key)
                    if isinstance(sub, (int, float)):
                        parsed = float(sub)
                    elif isinstance(sub, str):
                        m = re.search(r"\d+(?:[.,]\d+)?", sub.replace(",", ""))
                        parsed = float(m.group(0).replace(",", "")) if m else None
                    if parsed is not None:
                        break
            else:
                parsed = None
            if parsed is not None and parsed > 0:
                return parsed
        return None

    # Parse user budget range
    budget_min, budget_max = _parse_budget_range((constraints or {}).get("user", {}).get("budget") if constraints else None)
    if budget_max == float("inf"):
        budget_max = float("inf")

    # Pick hotel/meal/pet costs to fit within budget
    # Use live hotel price if available, else interpolate from static KB
    live_hotel_price = _hotel_nightly_price(start if isinstance(start, dict) else {})
    if live_hotel_price is not None:
        hotel_nightly = live_hotel_price
    else:
        # Interpolate: if budget_max is finite, scale hotel cost proportionally
        if budget_max != float("inf"):
            hotel_nightly = min(1200, max(300, (budget_max / max(days, 1)) * 0.5))
        else:
            hotel_nightly = 600  # default comfort

    # Scale meal/pet costs proportionally to hotel tier
    if hotel_nightly >= 900:
        meal_per_day, pet_per_day = 300, 150
    elif hotel_nightly >= 450:
        meal_per_day, pet_per_day = 150, 80
    else:
        meal_per_day, pet_per_day = 80, 40

    # Max attractions per day: fit within budget
    non_attraction_cost = (hotel_nightly + meal_per_day + pet_per_day) * days
    attraction_budget = (budget_max - non_attraction_cost) if budget_max != float("inf") else float("inf")
    max_per_day = 4 if attraction_budget == float("inf") or attraction_budget > 500 * days else (3 if attraction_budget > 200 * days else 2)

    max_total = max_per_day * days
    selected = valid_attractions[:max_total]

    nodes = ([start] + selected) if start else selected
    if not nodes:
        return []

    dist_mat = _build_distance_matrix(nodes)
    order = _greedy_route(0, dist_mat)

    avg_speed_kmh = 30.0
    legs = []
    for i in range(len(order) - 1):
        a, b = nodes[order[i]], nodes[order[i + 1]]
        d_km = dist_mat[order[i]][order[i + 1]]
        if d_km == float("inf"):
            d_km = 0.0
        travel_min = int((d_km / avg_speed_kmh) * 60)
        raw_visit = b.get("visit_minutes") or (b.get("raw") or {}).get("visit_minutes")
        visit_min = int(raw_visit) if raw_visit else 120
        ticket = float(b.get("ticket_price") or (b.get("raw") or {}).get("ticket_price") or 0)
        legs.append({
            "from": a.get("name", ""),
            "to": b.get("name", ""),
            "distance_km": round(d_km, 2),
            "travel_minutes": travel_min,
            "visit_minutes": visit_min,
            "ticket_price": round(ticket, 1),
        })

    # Split legs across days
    day_plans = []
    leg_idx = 0
    for d in range(days):
        day_legs, day_minutes = [], 0
        while leg_idx < len(legs):
            leg = legs[leg_idx]
            leg_total = leg["travel_minutes"] + leg["visit_minutes"]
            if day_minutes + leg_total > max_daily_min and day_legs:
                break
            day_legs.append(leg)
            day_minutes += leg_total
            leg_idx += 1
        day_plans.append({
            "day": d + 1,
            "legs": day_legs,
            "total_minutes": day_minutes,
            "total_hours": round(day_minutes / 60, 1),
        })

    total_km = sum(l["distance_km"] for l in legs)
    total_minutes = sum(l["travel_minutes"] + l["visit_minutes"] for l in legs)
    transport_cost = round(total_km * transport_rate_per_km, 1)
    ticket_cost = round(sum(l["ticket_price"] for l in legs), 1)
    total_cost = int(hotel_nightly * days + meal_per_day * days + pet_per_day * days + transport_cost + ticket_cost)

    itineraries = [{
        "option": "Recommended",
        "days": days,
        "hotel_nightly_price": round(hotel_nightly, 1),
        "hotel_price_source": "serpapi_google_hotels" if live_hotel_price is not None else "static_fallback",
        "total_km": round(total_km, 2),
        "total_minutes": int(total_minutes),
        "total_hours": round(total_minutes / 60, 1),
        "total_cost_cny": total_cost,
        "budget_range": f"{int(budget_min)}-{int(budget_max)}" if budget_max != float("inf") else f"{int(budget_min)}+",
        "cost_breakdown": {
            "hotel": hotel_nightly * days,
            "meals": meal_per_day * days,
            "pet_fee": pet_per_day * days,
            "transport": transport_cost,
            "tickets": ticket_cost,
        },
        "day_plans": day_plans,
        "attractions_count": len(selected),
    }]

    return itineraries


def extract_constraints(user_profile, trip_context, retrieval_data, lang: str = "en", use_llm: bool = True):
    """Extract structured constraints across 8 dimensions.

    If use_llm is True, attempt an LLM extraction and fall back to deterministic extraction on failure.
    If use_llm is False, use the deterministic fallback immediately for a fast response.
    """
    rd = retrieval_data if isinstance(retrieval_data, dict) else {}

    if use_llm:
        system = "You are Agent 3 constraint extractor. Return JSON with keys: pet,user,transport,weather,spatiotemporal,operational,route,compliance. Provide short confidence (0-1)."
        user_block = {
            "user_profile": user_profile,
            "trip_context": trip_context,
            "canonical_location": rd.get("canonical_location") if isinstance(rd, dict) else None,
        }
        try:
            completion = openai_chat(
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": json.dumps(user_block, ensure_ascii=False)}
                ],
                model=os.getenv("AGENT3_MODEL", "gpt-5-mini"),
                max_tokens=500
            )
            raw = completion.choices[0].message.content
            parsed = None
            try:
                parsed = json.loads(raw)
            except Exception:
                parsed = None
            if isinstance(parsed, dict):
                parsed.setdefault("confidence", 0.9)
                return parsed
        except Exception:
            # fall through to deterministic fallback
            pass

    # Deterministic fallback: populate all 8 dimensions from available data

    # 1. Pet
    pet = {
        "type": user_profile.get("pet_type"),
        "breed": user_profile.get("breed"),
        "age": user_profile.get("pet_age"),
        "weight_kg": user_profile.get("pet_weight"),
        "health_condition": user_profile.get("health_condition"),
    }

    # 2. User
    user = {
        "budget": user_profile.get("budget"),
        "preferences": user_profile.get("preferences"),
        "physical_stamina": user_profile.get("physical_stamina", "normal"),
        "time_availability": trip_context.get("available_hours") or (int(trip_context.get("days") or 1) * 8),
    }

    # 3. Transportation
    rules_eval = rd.get("rules_evaluation", {})
    compliance_constraints = rules_eval.get("constraints", {})
    transport = {
        "preferred_mode": user_profile.get("transport_mode", "driving"),
        "pet_friendly_modes": user_profile.get("pet_friendly_modes", ["driving", "taxi"]),
        "accessibility_required": user_profile.get("accessibility_required", False),
        "prohibited_modes": compliance_constraints.get("prohibited_transport", []),
    }

    # 4. Weather — pull from live retrieval data
    weather_block = rd.get("weather", {})
    now = (weather_block.get("now") or {})
    forecast = weather_block.get("forecast") or []
    avoid = []
    try:
        temp = float((now.get("data") or now).get("temp", 0) if isinstance(now, dict) else 0)
        if temp > 35:
            avoid.append("high_temperature")
    except Exception:
        pass
    if forecast:
        for f in (forecast[:3] if isinstance(forecast, list) else []):
            text = str(f).lower()
            if "rain" in text or "storm" in text:
                avoid.append("rain")
                break
    weather = {
        "avoid_conditions": list(set(avoid)),
        "current_temp": now.get("temp") if isinstance(now, dict) else None,
        "forecast_summary": forecast[:2] if isinstance(forecast, list) else [],
    }

    # 5. Spatiotemporal
    canonical = rd.get("canonical_location", {})
    spatiotemporal = {
        "trip_days": int(trip_context.get("days") or 1),
        "current_location": trip_context.get("current_location") or canonical,
        "destination": trip_context.get("destination") or rd.get("city"),
        "daily_activity_hours": int(user_profile.get("daily_activity_hours") or 8),
    }

    # 6. Operational — derive from POI opening hours if present
    pois = rd.get("enriched_pois") or rd.get("pois") or {}
    hospital_open = True
    for h in (pois.get("Hospitals") or [])[:3]:
        hours = h.get("opening_hours") or (h.get("raw") or {}).get("opening_hours")
        if hours and "closed" in str(hours).lower():
            hospital_open = False
            break
    operational = {
        "max_daily_travel_minutes": int(user_profile.get("max_daily_travel_minutes") or 240),
        "hospital_operating": hospital_open,
        "attraction_hours_checked": bool(pois),
    }

    # 7. Route
    route = {
        "max_commute_minutes": int(user_profile.get("max_commute_minutes") or 60),
        "return_time": trip_context.get("return_time"),
        "remaining_activity_minutes": trip_context.get("remaining_activity_minutes"),
        "node_sequence": trip_context.get("node_sequence", []),
    }

    # 8. Compliance
    compliance = {
        "rules_evaluation": rules_eval.get("result"),
        "hard_constraints": compliance_constraints,
        "explanation": rules_eval.get("explanation"),
    }

    return {
        "pet": pet, "user": user, "transport": transport, "weather": weather,
        "spatiotemporal": spatiotemporal, "operational": operational,
        "route": route, "compliance": compliance, "confidence": 0.5,
    }


def filter_and_score_candidates(retrieval_data, constraints):
    """Filter and score all POI categories against constraints.

    Filters: pet-prohibited, budget violations, time violations.
    Scoring: attractions by category/weather/plan fit; hospitals by distance+capability; alternatives by remaining time.
    Returns dict: category -> sorted list of {name, id, score, filtered, filter_reason, metadata}
    """
    pois = retrieval_data.get("enriched_pois") or retrieval_data.get("pois") or {}
    cloc = retrieval_data.get("canonical_location") or {}
    weather_avoid = (constraints.get("weather") or {}).get("avoid_conditions", [])
    budget_min, budget_max = _parse_budget_range((constraints.get("user") or {}).get("budget"))
    max_daily_min = int((constraints.get("operational") or {}).get("max_daily_travel_minutes") or 240)
    remaining_min = (constraints.get("route") or {}).get("remaining_activity_minutes")
    hard = (constraints.get("compliance") or {}).get("hard_constraints", {})
    prohibited_types = hard.get("prohibited_poi_types", [])

    trip_days = max(int((constraints.get("operational") or {}).get("trip_days") or 1), 1)
    budget_cap = (budget_max / trip_days) * 0.3 if budget_max != float("inf") else 250
    live_hotel_props = _extract_live_hotel_properties(retrieval_data)
    hotel_target = (budget_max / trip_days) * 0.5 if budget_max != float("inf") else 600.0

    # Extract SerpAPI restaurant data for name-matched scoring
    _serpapi_restaurants = []
    _rest_env = (retrieval_data.get("prices") or {}).get("restaurants_env")
    if isinstance(_rest_env, dict) and _rest_env.get("ok"):
        _serpapi_restaurants = (_rest_env.get("data") or {}).get("local_results") or []

    def _normalize_name(n):
        return re.sub(r"[\s\-_,，.]+", "", str(n or "").lower())

    def _match_serpapi_restaurant(name):
        norm = _normalize_name(name)
        if not norm:
            return None
        for r in _serpapi_restaurants:
            rname = _normalize_name(r.get("title") or r.get("name") or "")
            if rname and (norm in rname or rname in norm):
                return r
        return None

    def _score_restaurant_candidate(it, dist):
        base = int(it.get("score") or 50)
        score = base
        match = _match_serpapi_restaurant(it.get("name") or (it.get("raw") or {}).get("name") or "")
        if match:
            # Rating: up to 20 pts
            try:
                rating = float(match.get("rating") or 0)
                score += int((rating / 5.0) * 20) if rating <= 5 else int((rating / 10.0) * 20)
            except Exception:
                pass
            # Price level vs daily food budget
            daily_food = (budget_max * 0.15 / trip_days) if budget_max != float("inf") else 150.0
            price_str = str(match.get("price") or "")
            level = len(price_str.strip())
            meal_map = {1: 30, 2: 70, 3: 150, 4: 300}
            cost = meal_map.get(level, 70)
            if daily_food > 0:
                if cost <= daily_food:
                    score += 10
                else:
                    score -= min(20, int((cost / daily_food - 1) * 20))
        if it.get("pet_friendly") is True:
            score += 15
        if dist is not None:
            score -= min(20, int(dist))
        return max(0, min(100, score))

    def _money(val):
        if val is None:
            return None
        if isinstance(val, (int, float)):
            return float(val)
        if isinstance(val, str):
            m = re.search(r"\d+(?:[\.,]\d+)?", val.replace(",", ""))
            return float(m.group(0).replace(",", "")) if m else None
        if isinstance(val, dict):
            for key in ("extracted_lowest", "lowest", "amount", "value", "price", "nightly_rate", "rate_per_night", "before_taxes_fees", "total_rate", "total_price"):
                parsed = _money(val.get(key))
                if parsed is not None:
                    return parsed
        if isinstance(val, list):
            for item in val:
                parsed = _money(item)
                if parsed is not None:
                    return parsed
        return None

    def _rating(val):
        raw = _money(val)
        if raw is None:
            return None
        if raw <= 5:
            return max(0.0, min(100.0, raw * 20.0))
        if raw <= 10:
            return max(0.0, min(100.0, raw * 10.0))
        if raw <= 100:
            return max(0.0, min(100.0, raw))
        return None

    def _count(val):
        raw = _money(val)
        return int(raw) if raw is not None else 0

    def _dist(item):
        loc = item.get("location") or (item.get("raw") or {}).get("location") or ""
        if not loc or not cloc.get("lat"):
            return None
        a = _parse_location(loc)
        b = {"lat": cloc["lat"], "lon": cloc.get("lon", cloc.get("lng", 0))}
        return _haversine_km(a, b) if a and b["lat"] else None

    def _score_attraction(it, dist):
        score = int(it.get("score") or 50)
        if it.get("pet_friendly") is True:
            score += 20
        # weather suitability: outdoor venues penalised in bad weather
        if any(c in weather_avoid for c in ["rain", "high_temperature"]):
            venue_type = str(it.get("type") or (it.get("raw") or {}).get("type") or "").lower()
            if any(k in venue_type for k in ["park", "outdoor", "beach", "zoo"]):
                score -= 20
        # remaining time fit
        visit_min = int(it.get("visit_minutes") or (it.get("raw") or {}).get("visit_minutes") or 120)
        if remaining_min is not None and visit_min > remaining_min:
            score -= 25
        if dist is not None:
            score -= min(30, int(dist))
        return max(0, min(100, score))

    def _score_hospital(it, dist):
        # capability match: prefer specialist pet hospitals
        score = int(it.get("score") or 50)
        name_lower = str(it.get("name") or "").lower()
        if any(k in name_lower for k in ["pet", "animal", "vet", "veterinary", "宠物", "动物"]):
            score += 25
        if it.get("24h") or "24" in str(it.get("opening_hours") or ""):
            score += 15
        # distance is primary for emergency — heavy penalty beyond 5km
        if dist is not None:
            score -= min(40, int(dist * 3))
        return max(0, min(100, score))

    def _score_hotel(it, dist):
        base_score = int(it.get("score") or 50)
        score = base_score
        live_matches = _match_live_hotel_properties(it.get("name") or (it.get("raw") or {}).get("name") or "", live_hotel_props)

        if live_matches:
            best_live_score = None
            best_snapshot = None
            price_target = float(hotel_target)
            trip_days = max(1, int((constraints.get("spatiotemporal") or {}).get("trip_days") or 1))

            for prop in live_matches:
                price = _money(
                    prop.get("rate_per_night")
                    or prop.get("nightly_rate")
                    or prop.get("price_per_night")
                    or prop.get("price")
                    or prop.get("lowest")
                    or prop.get("extracted_lowest")
                )
                if price is None:
                    total_price = _money(prop.get("total_rate") or prop.get("total_price") or prop.get("price_with_fees") or prop.get("before_taxes_fees"))
                    if total_price is not None:
                        price = total_price / trip_days

                rating = _rating(
                    prop.get("rating")
                    or prop.get("score")
                    or prop.get("user_rating")
                    or prop.get("overall_rating")
                    or prop.get("review_score")
                )
                review_count = _count(
                    prop.get("reviews")
                    or prop.get("review_count")
                    or prop.get("reviews_count")
                    or prop.get("total_reviews")
                ) or 0

                value_score = 0
                if price is not None and price_target > 0:
                    ratio = price / price_target
                    if ratio <= 1.0:
                        value_score += 20  # within budget
                    elif ratio <= 1.25:
                        value_score += 8   # slightly over
                    else:
                        value_score -= min(20, int((ratio - 1.0) * 25))  # over budget penalty

                rating_score = int((rating or 0) * 0.45) if rating is not None else 0
                review_bonus = min(5, int(review_count ** 0.5)) if review_count else 0
                distance_penalty = min(20, int(dist * 2)) if dist is not None else 0
                pet_bonus = 8 if it.get("pet_friendly") is True else 0

                live_total = max(0, min(100, value_score + rating_score + review_bonus + pet_bonus - distance_penalty))
                if best_live_score is None or live_total > best_live_score:
                    best_live_score = live_total
                    best_snapshot = {
                        "source": "serpapi_google_hotels",
                        "name": prop.get("name") or prop.get("hotel_name") or prop.get("title"),
                        "price": price,
                        "rating": rating,
                        "reviews": int(review_count) if review_count else None,
                    }

            if best_live_score is not None:
                score = int((base_score * 0.25) + (best_live_score * 0.75))
                score = max(0, min(100, score))
                it["live_hotel"] = best_snapshot
        else:
            if it.get("pet_friendly") is True:
                score += 10
            if dist is not None:
                score -= min(20, int(dist))
            score = max(0, min(100, score))

        return score

    out = {}
    for cat, items in (pois or {}).items():
        if not isinstance(items, list):
            continue
        cat_lower = cat.lower()
        is_hospital = "hospital" in cat_lower or "医院" in cat or "诊所" in cat
        is_attraction = cat_lower in ("attractions", "attraction") or "景点" in cat or "attractions" in cat_lower
        is_hotel = "hotel" in cat_lower or "酒店" in cat or "住宿" in cat
        is_restaurant = "restaurant" in cat_lower or "餐厅" in cat or "餐饮" in cat
        scored = []
        for it in items:
            if not isinstance(it, dict):
                it = {"name": str(it)}
            name = it.get("name") or (it.get("raw") or {}).get("name") or ""
            item_id = str(it.get("id") or it.get("poi_id") or "")

            # --- Hard filters ---
            filtered, filter_reason = False, ""

            # 1. Pet-prohibited
            if it.get("pet_friendly") is False:
                filtered, filter_reason = True, "pet_prohibited"
            # 2. Prohibited POI type
            elif prohibited_types:
                poi_type = str(it.get("type") or (it.get("raw") or {}).get("type") or "").lower()
                if any(p.lower() in poi_type for p in prohibited_types):
                    filtered, filter_reason = True, "compliance_prohibited"
            # 3. Budget: ticket price vs cap
            elif not is_hospital:
                price = it.get("ticket_price") or (it.get("raw") or {}).get("ticket_price")
                try:
                    if price is not None and float(price) > budget_cap:
                        filtered, filter_reason = True, "exceeds_budget"
                except Exception:
                    pass
            # 4. Time: visit duration vs remaining time
            if not filtered and remaining_min is not None:
                visit_min = int(it.get("visit_minutes") or (it.get("raw") or {}).get("visit_minutes") or 0)
                if visit_min and visit_min > remaining_min:
                    filtered, filter_reason = True, "insufficient_time"

            dist = _dist(it)
            if is_hospital:
                score = _score_hospital(it, dist)
            elif is_hotel:
                score = _score_hotel(it, dist)
            elif is_attraction:
                score = _score_attraction(it, dist)
            elif is_restaurant:
                score = _score_restaurant_candidate(it, dist)
            else:
                score = int(it.get("score") or 50)
                if it.get("pet_friendly") is True:
                    score += 10
                if dist is not None:
                    score -= min(20, int(dist))
                score = max(0, min(100, score))

            scored.append({
                "name": name,
                "id": item_id,
                "score": score,
                "filtered": filtered,
                "filter_reason": filter_reason,
                "distance_km": round(dist, 2) if dist is not None else None,
                "metadata": it,
            })

        # Sort: unfiltered first, then by score desc; filtered items kept at end for transparency
        out[cat] = sorted(scored, key=lambda x: (x["filtered"], -x["score"]))
    return out


def optimize_itineraries(scored_candidates, trip_days, constraints=None):
    """Create 3 itineraries (Premium/Comfort/Economy) using existing generation helper where possible."""
    hotels = [c["metadata"] for c in scored_candidates.get("Hotels", [])[:3]]
    # only pass unfiltered attractions
    attractions = [
        c["metadata"] for c in scored_candidates.get("Attractions", [])
        if not c.get("filtered")
    ][:max(5, int(trip_days or 1) * 4)]
    return _generate_itineraries_from_candidates(hotels, attractions, int(trip_days or 1), constraints=constraints)


def _transport_cost_from_gaode(route_matrix) -> Optional[Dict]:
    """Layer 1: extract total distance (m) and tolls (yuan) from Gaode route matrix result."""
    if not route_matrix or not isinstance(route_matrix, dict):
        return None
    try:
        rows = route_matrix.get("rows") or route_matrix.get("results") or []
        total_distance_m = 0
        total_tolls = 0.0
        count = 0
        for row in rows:
            elements = row.get("elements") or (row if isinstance(row, list) else [])
            for el in elements:
                dist = el.get("distance") or el.get("dist") or 0
                toll = el.get("tolls") or el.get("toll") or 0
                try:
                    total_distance_m += int(dist)
                    total_tolls += float(toll)
                    count += 1
                except Exception:
                    pass
        if count == 0:
            return None
        return {"total_distance_m": total_distance_m, "total_tolls": total_tolls}
    except Exception:
        return None


def _transport_cost_from_itinerary(itineraries) -> Optional[float]:
    """Layer 2: estimate transport cost from haversine leg distances in itinerary."""
    if not itineraries:
        return None
    # use Comfort tier if available, else first
    plan = next((i for i in itineraries if i.get("option") == "Comfort"), itineraries[0])
    total_km = plan.get("total_km") or 0
    if not total_km:
        return None
    # taxi rate ≈ ¥2.5/km as conservative urban estimate
    return total_km * 2.5


def _normalize_hotel_name(name: str) -> str:
    text = re.sub(r"[\s\-_&()（）·,，.]+", "", str(name or "").lower())
    for suffix in ("hotels", "hotel", "resorts", "resort", "suites", "suite", "apartments", "apartment", "hostels", "hostel", "villas", "villa", "inns", "inn"):
        if text.endswith(suffix) and len(text) > len(suffix) + 3:
            text = text[:-len(suffix)]
            break
    return text


def _extract_live_hotel_properties(retrieval_data) -> List[Dict[str, Any]]:
    props: List[Dict[str, Any]] = []
    if not isinstance(retrieval_data, dict):
        return props

    sources = []
    prices = retrieval_data.get("prices") or {}
    if isinstance(prices, dict):
        sources.extend([prices.get("hotels_search_env"), prices.get("google_hotels"), prices.get("serpapi_hotels")])
    serpapi = retrieval_data.get("serpapi_hotels")
    if isinstance(serpapi, dict):
        sources.append(serpapi.get("hotels_search_env"))

    for src in sources:
        data = src
        if isinstance(src, dict) and src.get("ok") and isinstance(src.get("data"), (dict, list)):
            data = src.get("data")
        if not isinstance(data, dict):
            continue
        for prop in data.get("properties") or data.get("hotels") or []:
            if isinstance(prop, dict):
                props.append(prop)
    return props


def _match_live_hotel_properties(hotel_name: str, live_props: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    norm = _normalize_hotel_name(hotel_name)
    if not norm:
        return []
    matches = []
    for prop in live_props:
        pname = prop.get("name") or prop.get("hotel_name") or prop.get("title") or ""
        pnorm = _normalize_hotel_name(pname)
        if pnorm and (norm in pnorm or pnorm in norm):
            matches.append(prop)
    return matches


def _extract_live_hotel_nightly_prices(prices, days):
    """Return candidate nightly hotel prices and a source label.

    Supports the legacy Agent 2 price envelope (list of {price}) and the new
    SerpAPI Google Hotels envelope (properties[*]).
    """
    if not isinstance(prices, dict):
        return [], "static"

    def _money(val):
        if val is None:
            return None
        if isinstance(val, (int, float)):
            return float(val)
        if isinstance(val, str):
            m = re.search(r"\d+(?:[\.,]\d+)?", val.replace(",", ""))
            return float(m.group(0).replace(",", "")) if m else None
        if isinstance(val, dict):
            for key in ("extracted_lowest", "lowest", "amount", "value", "price", "nightly_rate", "rate_per_night", "before_taxes_fees", "total_rate", "total_price"):
                parsed = _money(val.get(key))
                if parsed is not None:
                    return parsed
        if isinstance(val, list):
            for item in val:
                parsed = _money(item)
                if parsed is not None:
                    return parsed
        return None

    def _unwrap(env):
        if isinstance(env, dict) and env.get("ok") and isinstance(env.get("data"), (dict, list)):
            return env.get("data")
        return env

    def _legacy_samples(env):
        data = _unwrap(env)
        items = data if isinstance(data, list) else (data.get("data") if isinstance(data, dict) and isinstance(data.get("data"), list) else None)
        if items is None and isinstance(data, dict):
            items = data.get("items") if isinstance(data.get("items"), list) else None
        samples = []
        for item in items or []:
            if isinstance(item, dict):
                price = _money(item.get("price") or item.get("avg_price") or item.get("nightly_price"))
                if price is not None and price > 0:
                    samples.append(price)
        return samples

    def _serpapi_samples(env):
        data = _unwrap(env)
        if not isinstance(data, dict):
            return []
        samples = []
        for prop in data.get("properties") or data.get("hotels") or []:
            if not isinstance(prop, dict):
                continue
            nightly = _money(
                prop.get("rate_per_night")
                or prop.get("nightly_rate")
                or prop.get("price_per_night")
                or prop.get("price")
                or prop.get("lowest")
                or prop.get("extracted_lowest")
            )
            if nightly is None:
                total_price = _money(prop.get("total_rate") or prop.get("total_price") or prop.get("price_with_fees") or prop.get("before_taxes_fees"))
                if total_price is not None:
                    nightly = total_price / float(days or 1)
            if nightly is not None and nightly > 0:
                samples.append(float(nightly))
        return samples

    serpapi_samples = []
    legacy_samples = []

    for key in ("hotels_search_env", "google_hotels", "serpapi_hotels"):
        serpapi_samples.extend(_serpapi_samples(prices.get(key)))

    for key in ("hotels", "hotel_prices", "legacy_hotels"):
        legacy_samples.extend(_legacy_samples(prices.get(key)))

    if serpapi_samples:
        return serpapi_samples, "serpapi_google_hotels"
    if legacy_samples:
        return legacy_samples, "agent2_price_list"

    raw_serpapi_samples = _serpapi_samples(prices)
    if raw_serpapi_samples:
        return raw_serpapi_samples, "serpapi_google_hotels"

    return [], "static"


# Static KB: per-day cost defaults (CNY) used when no live data available
_STATIC_KB = {
    "default": {"hotel": 600.0, "food": 180.0, "attraction": 250.0, "pet_fee": 80.0, "flights": 1200.0},
}

def _parse_budget_range(budget_raw):
    """Parse '3000-5000' or '5000' into (min, max). Returns (0, float('inf')) if unparseable."""
    import re as _re
    nums = [float(x) for x in _re.findall(r"\d+(?:\.\d+)?", str(budget_raw or ""))]
    if len(nums) >= 2:
        return min(nums), max(nums)
    if len(nums) == 1:
        return 0.0, nums[0]
    return 0.0, float("inf")

# Transport cost rates (CNY/km) by mode
_TRANSPORT_RATE = {"driving": 0.8, "taxi": 2.5, "transit": 0.15}


def _score_flight(flight: dict, budget_max: float, adults: int = 1) -> int:
    """Score a flight option 0-100 based on price vs budget and duration.
    - Price score: 50 pts — how affordable vs flight budget (40% of total budget)
    - Duration score: 50 pts — shorter is better, penalised beyond 3h
    """
    price = float(flight.get("price") or 0)
    duration_min = int(flight.get("duration_min") or 0)

    # Price score: full 50 if within flight budget, scaled down if over
    flight_budget = (budget_max * 0.4) / max(adults, 1) if budget_max != float("inf") else 1200.0
    if flight_budget > 0 and price > 0:
        ratio = price / flight_budget
        price_score = max(0, int(50 * (1 - max(0, ratio - 1))))
    else:
        price_score = 25

    # Duration score: 50 pts at ≤60 min, 0 pts at ≥360 min
    if duration_min > 0:
        duration_score = max(0, int(50 * (1 - (duration_min - 60) / 300)))
    else:
        duration_score = 25

    return max(0, min(100, price_score + duration_score))


def _score_restaurant(restaurant: dict, budget_max: float, trip_days: int = 1) -> int:
    """Score a restaurant 0-100 based on rating, price level vs budget, and pet-friendliness."""
    score = int(restaurant.get("score") or 50)

    # Rating bonus
    rating = restaurant.get("rating") or (restaurant.get("raw") or {}).get("rating")
    if rating is not None:
        try:
            r = float(rating)
            score += int((r / 5.0) * 20) if r <= 5 else int((r / 10.0) * 20)
        except Exception:
            pass

    # Price level vs daily food budget
    daily_food_budget = (budget_max * 0.15) / max(trip_days, 1) if budget_max != float("inf") else 150.0
    price_level = restaurant.get("price") or (restaurant.get("raw") or {}).get("price") or ""
    meal_map = {1: 30, 2: 70, 3: 150, 4: 300}
    level = len(str(price_level).strip()) if isinstance(price_level, str) else 0
    if level and daily_food_budget > 0:
        estimated_cost = meal_map.get(level, 70)
        if estimated_cost <= daily_food_budget:
            score += 10
        else:
            score -= min(20, int((estimated_cost / daily_food_budget - 1) * 20))

    if restaurant.get("pet_friendly") is True:
        score += 15

    return max(0, min(100, score))


def estimate_budget_for_plan(user_profile, itineraries, route_matrix=None, prices=None):
    """Layered budget estimation with optional use of live price envelopes from Agent2:
    Layer 0 — Use provided prices (hotels) when available
    Layer 1 — Gaode route matrix (real distance + tolls)
    Layer 2 — Haversine itinerary distances
    Layer 3 — Flat per-day static KB fallback
    Non-transport costs prefer live prices when present otherwise fall back to static KB.
    """
    days = itineraries[0]["days"] if itineraries else 1
    budget_min, budget_max = _parse_budget_range(user_profile.get("budget"))
    num_people = max(int(user_profile.get("num_people") or 1), 1)
    num_pets = max(int(user_profile.get("num_pets") or 1), 1)
    headcount = num_people + num_pets
    kb = _STATIC_KB["default"]
    transport_mode = (user_profile.get("transport_mode") or "taxi").lower()
    rate = _TRANSPORT_RATE.get(transport_mode, 2.5)

    # Start with non-transport components, prefer live prices
    hotel_total = kb["hotel"] * int(days) * headcount
    food_total = kb["food"] * int(days) * num_people
    attraction_total = kb["attraction"] * headcount
    pet_fee_total = kb["pet_fee"] * int(days) * num_pets
    hotel_source = "static"
    hotel_sample_count = 0
    food_source = "static"
    attraction_source = "static"
    transport = str(user_profile.get("transport") or user_profile.get("transport_mode") or "").lower()
    has_flight = bool(user_profile.get("departure_id")) or any(k in transport for k in ("flight", "fly", "plane", "飞机"))
    flight_total = kb["flights"] if has_flight else 0.0
    flight_source = "static" if has_flight else "not_applicable"

    try:
        if prices and isinstance(prices, dict):
            # hotels
            vals, source = _extract_live_hotel_nightly_prices(prices, days)
            vals = [v for v in vals if isinstance(v, (int, float)) and v > 0]
            if vals:
                vals = sorted(vals)
                # pick the best (highest) hotel within budget_max; fall back to cheapest
                # hotel budget = 50% of total, split across days and headcount
                daily_budget = (budget_max * 0.5) / max(int(days), 1) / headcount
                affordable = [v for v in vals if v <= daily_budget] or [vals[0]]
                representative_nightly = affordable[-1]
                hotel_total = representative_nightly * int(days) * headcount
                hotel_source = source
                hotel_sample_count = n

            # flights: only if user has a flight leg
            if has_flight:
                flights_data = {}
                flights_env = prices.get("flights_env")
                if isinstance(flights_env, dict) and flights_env.get("ok"):
                    flights_data = flights_env.get("data") or {}
                flight_candidates = []
                for key in ("best_flights", "other_flights"):
                    for f in (flights_data.get(key) or []):
                        p = f.get("price")
                        if isinstance(p, (int, float)) and p > 0:
                            flight_candidates.append(float(p))
                if flight_candidates:
                    adults = int(user_profile.get("adults") or 1)
                    flight_total = min(flight_candidates) * 2 * adults  # round-trip
                    flight_source = "serpapi_google_flights"

            # food: derive per-day cost from restaurant price levels
            restaurants_data = {}
            restaurants_env = prices.get("restaurants_env")
            if isinstance(restaurants_env, dict) and restaurants_env.get("ok"):
                restaurants_data = restaurants_env.get("data") or {}
            price_levels = []
            for r in (restaurants_data.get("local_results") or []):
                pl = r.get("price")
                if isinstance(pl, str) and pl.strip():
                    price_levels.append(len(pl.strip()))
            if price_levels:
                meal_map = {1: 30, 2: 70, 3: 150, 4: 300}
                per_meal = meal_map.get(round(sum(price_levels) / len(price_levels)), 70)
                food_total = per_meal * 3 * int(days)
                food_source = "serpapi_google_maps_restaurants"

            # attractions: derive total ticket cost from attractions_env
            attractions_data = {}
            attractions_env = prices.get("attractions_env")
            if isinstance(attractions_env, dict) and attractions_env.get("ok"):
                attractions_data = attractions_env.get("data") or {}
            ticket_prices = []
            for a in (attractions_data.get("local_results") or []):
                raw_p = a.get("price") or a.get("ticket_price")
                if isinstance(raw_p, (int, float)) and raw_p > 0:
                    ticket_prices.append(float(raw_p))
                elif isinstance(raw_p, str):
                    m = re.search(r"\d+(?:[.,]\d+)?", raw_p.replace(",", ""))
                    if m:
                        ticket_prices.append(float(m.group(0)))
            if ticket_prices:
                attraction_total = (sum(ticket_prices) / len(ticket_prices)) * 2 * int(days)
                attraction_source = "serpapi_google_maps_attractions"
    except Exception:
        pass

    # --- Transport cost (layered) ---
    transport_source = "static"
    gaode = _transport_cost_from_gaode(route_matrix)
    if gaode:
        distance_km = gaode["total_distance_m"] / 1000.0
        transport_cost = distance_km * rate + gaode["total_tolls"]
        transport_source = "gaode"
    else:
        leg_cost = _transport_cost_from_itinerary(itineraries)
        if leg_cost is not None:
            transport_cost = leg_cost
            transport_source = "itinerary_haversine"
        else:
            # fallback static estimate
            transport_cost = kb["hotel"] * 0 + 80.0 * int(days)  # flat fallback
            transport_source = "static"

    # Fuel and parking for self-drive
    fuel_cost = 0.0
    parking_cost = 0.0
    transport_str = str(user_profile.get("transport") or user_profile.get("transport_mode") or "").lower()
    if any(k in transport_str for k in ("car", "drive", "driving", "自驾", "开车")):
        fuel_cost = 150.0 * int(days)    # ~¥150/day fuel estimate
        parking_cost = 80.0 * int(days)  # ~¥80/day parking estimate

    subtotal = hotel_total + food_total + attraction_total + pet_fee_total + transport_cost + flight_total + fuel_cost + parking_cost
    total = int(subtotal * 1.1)  # 10% contingency

    return {
        "total_estimate": total,
        "breakdown": {
            "hotel": int(hotel_total),
            "food": int(food_total),
            "attraction": int(attraction_total),
            "pet_fee": int(pet_fee_total),
            "transport": int(transport_cost),
            "flights": int(flight_total),
            "fuel": int(fuel_cost),
            "parking": int(parking_cost),
        },
        "transport_source": transport_source,
        "hotel_source": hotel_source,
        "hotel_samples_used": hotel_sample_count,
        "food_source": food_source,
        "attraction_source": attraction_source,
        "flight_source": flight_source,
        "days": int(days),
        "budget_range": user_profile.get("budget"),
        "note": "Estimates only. Hotel: " + hotel_source + ", food: " + food_source + ", attractions: " + attraction_source + ", flights: " + flight_source + ", transport: " + transport_source + ".",
    }


def hotel_zone_and_bundle(hotels, attractions=None, zone_radius_km=5.0):
    """Define accommodation zones based on attraction distribution and bundle hotels by tier.

    1. Compute zone centroid from attraction cluster (if provided), else from hotel spread.
    2. Group hotels into zones by proximity.
    3. Tag each hotel with a tier (luxury/comfort/budget) from metadata.
    4. Return zones with tier-matched hotel lists + commute efficiency score to attractions.
    """
    # --- Step 1: derive zone anchors from attraction centroid if available ---
    def _centroid(points):
        lats = [p["lat"] for p in points if p]
        lons = [p["lon"] for p in points if p]
        if not lats:
            return None
        return {"lat": sum(lats) / len(lats), "lon": sum(lons) / len(lons)}

    attraction_locs = []
    for a in (attractions or []):
        loc = _parse_location(a.get("location") or (a.get("raw") or {}).get("location") or "")
        if loc:
            attraction_locs.append(loc)
    attraction_centroid = _centroid(attraction_locs) if attraction_locs else None

    # --- Step 2: group hotels into zones ---
    def _hotel_loc(h):
        return _parse_location(h.get("location") or (h.get("raw") or {}).get("location") or "")

    def _hotel_tier(h):
        tier = h.get("tier") or (h.get("raw") or {}).get("tier") or ""
        name = str(h.get("name") or "").lower()
        if tier:
            return str(tier).lower()
        if any(k in name for k in ["luxury", "grand", "palace", "ritz", "四季", "丽思"]):
            return "luxury"
        if any(k in name for k in ["budget", "hostel", "inn", "如家", "汉庭", "7天"]):
            return "budget"
        return "comfort"

    zones: List[Dict] = []
    for h in hotels:
        loc = _hotel_loc(h)
        tier = _hotel_tier(h)
        entry = {"name": h.get("name"), "id": str(h.get("id") or h.get("poi_id") or ""), "tier": tier, "metadata": h}
        if not loc:
            # no location — put in unknown zone
            unk = next((z for z in zones if z["zone_name"] == "unknown"), None)
            if unk:
                unk["hotels"].append(entry)
            else:
                zones.append({"zone_name": "unknown", "center": None, "hotels": [entry]})
            continue
        placed = False
        for z in zones:
            if z["center"] is None:
                continue
            if _haversine_km(loc, z["center"]) <= zone_radius_km:
                z["hotels"].append(entry)
                placed = True
                break
        if not placed:
            zones.append({"zone_name": f"zone_{len(zones) + 1}", "center": loc, "hotels": [entry]})

    # --- Step 3: score each zone by commute efficiency to attraction centroid ---
    for z in zones:
        if z["center"] and attraction_centroid:
            z["commute_km_to_attractions"] = round(_haversine_km(z["center"], attraction_centroid), 2)
        else:
            z["commute_km_to_attractions"] = None

    # Sort zones: closest to attractions first
    zones.sort(key=lambda z: z["commute_km_to_attractions"] or 999)

    # --- Step 4: build tier-matched bundles per zone ---
    bundles = []
    for z in zones:
        by_tier: Dict[str, List] = {"luxury": [], "comfort": [], "budget": []}
        for h in z["hotels"]:
            by_tier.setdefault(h["tier"], []).append({"name": h["name"], "id": h["id"]})
        bundles.append({
            "zone": z["zone_name"],
            "commute_km_to_attractions": z["commute_km_to_attractions"],
            "hotels_by_tier": by_tier,
            "recommended": {
                "Premium": by_tier["luxury"][:1] or by_tier["comfort"][:1],
                "Comfort": by_tier["comfort"][:1] or by_tier["luxury"][:1],
                "Economy": by_tier["budget"][:1] or by_tier["comfort"][:1],
            },
        })

    return {"zones": zones, "bundles": bundles}



def replan_trip(
    current_location: str,
    failed_node_ids: List[str],
    scored_candidates: Dict,
    constraints: Dict,
    remaining_budget: float,
    remaining_minutes: int,
    retrieval_data: Optional[Dict] = None,
):
    """In-Trip Full Replanning — recalculate entire route from current location.

    1. Remove failed nodes from scored candidates.
    2. Apply live weather/traffic/budget/time constraints.
    3. Re-sequence remaining + alternative attractions from current location.
    4. Return a single best-fit revised plan with failure report.
    """
    failed_set = set(str(f) for f in (failed_node_ids or []))

    # Update constraints with live remaining budget/time
    live_constraints = dict(constraints or {})
    live_constraints.setdefault("route", {})["remaining_activity_minutes"] = remaining_minutes
    live_constraints.setdefault("user", {})["remaining_budget"] = remaining_budget

    # Pull live weather into constraints if available
    if retrieval_data:
        weather_block = retrieval_data.get("weather", {})
        now = (weather_block.get("now") or {})
        avoid = list((live_constraints.get("weather") or {}).get("avoid_conditions", []))
        try:
            temp = float((now.get("data") or now).get("temp", 0) if isinstance(now, dict) else 0)
            if temp > 35 and "high_temperature" not in avoid:
                avoid.append("high_temperature")
        except Exception:
            pass
        live_constraints.setdefault("weather", {})["avoid_conditions"] = avoid

    # Filter out failed nodes and already-filtered candidates
    def _keep(c):
        return not c.get("filtered") and str(c.get("id", "")) not in failed_set

    remaining_attractions = [c["metadata"] for c in scored_candidates.get("Attractions", []) if _keep(c)]
    hotels = [c["metadata"] for c in scored_candidates.get("Hotels", []) if not c.get("filtered")]

    # Inject current location as synthetic start node
    cur_loc = _parse_location(current_location)
    start_node = {"name": "Current Location", "location": current_location, "id": "__current__"} if cur_loc else None

    # Budget filter: estimate remaining per-attraction cost
    budget_cap = remaining_budget / max(1, len(remaining_attractions)) if remaining_attractions else 0
    if budget_cap > 0:
        remaining_attractions = [
            a for a in remaining_attractions
            if float(a.get("ticket_price") or (a.get("raw") or {}).get("ticket_price") or 0) <= budget_cap
        ]

    # Time filter: only include attractions that fit remaining time
    remaining_attractions = [
        a for a in remaining_attractions
        if int(a.get("visit_minutes") or (a.get("raw") or {}).get("visit_minutes") or 120) <= remaining_minutes
    ]

    if not remaining_attractions:
        return {
            "status": "no_alternatives",
            "failed_nodes": list(failed_set),
            "revised_plan": None,
            "message": "No suitable alternatives found within remaining budget and time.",
        }

    # Re-sequence from current location
    nodes = ([start_node] if start_node else []) + remaining_attractions
    dist_mat = _build_distance_matrix(nodes)
    order = _greedy_route(0, dist_mat)

    avg_speed = 30.0
    legs = []
    total_min = 0
    for i in range(len(order) - 1):
        a, b = nodes[order[i]], nodes[order[i + 1]]
        d_km = dist_mat[order[i]][order[i + 1]]
        if d_km == float("inf"):
            d_km = 0.0
        travel_min = int((d_km / avg_speed) * 60)
        visit_min = int(b.get("visit_minutes") or (b.get("raw") or {}).get("visit_minutes") or 120)
        if total_min + travel_min + visit_min > remaining_minutes:
            break
        total_min += travel_min + visit_min
        legs.append({
            "from": a.get("name", ""),
            "to": b.get("name", ""),
            "distance_km": round(d_km, 2),
            "travel_minutes": travel_min,
            "visit_minutes": visit_min,
        })

    return {
        "status": "replanned",
        "failed_nodes": list(failed_set),
        "revised_plan": {
            "legs": legs,
            "total_minutes": total_min,
            "total_hours": round(total_min / 60, 1),
            "attractions_count": len(legs),
        },
        "live_constraints_applied": {
            "remaining_budget": remaining_budget,
            "remaining_minutes": remaining_minutes,
            "weather_avoid": live_constraints.get("weather", {}).get("avoid_conditions", []),
        },
    }


def replace_stop(
    failed_node: Dict,
    current_location: str,
    scored_candidates: Dict,
    constraints: Dict,
    max_results: int = 3,
):
    """In-Trip Partial Replacement — find nearby alternatives for a single failed stop.

    Filters by: current weather, remaining time, pet constraints, proximity.
    Ranks by compatibility with original plan (same category, similar visit time).
    Returns top alternatives with replacement rationale.
    """
    weather_avoid = (constraints.get("weather") or {}).get("avoid_conditions", [])
    remaining_min = (constraints.get("route") or {}).get("remaining_activity_minutes")
    failed_id = str(failed_node.get("id") or failed_node.get("poi_id") or "")
    failed_type = str(failed_node.get("type") or (failed_node.get("raw") or {}).get("type") or "").lower()
    failed_visit_min = int(failed_node.get("visit_minutes") or (failed_node.get("raw") or {}).get("visit_minutes") or 120)

    cur_loc = _parse_location(current_location)

    alternatives = []
    for c in scored_candidates.get("Attractions", []):
        if c.get("filtered") or str(c.get("id", "")) == failed_id:
            continue
        meta = c["metadata"]

        # Pet constraint
        if meta.get("pet_friendly") is False:
            continue

        # Weather constraint
        if weather_avoid:
            vtype = str(meta.get("type") or (meta.get("raw") or {}).get("type") or "").lower()
            if any(cond in weather_avoid for cond in ["rain", "high_temperature"]):
                if any(k in vtype for k in ["park", "outdoor", "beach", "zoo"]):
                    continue

        # Time constraint
        visit_min = int(meta.get("visit_minutes") or (meta.get("raw") or {}).get("visit_minutes") or 120)
        if remaining_min is not None and visit_min > remaining_min:
            continue

        # Distance from current location
        dist = None
        if cur_loc:
            loc = _parse_location(meta.get("location") or (meta.get("raw") or {}).get("location") or "")
            if loc:
                dist = _haversine_km(cur_loc, loc)

        # Compatibility score: same type + similar visit duration
        compat = c["score"]
        alt_type = str(meta.get("type") or (meta.get("raw") or {}).get("type") or "").lower()
        if failed_type and alt_type and failed_type == alt_type:
            compat += 15
        time_diff = abs(visit_min - failed_visit_min)
        compat -= min(20, time_diff // 10)
        if dist is not None:
            compat -= min(20, int(dist * 2))
        compat = max(0, min(100, compat))

        # Build rationale
        reasons = []
        if failed_type and alt_type == failed_type:
            reasons.append(f"same category ({alt_type})")
        if dist is not None and dist < 3:
            reasons.append(f"{round(dist, 1)} km away")
        if meta.get("pet_friendly") is True:
            reasons.append("pet-friendly confirmed")
        if not reasons:
            reasons.append("nearest available alternative")

        alternatives.append({
            "name": meta.get("name", ""),
            "id": str(meta.get("id") or meta.get("poi_id") or ""),
            "compatibility_score": compat,
            "distance_km": round(dist, 2) if dist is not None else None,
            "visit_minutes": visit_min,
            "rationale": "; ".join(reasons),
            "metadata": meta,
        })

    alternatives.sort(key=lambda x: -x["compatibility_score"])
    return {
        "failed_stop": {"name": failed_node.get("name"), "id": failed_id},
        "alternatives": alternatives[:max_results],
    }


def emergency_triage(symptoms_text, user_profile=None):
    """Triage severity from symptoms; determine recommendation strategy."""
    system = (
        "You are an emergency triage assistant for pet health. "
        "Given symptoms, return JSON: {severity: Low|Medium|High|Emergency, "
        "reasons:[], recommended_actions:[], strategy: nearest_first|capability_match_first}"
    )
    try:
        completion = openai_chat(
            messages=[{"role": "system", "content": system}, {"role": "user", "content": symptoms_text}],
            model=os.getenv("AGENT3_MODEL", "gpt-5-mini"),
            max_tokens=300
        )
        raw = completion.choices[0].message.content
        try:
            parsed = json.loads(raw)
            parsed.setdefault("strategy", "nearest_first" if parsed.get("severity") == "Emergency" else "capability_match_first")
            return parsed
        except Exception:
            pass
    except Exception:
        pass
    # fallback keyword heuristics
    s = (symptoms_text or "").lower()
    if any(k in s for k in ["unconscious", "not breathing", "severe bleeding", "seizure", "collapse"]):
        return {"severity": "Emergency", "strategy": "nearest_first", "reasons": ["critical symptoms"], "recommended_actions": ["Call emergency vet immediately", "Go to nearest hospital"]}
    if any(k in s for k in ["vomit", "diarrhea", "lethargy", "swollen", "limping", "wound"]):
        return {"severity": "High", "strategy": "capability_match_first", "reasons": ["serious symptoms"], "recommended_actions": ["Contact vet", "Monitor closely"]}
    if any(k in s for k in ["scratch", "sneeze", "mild", "slight"]):
        return {"severity": "Medium", "strategy": "capability_match_first", "reasons": ["moderate symptoms"], "recommended_actions": ["Monitor, consult vet if worsens"]}
    return {"severity": "Low", "strategy": "capability_match_first", "reasons": [], "recommended_actions": ["Rest, monitor"]}


def recommend_hospitals(
    triage_result: Dict,
    scored_candidates: Dict,
    current_location: str,
    transport_mode: str = "taxi",
    max_results: int = 3,
):
    """Recommend 2-3 hospitals/pet hospitals based on triage severity and strategy.

    - Emergency → nearest_first: sort by ETA
    - Medium/High → capability_match_first: sort by specialist score then ETA
    Filters by transport accessibility (walking excluded for Emergency).
    Returns candidates with ETA, next actions.
    """
    severity = triage_result.get("severity", "Low")
    strategy = triage_result.get("strategy", "capability_match_first")
    cur_loc = _parse_location(current_location)

    # Speed estimates by mode (km/h)
    speed = {"driving": 40, "taxi": 35, "transit": 25, "walking": 5}.get(transport_mode, 35)

    # Exclude walking for Emergency
    if severity == "Emergency" and transport_mode == "walking":
        transport_mode = "taxi"
        speed = 35

    hospitals = [c for c in scored_candidates.get("Hospitals", []) if not c.get("filtered")]

    candidates = []
    for c in hospitals:
        meta = c["metadata"]
        name = meta.get("name", "")
        h_id = str(meta.get("id") or meta.get("poi_id") or "")

        # Distance & ETA
        dist_km, eta_min = None, None
        if cur_loc:
            loc = _parse_location(meta.get("location") or (meta.get("raw") or {}).get("location") or "")
            if loc:
                dist_km = round(_haversine_km(cur_loc, loc), 2)
                eta_min = int((dist_km / speed) * 60)

        # Capability score: specialist pet hospital
        cap_score = c["score"]
        name_lower = name.lower()
        if any(k in name_lower for k in ["pet", "animal", "vet", "veterinary", "宠物", "动物"]):
            cap_score += 25
        if meta.get("24h") or "24" in str(meta.get("opening_hours") or ""):
            cap_score += 15

        # Transport accessibility: skip if too far to walk in emergency
        if severity == "Emergency" and dist_km and dist_km > 20:
            continue

        candidates.append({
            "name": name,
            "id": h_id,
            "distance_km": dist_km,
            "eta_minutes": eta_min,
            "capability_score": min(100, cap_score),
            "opening_hours": meta.get("opening_hours") or (meta.get("raw") or {}).get("opening_hours"),
            "phone": meta.get("tel") or (meta.get("raw") or {}).get("tel"),
            "metadata": meta,
        })

    # Sort by strategy
    if strategy == "nearest_first":
        candidates.sort(key=lambda x: (x["eta_minutes"] or 999))
    else:
        candidates.sort(key=lambda x: (-x["capability_score"], x["eta_minutes"] or 999))

    top = candidates[:max_results]

    # Next actions based on severity
    if severity == "Emergency":
        next_actions = ["Call ahead to the hospital", "Go immediately — do not wait", "Keep pet calm and warm"]
    elif severity == "High":
        next_actions = ["Call hospital to confirm availability", "Go within the hour", "Bring vaccination records"]
    else:
        next_actions = ["Book an appointment", "Monitor symptoms", "Bring medical history"]

    return {
        "severity": severity,
        "strategy": strategy,
        "transport_mode": transport_mode,
        "candidates": top,
        "next_actions": next_actions,
    }


def agent3_planning(user_profile, retrieval_data, trip_days, lang: str = "en", on_fast_ready=None):
    """Agent 3 entry point: runs fetcher and reasoner in parallel.

    on_fast_ready: optional callback(fast_result) called as soon as fetcher completes,
    while the reasoner continues running in the background.
    """
    from concurrent.futures import ThreadPoolExecutor
    from agent3_fetcher import fetch as _fetch
    from agent3_reasoner import refine as _refine
    from agent3_finalizer import finalize as _finalize

    payload = {"user_profile": user_profile, "retrieval_data": retrieval_data, "trip_days": trip_days, "lang": lang}

    with ThreadPoolExecutor(max_workers=2) as ex:
        f_fast = ex.submit(_fetch, user_profile, retrieval_data, trip_days, lang)
        f_refined = ex.submit(_refine, payload)
        fast_out = f_fast.result()
        if on_fast_ready:
            on_fast_ready(fast_out.get("fast_response", {}))
        refined_out = f_refined.result()

    return _finalize(fast_out, refined_out).get("final", fast_out.get("fast_response", {}))


def _format_budget(budget_estimate):
    """Format budget_estimate (int or dict) into a readable string."""
    if isinstance(budget_estimate, dict):
        total = budget_estimate.get("total_estimate", 0)
        bd = budget_estimate.get("breakdown", {})
        hotel_src = budget_estimate.get("hotel_source", "static")
        hotel_n = budget_estimate.get("hotel_samples_used")
        food_src = budget_estimate.get("food_source", "static")
        attr_src = budget_estimate.get("attraction_source", "static")
        transport_src = budget_estimate.get("transport_source", "static")
        flight_src = budget_estimate.get("flight_source", "not_applicable")
        hotel_meta = f" [{hotel_src}{f', n={hotel_n}' if hotel_n else ''}]" if hotel_src else ""
        flight_part = f", flights ¥{bd.get('flights', 0)} [{flight_src}]" if flight_src != "not_applicable" else ""
        fuel_part = f", fuel ¥{bd['fuel']} [static]" if bd.get("fuel") else ""
        parking_part = f", parking ¥{bd['parking']} [static]" if bd.get("parking") else ""
        return (
            f"¥{total} total (hotel ¥{bd.get('hotel', 0)}{hotel_meta}, "
            f"food ¥{bd.get('food', 0)} [{food_src}], "
            f"attraction ¥{bd.get('attraction', 0)} [{attr_src}], "
            f"pet fee ¥{bd.get('pet_fee', 0)}, "
            f"transport ¥{bd.get('transport', 0)} [{transport_src}]"
            f"{flight_part}{fuel_part}{parking_part})"
        )
    return f"¥{budget_estimate}" if budget_estimate is not None else "N/A"

