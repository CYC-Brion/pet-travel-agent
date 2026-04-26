import json
import os
import uuid
import re
from datetime import datetime, UTC
from typing import Any, Dict, List, Optional, Sequence, Tuple


def detect_language(text: str) -> str:
    """Simple heuristic language detector: returns 'zh' if CJK chars present, else 'en'."""
    if not text:
        return 'en'
    if re.search(r'[\u4e00-\u9fff]', text):
        return 'zh'
    return 'en'

import sys
import requests
import threading
import itertools
import time
from contextlib import contextmanager

@contextmanager
def cli_spinner(message: str = "Processing..."):
    """Simple CLI spinner context manager (no extra deps).

    Usage:
        with cli_spinner("Thinking..."):
            long_running_call()

    This keeps the repo dependency-free and works on Windows terminals.
    """
    stop_event = threading.Event()
    def run():
        for c in itertools.cycle("|/-\\"):
            if stop_event.is_set():
                break
            sys.stdout.write(f"\r{message} {c}")
            sys.stdout.flush()
            time.sleep(0.1)
        # clear line
        sys.stdout.write("\r" + " " * (len(message) + 2) + "\r")
        sys.stdout.flush()
    t = threading.Thread(target=run)
    t.daemon = True
    t.start()
    try:
        yield
    finally:
        stop_event.set()
        t.join()


def safe_input(prompt: str) -> str:
    """Wrapper around input() that treats common exit words as process exit.

    Prints a farewell and calls sys.exit(0) when user types exit/quit/bye or on EOF.
    """
    try:
        val = input(prompt)
    except EOFError:
        print("Conversation ended. Safe travels!")
        sys.exit(0)

    if isinstance(val, str) and val.strip().lower() in ("exit", "quit", "bye"):
        print("Conversation ended. Safe travels!")
        sys.exit(0)
    return val

from dotenv import load_dotenv
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient
from azure.cosmos import CosmosClient

load_dotenv()

COSMOS_ENDPOINT = os.getenv("COSMOS_ENDPOINT")
COSMOS_KEY = os.getenv("COSMOS_KEY")
DATABASE_ID = os.getenv("COSMOS_DATABASE_ID")
CONTAINER_ID = os.getenv("COSMOS_CONTAINER_ID")
FOUNDRY_PROJECT_ENDPOINT = os.getenv("FOUNDRY_PROJECT_ENDPOINT")


def _required_env(name: str, value: Optional[str]) -> str:
    if value is None or not str(value).strip():
        raise RuntimeError(f"Missing required environment variable: {name}")
    return str(value).strip()


COSMOS_ENDPOINT = _required_env("COSMOS_ENDPOINT", COSMOS_ENDPOINT)
COSMOS_KEY = _required_env("COSMOS_KEY", COSMOS_KEY)
DATABASE_ID = _required_env("COSMOS_DATABASE_ID", DATABASE_ID)
CONTAINER_ID = _required_env("COSMOS_CONTAINER_ID", CONTAINER_ID)
FOUNDRY_PROJECT_ENDPOINT = _required_env("FOUNDRY_PROJECT_ENDPOINT", FOUNDRY_PROJECT_ENDPOINT)

cosmos_client = CosmosClient(COSMOS_ENDPOINT, COSMOS_KEY)
database = cosmos_client.get_database_client(DATABASE_ID)
container = database.get_container_client(CONTAINER_ID)
QWEATHER_API_KEY = os.getenv("QWEATHER_API_KEY")
QWEATHER_API_HOST = os.getenv("QWEATHER_API_HOST")
GAODE_API_KEY = os.getenv("GAODE_API_KEY")
GAODE_BASE_URL = os.getenv("GAODE_BASE_URL", "https://restapi.amap.com")
QWEATHER_BASE_URL = (
    f"https://{QWEATHER_API_HOST.strip()}" if (QWEATHER_API_HOST or "").strip() else os.getenv("QWEATHER_BASE_URL", "https://devapi.qweather.com")
)
SERPAPI_API_KEY = _required_env(
    "SERPAPI_API_KEY",
    os.getenv("SERPAPI_API_KEY")
)
# Allow multiple endpoint envs, but normalize to ONE base URL
SERPAPI_BASE_URL = (
    os.getenv("SERPAPI_BASE_ENDPOINT")
    or os.getenv("SERPAPI_GOOGLE_HOTELS_ENDPOINT")
    or os.getenv("SERPAPI_GOOGLE_FLIGHTS_ENDPOINT")
    or os.getenv("SERPAPI_GOOGLE_RESTAURANTS_ENDPOINT")
    or os.getenv("SERPAPI_GOOGLE_ATTRACTIONS_ENDPOINT")
    or "https://serpapi.com/search.json"
)
# Normalize endpoint (SerpAPI prefers /search.json)
if SERPAPI_BASE_URL.endswith("/search"):
    SERPAPI_BASE_URL = SERPAPI_BASE_URL + ".json"
LIVE_TOOL_TIMEOUT = float(os.getenv("LIVE_TOOL_TIMEOUT_SECONDS", "3.0"))

project_client = AIProjectClient(
    endpoint=FOUNDRY_PROJECT_ENDPOINT,
    credential=DefaultAzureCredential()
)
openai_client = project_client.get_openai_client()

# Per-agent model configuration (env-overridable)
AGENT1_MODEL = os.getenv("AGENT1_MODEL", "gpt-5-mini")
AGENT2_MODEL = os.getenv("AGENT2_MODEL", "gpt-4.1-mini")
AGENT3_MODEL = os.getenv("AGENT3_MODEL", "gpt-5-mini")
OPENAI_DEFAULT_MODEL = os.getenv("OPENAI_DEFAULT_MODEL", AGENT1_MODEL)


def openai_chat(messages, model: str = None, max_tokens: int = None, **kwargs):
    """Wrapper around openai_client.chat.completions.create with model selection, timing and basic error handling.

    - model: explicit model name; if None, uses OPENAI_DEFAULT_MODEL
    - returns the completion object from the SDK
    """
    chosen = model or OPENAI_DEFAULT_MODEL
    import time
    start = time.time()
    # filter out None-valued kwargs to avoid sending nulls to the SDK
    filtered_kwargs = {k: v for k, v in kwargs.items() if v is not None}
    try:
        call_args = {"model": chosen, "messages": messages}
        # allow callers to override token param by passing max_tokens or max_completion_tokens in kwargs
        call_args.update(filtered_kwargs)
        if max_tokens is not None and 'max_tokens' not in call_args and 'max_completion_tokens' not in call_args:
            # Some newer gpt-5 deployments expect 'max_completion_tokens' instead of 'max_tokens'
            if isinstance(chosen, str) and 'gpt-5' in chosen:
                call_args['max_completion_tokens'] = max_tokens
            else:
                call_args['max_tokens'] = max_tokens
        completion = openai_client.chat.completions.create(**call_args)
        elapsed = time.time() - start
        if os.getenv("LATENCY_DEBUG") == "1":
            print(f"[LATENCY] openai_chat model={chosen} took {elapsed:.2f}s")
        return completion
    except Exception as exc:
        if os.getenv("LATENCY_DEBUG") == "1":
            print(f"[LATENCY] openai_chat model={chosen} failed: {exc}")
        raise


def openai_chat_stream(messages, model: str = None, max_tokens: int = None, **kwargs):
    """Like openai_chat but yields text chunks as they arrive (streaming=True)."""
    chosen = model or OPENAI_DEFAULT_MODEL
    filtered_kwargs = {k: v for k, v in kwargs.items() if v is not None}
    call_args = {"model": chosen, "messages": messages, "stream": True}
    call_args.update(filtered_kwargs)
    if max_tokens is not None and 'max_tokens' not in call_args and 'max_completion_tokens' not in call_args:
        if isinstance(chosen, str) and 'gpt-5' in chosen:
            call_args['max_completion_tokens'] = max_tokens
        else:
            call_args['max_tokens'] = max_tokens
    for chunk in openai_client.chat.completions.create(**call_args):
        delta = chunk.choices[0].delta.content if chunk.choices else None
        if delta:
            yield delta



def _request_id() -> str:
    return f"tool-{uuid.uuid4().hex[:12]}"


def _ok(data: Any, service: str, upstream: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    return {
        "ok": True,
        "request_id": _request_id(),
        "service": service,
        "data": data,
        "error": None,
        "upstream": upstream or {},
    }


def _err(service: str, message: str, *, code: str = "UPSTREAM_ERROR", retryable: bool = True, upstream: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    return {
        "ok": False,
        "request_id": _request_id(),
        "service": service,
        "data": None,
        "error": {
            "code": code,
            "message": message,
            "retryable": retryable,
        },
        "upstream": upstream or {},
    }


def _request_json(url: str, params: Dict[str, Any], service: str) -> Dict[str, Any]:
    try:
        resp = requests.get(url, params=params, timeout=LIVE_TOOL_TIMEOUT)
    except requests.Timeout:
        return _err(service, f"{service} timed out", code="TIMEOUT", retryable=True)
    except Exception as exc:
        return _err(service, f"{service} request failed: {exc}", code="UPSTREAM_ERROR", retryable=True)

    upstream_meta: Dict[str, Any] = {"http_status": resp.status_code}
    payload: Dict[str, Any] = {}
    try:
        parsed = resp.json()
        if isinstance(parsed, dict):
            payload = parsed
    except Exception:
        payload = {}

    if resp.status_code in (401, 403):
        upstream_meta.update({
            "upstream_code": str(payload.get("code") or ""),
            "upstream_message": str(payload.get("message") or payload.get("msg") or ""),
        })
        return _err(service, f"{service} authorization failed", code="AUTH_FAILED", retryable=False, upstream=upstream_meta)
    if resp.status_code == 429:
        return _err(service, f"{service} rate limited", code="RATE_LIMITED", retryable=True, upstream=upstream_meta)
    if resp.status_code >= 400:
        return _err(service, f"{service} upstream returned HTTP {resp.status_code}", code="UPSTREAM_ERROR", retryable=True, upstream=upstream_meta)

    return _ok(payload, service, upstream=upstream_meta)

# --- Cosmos DB queries ---
def cosmos_query_user_profile(user_name: str):
    query = "SELECT * FROM c WHERE c.type='user_profile' AND c.user_id=@user_name"
    params = [{"name": "@user_name", "value": user_name}]
    return list(container.query_items(query=query, parameters=params, enable_cross_partition_query=True))

def cosmos_query_dog_profile(breed_name: str):
    query = "SELECT * FROM c WHERE c.type='dog_profile' AND c.breed_name=@breed_name"
    params = [{"name": "@breed_name", "value": breed_name}]
    return list(container.query_items(query=query, parameters=params, enable_cross_partition_query=True))

def cosmos_query_cat_profile(breed_name: str):
    query = "SELECT * FROM c WHERE c.type='cat_profile' AND c.breed_name=@breed_name"
    params = [{"name": "@breed_name", "value": breed_name}]
    return list(container.query_items(query=query, parameters=params, enable_cross_partition_query=True))

def cosmos_query_rules():
    query = "SELECT * FROM c WHERE c.type='rule'"
    return list(container.query_items(query=query, enable_cross_partition_query=True))

def cosmos_query_agent_policy():
    query = "SELECT * FROM c WHERE c.type='agent_policy'"
    return list(container.query_items(query=query, enable_cross_partition_query=True))

def cosmos_query_pet_travel_experience(city: str = None):
    """Retrieve social/travel experience entries: pitfall avoidance, accommodation tips, pet travel advice."""
    if city:
        query = "SELECT * FROM c WHERE c.type='pet_travel_experience' AND (c.city=@city OR NOT IS_DEFINED(c.city))"
        params = [{"name": "@city", "value": city}]
        return list(container.query_items(query=query, parameters=params, enable_cross_partition_query=True))
    query = "SELECT * FROM c WHERE c.type='pet_travel_experience'"
    return list(container.query_items(query=query, enable_cross_partition_query=True))

def get_or_create_user_profile(user_name: str):
    # Try to load existing profile
    profile = cosmos_query_user_profile(user_name)
    if profile:
        return profile[0]

    # If none exists, onboard the user
    pet_type = safe_input("🐾 What pet are you traveling with (dog/cat)? / 您携带什么宠物出行（狗/猫）？: ")
    breed = safe_input("🐶🐱 What is the breed? / 品种是什么？: ")
    preferences = safe_input("✨ Any preferences (e.g., pet-friendly hotels, quiet areas)? (optional) / 有什么偏好（如宠物友好酒店、安静区域）？（可选填）: ")
    locale = safe_input("🌐 Preferred language (en/zh) [leave blank to auto-detect] / 首选语言（en/zh）[留空自动检测]: ") or None

    new_profile = {
        "id": str(uuid.uuid4()),
        "type": "user_profile",
        "user_id": user_name,
        "pet_type": pet_type,
        "breed": breed,
        "preferences": preferences,
        "locale": locale,
        "timestamp": datetime.now(UTC).isoformat()
    }

    container.create_item(new_profile)
    return new_profile


def update_user_locale_preferences(user_name: str, locale: Optional[str] = None, preferences: Optional[str] = None):
    """Upsert locale/preferences into the user's profile in Cosmos DB."""
    items = cosmos_query_user_profile(user_name)
    if items:
        profile = items[0]
        changed = False
        if locale and profile.get("locale") != locale:
            profile["locale"] = locale
            changed = True
        if preferences and profile.get("preferences") != preferences:
            profile["preferences"] = preferences
            changed = True
        if changed:
            profile["updated_at"] = datetime.now(UTC).isoformat()
            container.upsert_item(profile)
        return profile
    else:
        # create minimal profile
        new_profile = {
            "id": str(uuid.uuid4()),
            "type": "user_profile",
            "user_id": user_name,
            "pet_type": None,
            "breed": None,
            "budget": None,
            "preferences": preferences,
            "locale": locale,
            "timestamp": datetime.now(UTC).isoformat()
        }
        container.create_item(new_profile)
        return new_profile



_ZH_TO_EN = {
    "北京": "beijing", "上海": "shanghai", "广州": "guangzhou", "深圳": "shenzhen",
    "成都": "chengdu", "杭州": "hangzhou", "重庆": "chongqing", "厦门": "xiamen",
    "武汉": "wuhan", "西安": "xian", "南京": "nanjing", "苏州": "suzhou",
    "青岛": "qingdao", "天津": "tianjin", "昆明": "kunming", "桂林": "guilin",
    "三亚": "sanya", "哈尔滨": "harbin", "郑州": "zhengzhou", "长沙": "changsha",
}
_EN_TO_ZH = {v: k for k, v in _ZH_TO_EN.items()}

def _city_variants(city: str) -> list:
    c = city.strip()
    alt = _ZH_TO_EN.get(c) or _EN_TO_ZH.get(c.lower())
    variants = {c, c.title(), c.lower()}
    if alt:
        variants.update([alt, alt.title(), alt.lower()])
    return list(variants)


def query_cosmos_hospitals(city: str) -> list:
    results = []
    for variant in _city_variants(city):
        query = "SELECT * FROM c WHERE c.type='hospital_clinic' AND (c.city=@city OR c.City=@city)"
        params = [{"name": "@city", "value": variant}]
        try:
            results.extend(container.query_items(query=query, parameters=params, enable_cross_partition_query=True))
        except Exception:
            pass
    return results


def query_cosmos_hotels(city: str) -> list:
    results = []
    for variant in _city_variants(city):
        query = "SELECT * FROM c WHERE c.type='hotel' AND (c.city=@city OR c.City=@city)"
        params = [{"name": "@city", "value": variant}]
        try:
            results.extend(container.query_items(query=query, parameters=params, enable_cross_partition_query=True))
        except Exception:
            pass
    return results


# --- User slots (persistent key-value per user) ---
# Used for stable facts like 'trip_days', 'city', 'date' that should persist across sessions.
def save_user_slot(user_name: str, key: str, value: Any) -> bool:
    """Save a user slot into Cosmos. Returns True if saved, False otherwise.

    Skips common control words and empty values. When MEMORY_DEBUG env var is set to '1', prints debug info.
    """
    try:
        s = str(value).strip()
        low = s.lower()
        if low in ("", "exit", "quit", "bye", "none"):
            if os.getenv("MEMORY_DEBUG") == "1":
                print(f"[MEMORY DEBUG] Not saving slot {key} for user {user_name}: value='{value}' (filtered)")
            return False
    except Exception:
        pass

    slot_id = f"user_slot:{user_name}:{key}"
    doc = {
        "id": slot_id,
        "type": "user_slot",
        "user_id": user_name,
        "slot_key": key,
        "slot_value": value,
        "timestamp": datetime.now(UTC).isoformat()
    }
    try:
        container.upsert_item(doc)
        if os.getenv("MEMORY_DEBUG") == "1":
            print(f"[MEMORY DEBUG] Saved slot {key}='{value}' for user {user_name}")
        return True
    except Exception as exc:
        if os.getenv("MEMORY_DEBUG") == "1":
            print(f"[MEMORY DEBUG] Failed to save slot {key} for user {user_name}: {exc}")
        return False


def load_user_slots(user_name: str) -> dict:
    query = "SELECT * FROM c WHERE c.type='user_slot' AND c.user_id=@user_name ORDER BY c.timestamp DESC"
    params = [{"name": "@user_name", "value": user_name}]
    try:
        items = list(container.query_items(query=query, parameters=params, enable_cross_partition_query=True))
    except Exception as exc:
        if os.getenv("MEMORY_DEBUG") == "1":
            print(f"[MEMORY DEBUG] Failed to load slots for {user_name}: {exc}")
        return {}
    slots = {}
    # take the latest value per key (items are ordered newest-first)
    for it in items:
        k = it.get("slot_key")
        v = it.get("slot_value")
        try:
            if isinstance(v, str) and v.strip().lower() in ("", "exit", "quit", "bye", "none"):
                continue
        except Exception:
            pass
        if k and k not in slots:
            slots[k] = v
    if os.getenv("MEMORY_DEBUG") == "1":
        print(f"[MEMORY DEBUG] Loaded slots for {user_name}: {slots}")
    return slots

# --- API fetching ---
CITY_IDS = {
    "Beijing": "101010100", "北京": "101010100",
    "Shanghai": "101020100", "上海": "101020100",
    "Hong Kong": "101320101", "香港": "101320101",
    "Guangzhou": "101280101", "广州": "101280101",
    "Shenzhen": "101280601", "深圳": "101280601"
}


# ---------------------------
# Gaode (Amap) schema-aligned wrappers
# ---------------------------
def fetch_gaode_geocode(address: str, city: Optional[str] = None) -> Dict[str, Any]:
    service = "tool.gaode.geocode"
    params: Dict[str, Any] = {"key": GAODE_API_KEY, "address": address}
    if city:
        params["city"] = city
    raw = _request_json(f"{GAODE_BASE_URL}/v3/geocode/geo", params, service)
    if not raw["ok"]:
        return raw
    payload = raw["data"] or {}
    if str(payload.get("status", "0")) != "1":
        return _err(service, str(payload.get("info") or "gaode geocode failed"), code="UPSTREAM_EMPTY", upstream=raw.get("upstream"))
    geocodes = payload.get("geocodes") or []
    items = [
        {
            "formatted_address": str(item.get("formatted_address") or address),
            "province": str(item.get("province") or ""),
            "city": str(item.get("city") or city or ""),
            "district": str(item.get("district") or ""),
            "adcode": str(item.get("adcode") or ""),
            "location": str(item.get("location") or ""),
            "level": str(item.get("level") or ""),
        }
        for item in geocodes
    ]
    return _ok({"items": items}, service, upstream={**raw.get("upstream", {}), "upstream_code": payload.get("infocode"), "upstream_message": payload.get("info")})


def fetch_gaode_distance(origins: Sequence[str], destinations: Sequence[str], mode: str = "driving") -> Dict[str, Any]:
    service = "tool.gaode.distance"
    if not origins or not destinations:
        return _err(service, "origins and destinations are required", code="VALIDATION_ERROR", retryable=False)
    params = {
        "key": GAODE_API_KEY,
        "origins": "|".join(origins),
        "destination": "|".join(destinations),
        "type": "1" if mode == "driving" else "0",
    }
    raw = _request_json(f"{GAODE_BASE_URL}/v3/distance", params, service)
    if not raw["ok"]:
        return raw
    payload = raw["data"] or {}
    if str(payload.get("status", "0")) != "1":
        return _err(service, str(payload.get("info") or "gaode distance failed"), code="UPSTREAM_EMPTY", upstream=raw.get("upstream"))
    return _ok({"results": payload.get("results") or []}, service, upstream=raw.get("upstream"))


def fetch_gaode_poi_around(location: str, keywords: str = "", radius: int = 3000, page: int = 1, offset: int = 20, types: Optional[str] = None) -> Dict[str, Any]:
    service = "tool.gaode.poi_around"
    params: Dict[str, Any] = {
        "key": GAODE_API_KEY,
        "location": location,
        "keywords": keywords,
        "radius": radius,
        "page": page,
        "offset": offset,
    }
    if types:
        params["types"] = types
    raw = _request_json(f"{GAODE_BASE_URL}/v3/place/around", params, service)
    if not raw["ok"]:
        return raw
    payload = raw["data"] or {}
    if str(payload.get("status", "0")) != "1":
        return _err(service, str(payload.get("info") or "gaode poi around failed"), code="UPSTREAM_EMPTY", upstream=raw.get("upstream"))
    return _ok({"pois": payload.get("pois") or []}, service, upstream=raw.get("upstream"))


def fetch_gaode_poi_detail(poi_id: str) -> Dict[str, Any]:
    service = "tool.gaode.poi_detail"
    params = {"key": GAODE_API_KEY, "id": poi_id, "extensions": "all"}
    raw = _request_json(f"{GAODE_BASE_URL}/v3/place/detail", params, service)
    if not raw["ok"]:
        return raw
    payload = raw["data"] or {}
    if str(payload.get("status", "0")) != "1":
        return _err(service, str(payload.get("info") or "gaode poi detail failed"), code="UPSTREAM_EMPTY", upstream=raw.get("upstream"))
    pois = payload.get("pois") or []
    return _ok({"poi": pois[0] if pois else {}}, service, upstream=raw.get("upstream"))


def fetch_gaode_poi_keyword(keywords: str, city: Optional[str] = None, location: Optional[str] = None, radius: int = 5000, page: int = 1, offset: int = 20) -> Dict[str, Any]:
    service = "tool.gaode.poi_keyword"
    params: Dict[str, Any] = {
        "key": GAODE_API_KEY,
        "keywords": keywords,
        "page": page,
        "offset": offset,
        "extensions": "all",
    }
    if city:
        params["city"] = city
    if location:
        params["location"] = location
        params["radius"] = radius
    raw = _request_json(f"{GAODE_BASE_URL}/v3/place/text", params, service)
    if not raw["ok"]:
        return raw
    payload = raw["data"] or {}
    if str(payload.get("status", "0")) != "1":
        return _err(service, str(payload.get("info") or "gaode poi keyword failed"), code="UPSTREAM_EMPTY", upstream=raw.get("upstream"))
    return _ok({"pois": payload.get("pois") or []}, service, upstream=raw.get("upstream"))


def _fetch_gaode_route(path: str, service: str, params: Dict[str, Any]) -> Dict[str, Any]:
    params = {"key": GAODE_API_KEY, **params}
    raw = _request_json(f"{GAODE_BASE_URL}{path}", params, service)
    if not raw["ok"]:
        return raw
    payload = raw["data"] or {}
    if str(payload.get("status", "0")) != "1":
        return _err(service, str(payload.get("info") or f"{service} failed"), code="UPSTREAM_EMPTY", upstream=raw.get("upstream"))
    return _ok(payload, service, upstream=raw.get("upstream"))


def fetch_gaode_route_driving(origin: str, destination: str) -> Dict[str, Any]:
    return _fetch_gaode_route("/v3/direction/driving", "tool.gaode.route_driving", {"origin": origin, "destination": destination, "extensions": "all"})


def fetch_gaode_route_walking(origin: str, destination: str) -> Dict[str, Any]:
    return _fetch_gaode_route("/v3/direction/walking", "tool.gaode.route_walking", {"origin": origin, "destination": destination})


def fetch_gaode_route_bicycling(origin: str, destination: str) -> Dict[str, Any]:
    return _fetch_gaode_route("/v4/direction/bicycling", "tool.gaode.route_bicycling", {"origin": origin, "destination": destination})


def fetch_gaode_route_transit(origin: str, destination: str, city: str, cityd: Optional[str] = None) -> Dict[str, Any]:
    return _fetch_gaode_route(
        "/v3/direction/transit/integrated",
        "tool.gaode.route_transit",
        {"origin": origin, "destination": destination, "city": city, "cityd": cityd or city, "extensions": "all"},
    )


def fetch_gaode_route_matrix(origins: Sequence[str], destinations: Sequence[str], mode: str = "driving") -> Dict[str, Any]:
    service = "tool.gaode.route_matrix"
    if not origins or not destinations:
        return _err(service, "origins and destinations are required", code="VALIDATION_ERROR", retryable=False)
    results: List[Dict[str, Any]] = []
    for origin in origins:
        for destination in destinations:
            if mode == "walking":
                route = fetch_gaode_route_walking(origin, destination)
            elif mode == "bicycling":
                route = fetch_gaode_route_bicycling(origin, destination)
            elif mode == "transit":
                route = fetch_gaode_route_transit(origin, destination, city="")
            else:
                route = fetch_gaode_route_driving(origin, destination)
            results.append({"origin": origin, "destination": destination, "route": route})
    return _ok({"pairs": results, "mode": mode}, service)


def fetch_gaode_traffic_live(location: str, radius: int = 1000) -> Dict[str, Any]:
    service = "tool.gaode.traffic_live"
    params = {"key": GAODE_API_KEY, "location": location, "radius": radius, "extensions": "all"}
    raw = _request_json(f"{GAODE_BASE_URL}/v3/traffic/status/circle", params, service)
    if not raw["ok"]:
        return raw
    payload = raw["data"] or {}
    if str(payload.get("status", "0")) != "1":
        return _err(service, str(payload.get("info") or "gaode traffic failed"), code="UPSTREAM_EMPTY", upstream=raw.get("upstream"))
    return _ok(payload.get("trafficinfo") or {}, service, upstream=raw.get("upstream"))


# ---------------------------
# QWeather schema-aligned wrappers
# ---------------------------
def _qweather_location(city_name_or_id: str) -> str:
    return CITY_IDS.get(city_name_or_id, city_name_or_id)


def _fetch_qweather(path: str, service: str, params: Dict[str, Any]) -> Dict[str, Any]:
    raw = _request_json(f"{QWEATHER_BASE_URL}{path}", {**params, "key": QWEATHER_API_KEY}, service)
    if not raw["ok"]:
        return raw
    payload = raw["data"] or {}
    if str(payload.get("code", "")) != "200":
        return _err(service, str(payload.get("message") or f"{service} failed"), code="UPSTREAM_EMPTY", upstream={**raw.get("upstream", {}), "upstream_code": payload.get("code")})
    return _ok(payload, service, upstream=raw.get("upstream"))


def fetch_qweather_now(location: str) -> Dict[str, Any]:
    loc = _qweather_location(location)
    raw = _fetch_qweather("/v7/weather/now", "tool.qweather.now", {"location": loc})
    if not raw["ok"]:
        return raw
    return _ok(raw["data"].get("now") or {}, "tool.qweather.now", upstream=raw.get("upstream"))


def fetch_qweather_forecast(location: str, days: int = 3) -> Dict[str, Any]:
    loc = _qweather_location(location)
    endpoint_days = 7 if days == 7 else 3
    raw = _fetch_qweather(f"/v7/weather/{endpoint_days}d", "tool.qweather.forecast", {"location": loc})
    if not raw["ok"]:
        return raw
    return _ok(raw["data"].get("daily") or [], "tool.qweather.forecast", upstream=raw.get("upstream"))


def fetch_qweather_minutely(location: str) -> Dict[str, Any]:
    loc = _qweather_location(location)
    raw = _fetch_qweather("/v7/minutely/5m", "tool.qweather.minutely", {"location": loc})
    if not raw["ok"]:
        return raw
    data = raw["data"]
    return _ok({"summary": data.get("summary"), "minute_data": data.get("minuteData") or data.get("precipitation") or []}, "tool.qweather.minutely", upstream=raw.get("upstream"))


def fetch_qweather_indices(location: str, days: int = 1, index_type: str = "0") -> Dict[str, Any]:
    loc = _qweather_location(location)
    raw = _fetch_qweather(f"/v7/indices/{days}d", "tool.qweather.indices", {"location": loc, "type": index_type})
    if not raw["ok"]:
        return raw
    return _ok(raw["data"].get("daily") or [], "tool.qweather.indices", upstream=raw.get("upstream"))

def fetch_weather(city_id: str):
    result = fetch_qweather_now(city_id)
    if not result.get("ok"):
        raise RuntimeError((result.get("error") or {}).get("message") or "QWeather now failed")
    return result.get("data")

def fetch_weather_by_name(city_name: str):
    return fetch_weather(_qweather_location(city_name))

def fetch_poi(city: str, keyword: str):
    result = fetch_gaode_poi_keyword(keyword, city=city, page=1, offset=10)
    if not result.get("ok"):
        raise RuntimeError((result.get("error") or {}).get("message") or "Gaode POI failed")
    return {"pois": result.get("data", {}).get("pois") or []}

def fetch_route(origin: str, destination: str, mode: str = "driving"):
    """
    Fetch route between two coordinates using Gaode API.
    origin/destination format: "lng,lat"
    mode: driving | walking | riding | transit
    """
    if mode == "walking":
        result = fetch_gaode_route_walking(origin, destination)
    elif mode == "bicycling":
        result = fetch_gaode_route_bicycling(origin, destination)
    elif mode == "transit":
        result = fetch_gaode_route_transit(origin, destination, city="")
    else:
        result = fetch_gaode_route_driving(origin, destination)
    if not result.get("ok"):
        raise RuntimeError((result.get("error") or {}).get("message") or "Gaode route failed")
    return result.get("data")


# --- Budget Calculation ---
def estimate_trip_cost(days: int, hotel_price: float, food_per_day: float,
                       transport_per_day: float, attraction_fees: float):
    return hotel_price * days + food_per_day * days + transport_per_day * days + attraction_fees

# --- Conversation memory ---
def save_message(session_id, role, content, user_name=None):
    doc = {
        "id": str(uuid.uuid4()),
        "type": "session_memory",
        "session_id": session_id,
        "user_id": user_name,
        "role": role,
        "content": content,
        "timestamp": datetime.now(UTC).isoformat()
    }
    container.create_item(doc)


def load_recent_conversation(session_id, user_name, limit=10):
    query = """
    SELECT * FROM c 
    WHERE c.type='session_memory' 
      AND c.session_id=@session_id 
    AND c.user_id=@user_name
    ORDER BY c.timestamp DESC
    """
    params = [
        {"name": "@session_id", "value": session_id},
        {"name": "@user_name", "value": user_name},
    ]
    items = list(container.query_items(query=query, parameters=params, enable_cross_partition_query=True))
    return list(reversed(items[:limit]))


def load_user_conversation(user_name: str, limit: int = 10):
    """Load recent conversation messages across all sessions for a given user (newest first).

    Returns chronological list (oldest-first) up to `limit` messages.
    """
    query = """
    SELECT * FROM c
    WHERE c.type='session_memory' AND c.user_id=@user_name
    ORDER BY c.timestamp DESC
    """
    params = [{"name": "@user_name", "value": user_name}]
    try:
        items = list(container.query_items(query=query, parameters=params, enable_cross_partition_query=True))
    except Exception as exc:
        if os.getenv("MEMORY_DEBUG") == "1":
            print(f"[MEMORY DEBUG] load_user_conversation failed: {exc}")
        return []
    # return oldest-first for readability
    items = list(reversed(items[:limit]))
    if os.getenv("MEMORY_DEBUG") == "1":
            print(f"[MEMORY DEBUG] load_user_conversation for {user_name}: returning {len(items)} messages")
    return items


# --- Unified single-call analysis ---
def analyze_message(user_prompt: str, lang: Optional[str] = None) -> dict:
    """Single LLM call replacing classify_intent + extract_slots_from_message + decide_agents."""
    from datetime import date
    today = date.today().isoformat()
    system_msg = (
        f"Today's date is {today}.\n"
        "Analyze the user message and return a single JSON object with these keys:\n"
        "  mode: pre_trip | trip_companion | conversation\n"
        "    - pre_trip: user is planning a future trip (mentions future dates, 'plan a trip', 'going to', 'want to visit')\n"
        "    - trip_companion: user is currently on a trip or asking about real-time/today/tomorrow conditions\n"
        "    - conversation: general chat, greetings, unrelated questions\n"
        "  Date-based mode rule: if the message mentions a specific date, compare it to today.\n"
        "    - date > today → pre_trip\n"
        "    - date == today or date < today → trip_companion\n"
        "  domain: accommodation | transport | health | food | attractions | weather | budget | other\n"
        "  action: search | plan | book | compare | emergency | confirm | recall | greet | modify | replace | other\n"
        "  call_agent2: true | false  (needs external data retrieval? true for weather/POI/rules queries)\n"
        "  call_agent3: true | false  (needs trip planning? false for weather-only, greet, recall, or single-question queries)\n"
        "  Routing rules: weather-only questions → call_agent2=true, call_agent3=false, mode=trip_companion. "
        "Simple factual questions (no itinerary needed) → call_agent3=false. "
        "Full trip plan requests → call_agent2=true, call_agent3=true. "
        "Hotel/restaurant/attraction search or recommendation requests (e.g. 'give me hotels', 'recommend restaurants') → call_agent2=true, call_agent3=true, mode=pre_trip or trip_companion (never conversation). "
        "Never set mode=conversation if the user is asking for travel recommendations, hotels, restaurants, or attractions.\n"
        "  slots: object with only explicitly mentioned keys from: city, departure, date (YYYY-MM-DD), "
        "days (int), num_people (int), num_pets (int), budget (string), transport (string), pet_weight (number)\n"
        "Output strictly valid JSON only. No explanation."
    )
    if lang == 'zh':
        system_msg += "\n请用中文输出 slots 中的字符串值，其余 key 名保持英文。"
    completion = openai_chat(
        messages=[{"role": "system", "content": system_msg}, {"role": "user", "content": user_prompt}],
        model=os.getenv("AGENT1_MODEL", AGENT1_MODEL)
    )
    try:
        result = json.loads(completion.choices[0].message.content)
        result.setdefault("slots", {})
        result.setdefault("call_agent2", True)
        result.setdefault("call_agent3", True)
        return result
    except Exception:
        return {"mode": "trip_companion", "domain": "other", "action": "other",
                "call_agent2": True, "call_agent3": True, "slots": {}}


# --- Intent classification ---
def classify_intent(user_prompt: str, lang: Optional[str] = None) -> dict:
    system_msg = """Classify the user request into JSON with keys:
            mode: pre_trip | trip_companion | conversation
            domain: accommodation | transport | health | food | attractions | weather | budget | other
            action: search | plan | book | compare | emergency | confirm | recall | greet | other"""
    if lang == 'zh':
        system_msg = system_msg + "\n请使用中文回复，并且严格返回有效的 JSON。"
    else:
        system_msg = system_msg + "\nPlease reply in English and output strictly valid JSON."

    completion = openai_chat(
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_prompt}
        ],
        model=os.getenv("AGENT1_MODEL", AGENT1_MODEL)
    )
    try:
        return json.loads(completion.choices[0].message.content)
    except Exception:
        return {"mode": "trip_companion", "domain": "other", "action": "other"}  # fallback


def extract_slots_from_message(user_prompt: str, lang: Optional[str] = None) -> dict:
    system_msg = (
        "Extract travel slot values from the user message. Return JSON with only the keys that are explicitly mentioned. "
        "Keys: city (destination), departure (departure city), date (YYYY-MM-DD), days (integer), "
        "num_people (integer), num_pets (integer), budget (string), transport (string), pet_weight (number). "
        "Return {} if nothing is mentioned. Output strictly valid JSON only."
    )
    completion = openai_chat(
        messages=[{"role": "system", "content": system_msg}, {"role": "user", "content": user_prompt}],
        model=os.getenv("AGENT1_MODEL", AGENT1_MODEL)
    )
    try:
        return json.loads(completion.choices[0].message.content)
    except Exception:
        return {}


def decide_agents(user_prompt: str, intent: dict, lang: Optional[str] = None) -> dict:
    """Decide which agents to invoke.

    Returns JSON with keys:
      - call_agent2: bool
      - call_agent3: bool
      - parallel: bool (suggestion; orchestrator decides execution)
      - needs_retrieval: bool (whether agent3 requires agent2 output)
      - reason: short explanation

    Uses the LLM for flexible rules, with a deterministic fallback.
    """
    system_msg = "You are Agent 1's dispatcher. Decide whether to call Agent 2 (retrieval/tools) and/or Agent 3 (planning) to satisfy the user's request.\nRespond with JSON: {\"call_agent2\": true/false, \"call_agent3\": true/false, \"parallel\": true/false, \"needs_retrieval\": true/false, \"reason\": \"...\"}."
    if lang == 'zh':
        system_msg = system_msg + "\n请用中文简短说明决定理由，并以 JSON 输出。"

    messages = [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": f"Intent: {json.dumps(intent, ensure_ascii=False)}\nUser: {user_prompt}"},
    ]
    try:
        completion = openai_client.chat.completions.create(
            model="gpt-5-mini",
            messages=messages,
            max_tokens=300
        )
        raw = completion.choices[0].message.content
        parsed = json.loads(raw)
        # normalize
        return {
            "call_agent2": bool(parsed.get("call_agent2", True)),
            "call_agent3": bool(parsed.get("call_agent3", True)),
            "parallel": bool(parsed.get("parallel", False)),
            "needs_retrieval": bool(parsed.get("needs_retrieval", True)),
            "reason": parsed.get("reason", "")
        }
    except Exception:
        # deterministic fallback rules
        mode = intent.get("mode", "trip_companion")
        domain = intent.get("domain", "other")
        action = intent.get("action", "other")
        # default mapping
        call_agent2 = False
        call_agent3 = False
        if mode == "pre_trip":
            call_agent2 = True
            call_agent3 = True
        elif domain in ("weather", "attractions", "transport", "health"):
            call_agent2 = True
        elif action in ("plan", "compare", "book"):
            call_agent3 = True
        else:
            # conservative default: both
            call_agent2 = True
            call_agent3 = True
        # fallback: if both called, assume agent3 needs retrieval
        needs_retrieval = True if call_agent2 and call_agent3 else False
        return {"call_agent2": call_agent2, "call_agent3": call_agent3, "parallel": False, "needs_retrieval": needs_retrieval, "reason": "fallback rule"}

def agent_response_conversation(session_id, user_name, user_prompt, history, lang: Optional[str] = None, user_profile: Optional[dict] = None, trip_context: Optional[dict] = None):
    save_message(session_id, "user", user_prompt, user_name)
    messages = [{"role": h["role"], "content": h["content"]} for h in history]

    profile_lines = []
    if user_profile:
        profile_lines.append(f"Pet type: {user_profile.get('pet_type')}, Breed: {user_profile.get('breed')}, Weight: {user_profile.get('pet_weight')}kg")
        profile_lines.append(f"People: {user_profile.get('num_people', 1)}, Pets: {user_profile.get('num_pets', 1)}, Budget: {user_profile.get('budget')}, Transport: {user_profile.get('transport')}")
    if trip_context:
        profile_lines.append(f"Trip: {trip_context.get('city')} from {trip_context.get('departure')}, {trip_context.get('date')}, {trip_context.get('days')} days")

    lang_instruction = "请用中文回复。" if lang == 'zh' else "Please reply in English."
    profile_block = "\n".join(profile_lines)
    sys_msg = f"{lang_instruction}"
    if profile_block:
        sys_msg += f"\nUser profile and trip context (do NOT ask for this information again):\n{profile_block}"
    messages.insert(0, {"role": "system", "content": sys_msg})
    messages.append({"role": "user", "content": user_prompt})
    completion = openai_chat(messages=messages, model=os.getenv("AGENT1_MODEL", AGENT1_MODEL))
    reply = completion.choices[0].message.content
    save_message(session_id, "assistant", reply, user_name)
    return reply



# --- Candidate enrichment utilities ---
def _parse_numeric(s: str) -> Optional[float]:
    
    try:
        if s is None:
            return None
        if isinstance(s, (int, float)):
            return float(s)
        # extract first number
        m = re.search(r"\d+(?:[\.,]\d+)?", str(s))
        if not m:
            return None
        num = m.group(0).replace(',', '')
        return float(num)
    except Exception:
        return None


def _normalize_rating(raw_rating) -> Optional[float]:
    """Normalize various rating scales to 0-100."""
    val = _parse_numeric(raw_rating)
    if val is None:
        return None
    # Heuristic: if <=5 treat as 5-star
    if val <= 5:
        return max(0.0, min(100.0, val * 20.0))
    # if between 5 and 10 treat as 10-point scale
    if val <= 10:
        return max(0.0, min(100.0, val * 10.0))
    # if between 10 and 100 assume percent
    if val <= 100:
        return max(0.0, min(100.0, val))
    return None


PET_KEYWORDS = [
    "pet", "宠物", "宠物友好", "允许携带宠物", "携带宠物", "pet-friendly", "pet friendly", "pets allowed", "dog allowed", "可带宠物", "可携带宠物"
]
NEGATIVE_PET_KEYWORDS = ["no pets", "禁止携带宠物", "不允许携带宠物", "禁止宠物", "no pet"]


def _detect_pet_friendly(poi: dict, detail: Optional[dict] = None) -> Tuple[Optional[bool], list]:
    """Detect pet-friendly hints from POI fields and details. Returns (bool or None, reasons list)."""
    texts = []
    for k in ("name", "type", "biz_type", "business_area", "address", "description", "tag"):
        if poi.get(k):
            texts.append(str(poi.get(k)))
    if detail and isinstance(detail, dict):
        for k in ("summary", "introduction", "description", "notes"):
            if detail.get(k):
                texts.append(str(detail.get(k)))
        # some APIs may provide 'flags' or 'attributes'
        if detail.get("attributes"):
            texts.append(str(detail.get("attributes")))
    joined = " ".join(texts).lower()
    reasons = []
    found_positive = False
    for kw in PET_KEYWORDS:
        if kw.lower() in joined:
            reasons.append(f"matched keyword: {kw}")
            found_positive = True
    for nkw in NEGATIVE_PET_KEYWORDS:
        if nkw.lower() in joined:
            reasons.append(f"negative keyword: {nkw}")
            # negative override
            return False, reasons
    if found_positive:
        return True, reasons
    return None, []


def _normalize_price(raw_price) -> Optional[int]:
    """Return price level 1..5 from numeric avg price if available."""
    val = _parse_numeric(raw_price)
    if val is None:
        return None
    # heuristic brackets
    if val < 50:
        return 1
    if val < 150:
        return 2
    if val < 400:
        return 3
    if val < 800:
        return 4
    return 5


def enrich_poi_candidates(poi_results: dict, poi_details: dict = None) -> dict:
    """Return enriched POI candidates with pet-friendly tags and normalized ratings/prices.

    poi_results: dict[label] -> list of poi dicts (each may include 'raw')
    poi_details: dict[label] -> list of detail envelopes (as returned by fetch_gaode_poi_detail)
    """
    enriched = {}
    poi_details = poi_details or {}
    # Build a quick lookup from id -> detail dict
    detail_map = {}
    for label, details in poi_details.items():
        for d in details:
            # d may be envelope {ok: True, data: {poi: {...}}}
            if isinstance(d, dict) and d.get("ok"):
                data = d.get("data") or {}
                poi = data.get("poi") or {}
            elif isinstance(d, dict):
                poi = d
            else:
                poi = {}
            pid = str(poi.get("id") or poi.get("poi_id") or poi.get("id_str") or "").strip()
            if pid:
                detail_map[pid] = poi
    for label, items in (poi_results or {}).items():
        enriched[label] = []
        for it in items:
            raw = it.get("raw") if isinstance(it.get("raw"), dict) else it
            pid = str(it.get("id") or raw.get("id") or raw.get("poi_id") or "").strip()
            detail = detail_map.get(pid) or {}
            normalized_rating = _normalize_rating(raw.get("rating") or raw.get("score") or detail.get("rating") or detail.get("score") or raw.get("avg_rating"))
            price_level = _normalize_price(raw.get("avg_price") or raw.get("price") or detail.get("avg_price") or detail.get("price"))
            pet_friendly, pet_reasons = _detect_pet_friendly(it, detail)
            enriched_item = {
                **it,
                "normalized_rating": normalized_rating,
                "price_level": price_level,
                "pet_friendly": pet_friendly,
                "pet_reasons": pet_reasons,
                "opening_hours": detail.get("opening_hours") or detail.get("business_hours") or raw.get("opening_hours"),
                "ticket_price": detail.get("ticket_price") or detail.get("price") or raw.get("ticket_price"),
                "tel": detail.get("tel") or detail.get("phone") or raw.get("tel") or raw.get("contact") or it.get("contact"),
                "service_tags": detail.get("service_tags") or detail.get("tag") or raw.get("tag") or [],
            }
            enriched[label].append(enriched_item)

    return enriched


# --- Trip Plan Persistence (for pre-trip plan recall) ---
def _cosmos_write_with_retry(fn, retries=3, delay=2):
    import time
    for attempt in range(retries):
        try:
            fn()
            return
        except Exception as exc:
            if attempt < retries - 1:
                time.sleep(delay)
            else:
                raise


def save_trip_plan(user_name: str, city: str, date: str, days: int, recommendations: dict, retrieval_data: dict = None):
    """Save the trip plan while keeping a capped history per user+city+date.

    Behaviour implemented:
      - Create a version document for each save (type='trip_plan_version').
      - Upsert a canonical document (type='trip_plan_cache') keyed by user+city_key+date
        which stores the latest plan for quick lookup.
      - Keep at most HISTORY_LIMIT latest version documents per user+city+date; older
        versions beyond that are deleted to save storage.
    """
    HISTORY_LIMIT = int(os.getenv("TRIP_PLAN_HISTORY_LIMIT", "5"))
    MAX_DOC_BYTES = int(os.getenv("TRIP_PLAN_MAX_DOC_BYTES", "1700000"))
    try:
        # normalize keys
        city_key = city.strip().lower() if isinstance(city, str) else city
        # normalize date to YYYY-MM-DD if possible
        try:
            parsed_date = datetime.fromisoformat(str(date))
            date_norm = parsed_date.strftime("%Y-%m-%d")
        except Exception:
            # fallback: keep as provided
            date_norm = str(date)

        version_id = f"trip_plan_version_{user_name}_{city_key}_{date_norm}_{uuid.uuid4().hex[:8]}"
        timestamp = datetime.now(UTC).isoformat()

        def _sanitize_for_cosmos(value):
            if value is None or isinstance(value, (str, int, bool)):
                return value
            if isinstance(value, float):
                if value != value or value == float("inf") or value == float("-inf"):
                    return None
                return value
            if isinstance(value, datetime):
                return value.isoformat()
            if isinstance(value, dict):
                return {str(k): _sanitize_for_cosmos(v) for k, v in value.items()}
            if isinstance(value, (list, tuple, set)):
                return [_sanitize_for_cosmos(v) for v in value]
            return str(value)

        def _compact_itinerary(plan: dict) -> dict:
            if not isinstance(plan, dict):
                return {"summary": str(plan)}
            compact = {
                "option": plan.get("option"),
                "attractions_count": plan.get("attractions_count"),
                "total_hours": plan.get("total_hours"),
                "total_cost_cny": plan.get("total_cost_cny"),
                "budget_range": plan.get("budget_range"),
                "cost_breakdown": plan.get("cost_breakdown") or {},
            }
            day_plans = plan.get("day_plans")
            if isinstance(day_plans, list):
                compact_days = []
                for d in day_plans[:3]:
                    if not isinstance(d, dict):
                        continue
                    stops = d.get("stops") if isinstance(d.get("stops"), list) else []
                    compact_stops = []
                    for s in stops[:3]:
                        if isinstance(s, dict):
                            compact_stops.append({
                                "name": s.get("name"),
                                "type": s.get("type"),
                                "transport": s.get("transport") or s.get("transport_mode"),
                            })
                    compact_days.append({
                        "day": d.get("day") or d.get("date"),
                        "theme": d.get("theme"),
                        "stops": compact_stops,
                    })
                compact["day_plans"] = compact_days
            return compact

        def _slim(item: dict, keys) -> dict:
            return {k: item.get(k) for k in keys if item.get(k) is not None}

        def _build_minimal_recs(itineraries_summary: list, itinerary_limit: int = None) -> dict:
            src = recommendations or {}
            scored = src.get("scored_candidates") or {}
            pois = (retrieval_data or {}).get("pois") or {}
            hotels_raw = src.get("hotels") or pois.get("Hotels") or [c.get("metadata", c) for c in scored.get("Hotels", []) if not c.get("filtered")]
            restaurants_raw = src.get("restaurants") or src.get("restaurant_suggestions") or pois.get("Restaurants") or [c.get("metadata", c) for c in scored.get("Restaurants", []) if not c.get("filtered")]
            attractions_raw = src.get("attractions") or [c.get("metadata", c) for c in scored.get("Attractions", []) if not c.get("filtered")]
            hospitals_raw = src.get("hospitals") or [(h if isinstance(h, dict) else {}) for h in ((src.get("hospital_recommendations") or {}).get("candidates") or [])]
            flights = src.get("flights") or src.get("flight_suggestions") or []

            # Merge with existing cached plan: keep previous categories when current result is empty
            try:
                existing = container.read_item(item=canonical_id, partition_key=canonical_id)
                prev = (existing.get("recommendations") or {})
                if not hotels_raw:
                    hotels_raw = prev.get("hotels") or []
                if not restaurants_raw:
                    restaurants_raw = prev.get("restaurants") or []
                if not attractions_raw:
                    attractions_raw = prev.get("attractions") or []
                if not hospitals_raw:
                    hospitals_raw = prev.get("hospitals") or []
                if not flights:
                    flights = prev.get("flights") or []
            except Exception:
                pass
            itineraries = itineraries_summary or []
            if itinerary_limit is not None and isinstance(itineraries, list):
                itineraries = itineraries[:itinerary_limit]

            _hotel_keys = ("id", "name", "address", "location", "tel", "rating", "price_level", "pet_friendly")
            _place_keys = ("id", "name", "address", "location", "rating", "pet_friendly", "score")
            _hosp_keys = ("id", "name", "address", "location", "tel", "eta_minutes", "capability_score")

            recs = {
                "hotels": [_slim(h, _hotel_keys) for h in (hotels_raw[:2] if isinstance(hotels_raw, list) else []) if isinstance(h, dict)],
                "restaurants": [_slim(r, _place_keys) for r in (restaurants_raw[:5] if isinstance(restaurants_raw, list) else []) if isinstance(r, dict)],
                "attractions": [_slim(a, _place_keys) for a in (attractions_raw[:5] if isinstance(attractions_raw, list) else []) if isinstance(a, dict)],
                "hospitals": [_slim(h, _hosp_keys) for h in (hospitals_raw[:3] if isinstance(hospitals_raw, list) else []) if isinstance(h, dict)],
                "budget_total": (src.get("budget_estimate") or src.get("budget_summary") or {}).get("total_estimate"),
                "itineraries": itineraries if isinstance(itineraries, list) else [],
                "flights": flights[:2] if isinstance(flights, list) else [],
            }
            return _sanitize_for_cosmos(recs)

        def _doc_size_bytes(doc: dict) -> int:
            try:
                return len(json.dumps(doc, ensure_ascii=False, separators=(",", ":"), default=str).encode("utf-8"))
            except Exception:
                return 10**9

        canonical_id = f"trip_plan_{user_name}_{city_key}_{date_norm}"

        itineraries_src = recommendations.get("itineraries") if isinstance(recommendations, dict) else []
        itineraries_src = itineraries_src if isinstance(itineraries_src, list) else []

        # Merge day_plans with previous itinerary: replace only changed days, keep the rest
        try:
            existing_cache = container.read_item(item=canonical_id, partition_key=canonical_id)
            prev_itins = (existing_cache.get("recommendations") or {}).get("itineraries") or []
            # hydrate detail docs if needed
            for pi in prev_itins:
                if isinstance(pi, dict) and pi.get("detail_id") and not pi.get("day_plans"):
                    try:
                        detail = container.read_item(item=pi["detail_id"], partition_key=pi["detail_id"])
                        pi.update(detail.get("itinerary") or {})
                    except Exception:
                        pass
            if prev_itins and itineraries_src:
                prev_plan = prev_itins[0] if isinstance(prev_itins[0], dict) else {}
                prev_days = {d["day"]: d for d in (prev_plan.get("day_plans") or []) if isinstance(d, dict) and d.get("day")}
                new_plan = itineraries_src[0] if isinstance(itineraries_src[0], dict) else {}
                new_days = {d["day"]: d for d in (new_plan.get("day_plans") or []) if isinstance(d, dict) and d.get("day")}
                if new_days and prev_days:
                    merged_days = {**prev_days, **new_days}  # new days overwrite previous
                    new_plan["day_plans"] = [merged_days[k] for k in sorted(merged_days)]
                    itineraries_src[0] = new_plan
        except Exception:
            pass

        itinerary_summaries = []

        for idx, itinerary in enumerate(itineraries_src):
            detail_id = f"trip_plan_itinerary_{user_name}_{city_key}_{date_norm}_{uuid.uuid4().hex[:10]}_{idx}"
            itinerary_payload = _sanitize_for_cosmos(itinerary)
            detail_doc = {
                "id": detail_id,
                "type": "trip_plan_itinerary_detail",
                "user_id": user_name,
                "city": city,
                "city_key": city_key,
                "date": date_norm,
                "parent_version_id": version_id,
                "parent_cache_id": canonical_id,
                "itinerary_index": idx,
                "itinerary": itinerary_payload,
                "timestamp": timestamp,
            }

            # If one detail doc is still too big, compact just that itinerary.
            if _doc_size_bytes(detail_doc) > MAX_DOC_BYTES:
                detail_doc["itinerary"] = _sanitize_for_cosmos(_compact_itinerary(itinerary if isinstance(itinerary, dict) else {}))
            if _doc_size_bytes(detail_doc) > MAX_DOC_BYTES and isinstance(detail_doc.get("itinerary"), dict):
                detail_doc["itinerary"].pop("day_plans", None)

            detail_saved = False
            if _doc_size_bytes(detail_doc) <= MAX_DOC_BYTES:
                try:
                    _cosmos_write_with_retry(lambda d=detail_doc: container.upsert_item(d))
                    detail_saved = True
                except Exception:
                    detail_saved = False

            if isinstance(itinerary, dict):
                summary = {
                    "option": itinerary.get("option"),
                    "attractions_count": itinerary.get("attractions_count"),
                    "total_hours": itinerary.get("total_hours"),
                    "total_cost_cny": itinerary.get("total_cost_cny"),
                    "budget_range": itinerary.get("budget_range"),
                }
            else:
                summary = {"option": f"Option {idx + 1}"}

            if detail_saved:
                summary["detail_id"] = detail_id
            itinerary_summaries.append(_sanitize_for_cosmos(summary))

        slim_recs = _build_minimal_recs(itinerary_summaries)

        version_doc = {
            "id": version_id,
            "type": "trip_plan_version",
            "user_id": user_name,
            "city": city,
            "city_key": city_key,
            "date": date_norm,
            "days": days,
            "recommendations": slim_recs,
            "timestamp": timestamp,
        }

        # upsert canonical doc for fast lookup — slim recommendations only
        canonical_doc = {
            "id": canonical_id,
            "type": "trip_plan_cache",
            "user_id": user_name,
            "city": city,
            "city_key": city_key,
            "date": date_norm,
            "days": days,
            "recommendations": slim_recs,
            "latest_version_id": version_id,
            "timestamp": timestamp,
        }

        # Keep Cosmos item size under limit with progressive itinerary truncation.
        if _doc_size_bytes(version_doc) > MAX_DOC_BYTES or _doc_size_bytes(canonical_doc) > MAX_DOC_BYTES:
            slim_recs = _build_minimal_recs(itinerary_summaries, itinerary_limit=2)
            version_doc["recommendations"] = slim_recs
            canonical_doc["recommendations"] = slim_recs

        if _doc_size_bytes(version_doc) > MAX_DOC_BYTES or _doc_size_bytes(canonical_doc) > MAX_DOC_BYTES:
            slim_recs = _build_minimal_recs(itinerary_summaries, itinerary_limit=1)
            version_doc["recommendations"] = slim_recs
            canonical_doc["recommendations"] = slim_recs

        if _doc_size_bytes(version_doc) > MAX_DOC_BYTES or _doc_size_bytes(canonical_doc) > MAX_DOC_BYTES:
            # Last resort: keep key but store empty itineraries summary.
            slim_recs["itineraries"] = []
            version_doc["recommendations"] = slim_recs
            canonical_doc["recommendations"] = slim_recs

        # create a versioned history document
        def _write_version():
            try:
                container.create_item(version_doc)
            except Exception:
                container.upsert_item(version_doc)
        _cosmos_write_with_retry(_write_version)
        _cosmos_write_with_retry(lambda: container.upsert_item(canonical_doc))

        # Trim history: keep only most recent HISTORY_LIMIT versions
        query = """SELECT c.id FROM c
            WHERE c.type='trip_plan_version' AND c.user_id=@user_name AND c.city_key=@city_key AND c.date=@date
            ORDER BY c.timestamp DESC"""
        params = [
            {"name": "@user_name", "value": user_name},
            {"name": "@city_key", "value": city_key},
            {"name": "@date", "value": date_norm},
        ]
        items = list(container.query_items(query=query, parameters=params, enable_cross_partition_query=True))
        # items are ordered newest-first; delete older beyond limit
        if len(items) > HISTORY_LIMIT:
            to_delete = items[HISTORY_LIMIT:]
            for it in to_delete:
                try:
                    old_id = it.get("id")
                    container.delete_item(item=old_id, partition_key=old_id)
                    # cleanup child itinerary detail docs for the deleted version
                    d_query = """SELECT c.id FROM c
                        WHERE c.type='trip_plan_itinerary_detail' AND c.parent_version_id=@version_id"""
                    d_params = [{"name": "@version_id", "value": old_id}]
                    details = list(container.query_items(query=d_query, parameters=d_params, enable_cross_partition_query=True))
                    for d in details:
                        did = d.get("id")
                        if did:
                            try:
                                container.delete_item(item=did, partition_key=did)
                            except Exception:
                                pass
                    if os.getenv("MEMORY_DEBUG") == "1":
                        print(f"[MEMORY DEBUG] Deleted old version {old_id} for {user_name}:{city_key}:{date_norm}")
                except Exception:
                    # best-effort delete; ignore failures
                    pass

        if os.getenv("MEMORY_DEBUG") == "1":
            print(f"[MEMORY DEBUG] Saved trip plan version {version_id} and upserted canonical {canonical_id}")
        return True
    except Exception as exc:
        print(f"[WARN] save_trip_plan exception: {exc}", flush=True)
        return False


def load_trip_plan(user_name: str, city: str = None, date: str = None):
    """Load cached trip plan(s) for a user.

    If city and date provided, return the canonical plan for that key (most recent).
    Otherwise, return the most recent canonical plan for the user.

    Returns dict with plan data or None if not found.
    """
    def _hydrate_itinerary_details(plan_doc: dict) -> dict:
        if not isinstance(plan_doc, dict):
            return plan_doc
        recs = plan_doc.get("recommendations")
        if not isinstance(recs, dict):
            return plan_doc
        itineraries = recs.get("itineraries")
        if not isinstance(itineraries, list) or not itineraries:
            return plan_doc

        hydrated = []
        for idx, item in enumerate(itineraries):
            if isinstance(item, dict):
                detail_id = item.get("detail_id")
                if detail_id:
                    try:
                        detail = container.read_item(item=detail_id, partition_key=detail_id)
                        full_itinerary = detail.get("itinerary")
                        if isinstance(full_itinerary, dict):
                            merged = dict(full_itinerary)
                            merged["detail_id"] = detail_id
                            hydrated.append(merged)
                            continue
                    except Exception:
                        pass
                hydrated.append(item)
            else:
                hydrated.append(item)

        recs["itineraries"] = hydrated
        plan_doc["recommendations"] = recs
        return plan_doc

    try:
        if city and date:
            city_key = city.strip().lower() if isinstance(city, str) else city
            try:
                parsed_date = datetime.fromisoformat(str(date))
                date_norm = parsed_date.strftime("%Y-%m-%d")
            except Exception:
                date_norm = str(date)
            canonical_id = f"trip_plan_{user_name}_{city_key}_{date_norm}"
            try:
                response = container.read_item(item=canonical_id, partition_key=canonical_id)
                if os.getenv("MEMORY_DEBUG") == "1":
                    print(f"[MEMORY DEBUG] Loaded trip plan for {user_name}: {city} on {date} (canonical)")
                return _hydrate_itinerary_details(response)
            except Exception:
                # fallback: query versioned docs
                query = """SELECT * FROM c
                    WHERE c.type='trip_plan_version' AND c.user_id=@user_name AND c.city_key=@city_key AND c.date=@date
                    ORDER BY c.timestamp DESC"""
                params = [
                    {"name": "@user_name", "value": user_name},
                    {"name": "@city_key", "value": city_key},
                    {"name": "@date", "value": date_norm},
                ]
                items = list(container.query_items(query=query, parameters=params, enable_cross_partition_query=True))
                if items:
                    if os.getenv("MEMORY_DEBUG") == "1":
                        print(f"[MEMORY DEBUG] Loaded trip plan for {user_name}: {city} on {date} (from versions)")
                    return _hydrate_itinerary_details(items[0])
                return None
        else:
            # Load most recent canonical plan for user
            query = """SELECT * FROM c 
                WHERE c.type='trip_plan_cache' AND c.user_id=@user_name 
                ORDER BY c.timestamp DESC"""
            params = [{"name": "@user_name", "value": user_name}]
            items = list(container.query_items(query=query, parameters=params, enable_cross_partition_query=True))
            if items:
                if os.getenv("MEMORY_DEBUG") == "1":
                    print(f"[MEMORY DEBUG] Loaded most recent trip plan for {user_name}")
                return _hydrate_itinerary_details(items[0])
            return None
    except Exception as exc:
        if os.getenv("MEMORY_DEBUG") == "1":
            print(f"[MEMORY DEBUG] Failed to load trip plan: {exc}")
        return None


def format_cached_plan_response(plan: dict, lang: str = "en") -> str:
    """Format a cached trip plan into a user-friendly response.

    Args:
        plan: The trip plan dict from load_trip_plan()
        lang: Language code (en or zh)

    Returns: Formatted string response
    """
    if not plan:
        return "No previous trip plan found." if lang == "en" else "未找到之前的旅行计划。"

    recommendations = plan.get("recommendations") or {}
    retrieval_data = plan.get("retrieval_data") or {}

    lines = []

    # Header
    city = plan.get("city", "")
    date = plan.get("date", "")
    days = plan.get("days", "")
    header = f"Previous Trip Plan: {city} ({date}, {days} days)" if lang == "en" else f"之前的旅行计划：{city}（{date}，{days}天）"
    lines.append(header)
    lines.append("=" * 60)

    # Itineraries
    itineraries = recommendations.get("itineraries") or []
    if itineraries:
        header_iter = "Recommended Itineraries:" if lang == "en" else "推荐行程："
        lines.append(header_iter)
        for idx, plan_opt in enumerate(itineraries[:3], 1):
            option = plan_opt.get("option", f"Option {idx}")
            attractions = plan_opt.get("attractions_count", 0)
            hours = plan_opt.get("total_hours", "?")
            cost = plan_opt.get("total_cost_cny", "?")
            line = f"  {idx}. {option}: {attractions} attractions, {hours}h, ¥{cost}" if lang == "en" else f"  {idx}. {option}：{attractions}个景点，{hours}小时，¥{cost}"
            lines.append(line)

    # Hotels
    hotels = recommendations.get("hotels") or []
    if hotels:
        header_hotel = "Recommended Hotels:" if lang == "en" else "推荐酒店："
        lines.append(header_hotel)
        for h in hotels[:3]:
            name = h.get("name", "Unknown")
            score = h.get("score", "?")
            line = f"  • {name} (score: {score})" if lang == "en" else f"  • {name}（评分：{score}）"
            lines.append(line)

    # Top Attractions
    attractions = recommendations.get("attractions") or []
    if attractions:
        header_attr = "Top Attractions:" if lang == "en" else "热门景点："
        lines.append(header_attr)
        for a in attractions[:5]:
            name = a.get("name", "Unknown")
            score = a.get("score", "?")
            line = f"  • {name} (score: {score})" if lang == "en" else f"  • {name}（评分：{score}）"
            lines.append(line)

    # Hospitals (if emergency-relevant)
    hospitals = recommendations.get("hospital_recommendations")
    if hospitals:
        header_hosp = "Emergency Hospitals:" if lang == "en" else "紧急医疗："
        lines.append(header_hosp)
        candidates = hospitals.get("candidates") or []
        for h in candidates[:2]:
            name = h.get("name", "Unknown")
            eta = h.get("eta_minutes", "?")
            line = f"  • {name} (ETA: {eta}min)" if lang == "en" else f"  • {name}（ETA：{eta}分钟）"
            lines.append(line)

    # Budget
    budget = recommendations.get("budget_summary") or recommendations.get("budget_estimate")
    if budget:
        if isinstance(budget, dict):
            total = budget.get("total_estimate", "?")
            header_budget = "Budget Estimate:" if lang == "en" else "预算估计："
            line = f"{header_budget} ¥{total}" if lang == "en" else f"{header_budget}¥{total}"
        else:
            header_budget = "Budget Estimate:" if lang == "en" else "预算估计："
            line = f"{header_budget} ¥{budget}" if lang == "en" else f"{header_budget}¥{budget}"
        lines.append(line)

    return "\n".join(lines)

def _fetch_serpapi(params: dict, service: str):
    if not SERPAPI_API_KEY:
        return _err(service, "Missing SERPAPI_API_KEY", code="AUTH_FAILED", retryable=False)

    full_params = {
        **params,
        "api_key": SERPAPI_API_KEY,
    }

    return _request_json(SERPAPI_BASE_URL, full_params, service)

def fetch_google_hotels_search(
    q: str,
    check_in_date: str,
    check_out_date: str,
    *,
    adults: int = 2,
    children: int = 0,
    currency: str = "USD",
    sort_by: str = "8",
    page_token: str = None,
    page_size: int = 20,
) -> Dict[str, Any]:
    service = "tool.google.hotels.search"

    params = {
        "engine": "google_hotels",
        "q": q,
        "check_in_date": check_in_date,
        "check_out_date": check_out_date,
        "adults": adults,
        "children": children,
        "currency": currency,
        "sort_by": sort_by,
        "page_size": page_size,
    }

    if page_token:
        params["page_token"] = page_token

    raw = _fetch_serpapi(params, service)
    if not raw["ok"]:
        return raw

    data = raw["data"] or {}

    if "properties" not in data:
        return _err(
            service,
            "SerpAPI returned no hotel properties",
            code="UPSTREAM_EMPTY",
            upstream=raw.get("upstream"),
        )

    return _ok(data, service, upstream=raw.get("upstream"))

def fetch_google_maps_restaurants(
    q: str,
    *,
    hl: str = "zh-CN",
    gl: str = "cn",
    start: int = 0,
):
    service = "tool.serpapi.google_maps_restaurants"

    params = {
        "engine": "google_maps",
        "q": q,
        "hl": hl,
        "gl": gl,
        "start": start,
    }


    raw = _fetch_serpapi(params, service)
    if not raw["ok"]:
        return raw

    return _ok(raw["data"], service, upstream=raw.get("upstream"))

def fetch_google_maps_attractions(
    q: str,
    *,
    hl: str = "zh-CN",
    gl: str = "cn",
    start: int = 0,
):
    service = "tool.serpapi.google_maps_attractions"

    params = {
        "engine": "google_maps",
        "q": q,
        "hl": hl,
        "gl": gl,
        "start": start,
    }


    raw = _fetch_serpapi(params, service)
    if not raw["ok"]:
        return raw

    return _ok(raw["data"], service, upstream=raw.get("upstream"))

def fetch_google_flights(
    departure_id: str,
    arrival_id: str,
    outbound_date: str,
    *,
    return_date: str = None,
    adults: int = 1,
    children: int = 0,
    infants: int = 0,
    currency: str = "CNY",
    stops_filter: str = None,
    airline: str = None,
    price_max: int = None,
    sort_by: str = None,
):
    service = "tool.serpapi.google_flights"

    params = {
        "engine": "google_flights",
        "departure_id": departure_id,
        "arrival_id": arrival_id,
        "outbound_date": outbound_date,
        "adults": adults,
        "children": children,
        "infants": infants,
        "currency": currency,
    }

    if return_date:
        params["return_date"] = return_date
    if stops_filter:
        params["stops_filter"] = stops_filter
    if airline:
        params["airline"] = airline
    if price_max:
        params["price_max"] = price_max
    if sort_by:
        params["sort_by"] = sort_by

    raw = _fetch_serpapi(params, service)
    if not raw["ok"]:
        return raw

    return _ok(raw["data"], service, upstream=raw.get("upstream"))