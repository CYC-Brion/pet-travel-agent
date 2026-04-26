import time
import json
import re
from concurrent.futures import ThreadPoolExecutor
from helper import (
    fetch_gaode_geocode,
    fetch_gaode_poi_keyword,
    fetch_gaode_poi_around,
    fetch_gaode_poi_detail,
    fetch_gaode_route_driving,
    fetch_gaode_route_walking,
    fetch_gaode_route_bicycling,
    fetch_gaode_route_transit,
    fetch_gaode_route_matrix,
    fetch_gaode_distance,
    query_cosmos_hospitals,
    query_cosmos_hotels,
)


def _safe_data(envelope):
    if isinstance(envelope, dict) and envelope.get("ok"):
        return envelope.get("data")
    return None


def _safe_pois(envelope):
    data = _safe_data(envelope) or {}
    return data.get("pois") or []


def gaode_subagent(city, canonical_hint=None, pet_type=None):
    """Geocoding, POI keyword/around searches, POI details, enrichment, pricing and basic routes."""
    start = time.time()

    geocode = fetch_gaode_geocode(city)
    geocode_items = (_safe_data(geocode) or {}).get("items") or []
    canonical_location = {
        "raw_geocode": geocode,
        "location": None,
        "lat": None,
        "lon": None,
        "city": city,
        "confidence": 0.0,
    }
    if geocode_items:
        city_lower = (city or "").lower()
        def _match_score(item):
            addr = str(item.get("formatted_address") or item.get("name") or item.get("city") or "").lower()
            return sum(1 for word in city_lower.split() if word in addr)
        try:
            best = max(geocode_items, key=_match_score)
            loc_str = str(best.get("location") or "")
            canonical_location["location"] = loc_str
            parts = [p.strip() for p in loc_str.split(",") if p.strip()]
            if len(parts) >= 2:
                lon = float(parts[0]); lat = float(parts[1])
                canonical_location.update({"lat": lat, "lon": lon, "confidence": 0.9 if _match_score(best) > 0 else 0.6})
        except Exception:
            pass

    categories = {
        "餐厅|饭店|restaurant": "Restaurants",
        "景点|旅游景区|attraction": "Attractions",
        "transport": "Transport",
    }

    tasks = {}
    with ThreadPoolExecutor(max_workers=6) as ex:
        poi_futures = {label: ex.submit(fetch_gaode_poi_keyword, keyword, city=city) for keyword, label in categories.items()}
        tasks.update({f"poi_{k}": v for k, v in poi_futures.items()})

        around_queries = {
            "around_hospitals": {"keywords": "宠物医院|动物医院|pet hospital", "radius": 5000},
            "around_hotels": {"keywords": "酒店|宾馆|hotel", "radius": 3000},
            "around_parks": {"keywords": "公园|park", "radius": 8000},
            "around_pet_supplies": {"keywords": "宠物店|宠物用品|pet store", "radius": 5000},
            "around_food": {"keywords": "宠物友好餐厅|可带宠物餐厅|餐厅|咖啡馆|restaurant|cafe", "radius": 4000},
            "around_transit": {"keywords": "地铁站|公交站|subway|bus station", "radius": 4000},
            "around_toilets": {"keywords": "公共厕所|卫生间|toilet", "radius": 3000},
            "around_malls": {"keywords": "商场|购物中心|mall", "radius": 6000},
        }
        if canonical_location.get('location'):
            for around_key, cfg in around_queries.items():
                tasks[around_key] = ex.submit(fetch_gaode_poi_around, canonical_location.get('location'), keywords=cfg["keywords"], radius=cfg["radius"])
        else:
            for around_key in around_queries:
                tasks[around_key] = None

    poi_envelopes = {}
    for k in categories.values():
        fut = tasks.get(f"poi_{k}")
        try:
            env = fut.result() if fut else {"ok": False, "data": None}
        except Exception:
            env = {"ok": False, "data": None}
        poi_envelopes[k] = env

    around_poi_envelopes = {}
    for around_key in ("around_hospitals","around_hotels","around_parks","around_pet_supplies","around_food","around_transit","around_toilets","around_malls"):
        fut = tasks.get(around_key)
        try:
            around_poi_envelopes[around_key] = fut.result() if fut else {"ok": False, "data": None}
        except Exception:
            around_poi_envelopes[around_key] = {"ok": False, "data": None}

    around_hospitals = around_poi_envelopes.get("around_hospitals")
    around_hotels = around_poi_envelopes.get("around_hotels")
    alt_attractions = around_poi_envelopes.get("around_parks")

    poi_results = {label: _safe_pois(env)[:10] for label, env in poi_envelopes.items()}
    poi_fallbacks = set()

    if not poi_results.get("Restaurants"):
        try:
            poi_results["Restaurants"] = _safe_pois(fetch_gaode_poi_keyword("餐厅|饭店", city=city))[:5]
            poi_fallbacks.add("Restaurants")
        except Exception:
            pass

    if not poi_results.get("Attractions"):
        try:
            poi_results["Attractions"] = _safe_pois(fetch_gaode_poi_keyword("景点|旅游", city=city))[:5]
            poi_fallbacks.add("Attractions")
        except Exception:
            pass

    cosmos_hotels = query_cosmos_hotels(city)
    cosmos_hospitals = query_cosmos_hospitals(city)

    # Filter hospitals by pet_type category: "cat", "dog", or "cat and dog"
    if pet_type:
        pt = pet_type.strip().lower()
        def _category_match(h):
            cat = str(h.get("categories") or h.get("category") or h.get("Category") or "").strip().lower()
            if not cat:
                return True  # no category info → keep
            if pt == "cat":
                return cat in ("cat", "cat and dog")
            if pt == "dog":
                return cat in ("dog", "cat and dog")
            return True
        cosmos_hospitals = [h for h in cosmos_hospitals if _category_match(h)]

    def _geocode_cosmos_records(records):
        def _enrich(rec):
            rec = dict(rec)
            # Geocode if missing location
            if not rec.get("location"):
                address = rec.get("address") or rec.get("Address") or rec.get("formatted_address") or ""
                if address:
                    try:
                        result = fetch_gaode_geocode(address)
                        items = (_safe_data(result) or {}).get("items") or []
                        if items:
                            loc = str(items[0].get("location") or "")
                            if loc:
                                rec["location"] = loc
                    except Exception:
                        pass
            # Enrich phone via Gaode POI search if missing
            if not (rec.get("tel") or rec.get("phone") or rec.get("Phone")):
                name = rec.get("name") or rec.get("Name") or ""
                if name:
                    try:
                        res = fetch_gaode_poi_keyword(name, city=city)
                        pois = (_safe_data(res) or {}).get("pois") or []
                        if pois:
                            poi_id = str(pois[0].get("id") or "").strip()
                            if poi_id:
                                detail_env = fetch_gaode_poi_detail(poi_id)
                                detail = (_safe_data(detail_env) or {})
                                tel = detail.get("tel") or detail.get("phone") or pois[0].get("tel") or ""
                                if tel:
                                    rec["tel"] = tel
                                if not rec.get("id"):
                                    rec["id"] = poi_id
                    except Exception:
                        pass
            return rec
        with ThreadPoolExecutor(max_workers=5) as ex:
            return list(ex.map(_enrich, records))

    poi_results["Hotels"] = _geocode_cosmos_records(cosmos_hotels)
    poi_results["Hospitals"] = _geocode_cosmos_records(cosmos_hospitals)

    for k in poi_fallbacks:
        poi_results[f"{k}_fallback"] = True

    poi_results["PetHospitalsNearby"] = _safe_pois(around_hospitals)[:10]

    # Merge Cosmos contact info into PetHospitalsNearby by name match
    cosmos_contact_map = {
        str(h.get("name") or "").strip(): h.get("contact") or h.get("tel") or ""
        for h in cosmos_hospitals
    }
    # Also build address-keyed map for fallback
    cosmos_addr_map = {
        str(h.get("address") or "").strip(): h.get("contact") or h.get("tel") or ""
        for h in cosmos_hospitals
    }
    for h in poi_results["PetHospitalsNearby"]:
        if h.get("tel"):
            continue
        name = str(h.get("name") or "").strip()
        addr = str(h.get("address") or "").strip()
        contact = cosmos_contact_map.get(name) or cosmos_addr_map.get(addr) or ""
        if not contact:
            for cname, ctel in cosmos_contact_map.items():
                if not cname or not ctel:
                    continue
                # substring or significant character overlap
                if cname in name or name in cname or (len(name) > 4 and name[:4] in cname):
                    contact = ctel
                    break
        if contact:
            h["tel"] = contact

    # Fetch Gaode detail for PetHospitalsNearby still missing tel
    def _fetch_tel(h):
        if h.get("tel"):
            return h
        poi_id = str(h.get("id") or "").strip()
        if not poi_id:
            return h
        try:
            detail_env = fetch_gaode_poi_detail(poi_id)
            detail = (_safe_data(detail_env) or {}).get("poi") or _safe_data(detail_env) or {}
            tel = detail.get("tel") or detail.get("phone") or ""
            if tel:
                h = dict(h)
                h["tel"] = tel
        except Exception:
            pass
        return h

    with ThreadPoolExecutor(max_workers=5) as ex:
        poi_results["PetHospitalsNearby"] = list(ex.map(_fetch_tel, poi_results["PetHospitalsNearby"]))
    poi_results["NearbyHotelsAlternative"] = _safe_pois(around_hotels)[:10]
    poi_results["AlternativeAttractions"] = _safe_pois(alt_attractions)[:10]

    poi_details = {}
    with ThreadPoolExecutor(max_workers=6) as ex:
        future_map = {}
        for label, items in poi_results.items():
            if not isinstance(items, list):
                continue
            future_map[label] = []
            for poi in items[:3]:
                poi_id = str(poi.get("id") or "").strip()
                if not poi_id:
                    continue
                future_map[label].append(ex.submit(fetch_gaode_poi_detail, poi_id))
        for label, futures in future_map.items():
            details = []
            for f in futures:
                try:
                    details.append(f.result())
                except Exception:
                    details.append({"ok": False, "data": None})
            poi_details[label] = details

    try:
        from helper import enrich_poi_candidates
        enriched = enrich_poi_candidates(poi_results, poi_details)
    except Exception:
        enriched = {}

    def _fetch_price_hotels(hotels_list, city_name, details_list=None):
        out = []
        details_map = {}
        try:
            for d in (details_list or []):
                try:
                    if isinstance(d, dict) and d.get("ok"):
                        data = d.get("data") or {}
                    else:
                        data = d or {}
                    pid = str(data.get("id") or data.get("poi_id") or "")
                    if pid:
                        details_map[pid] = data
                except Exception:
                    continue
        except Exception:
            details_map = {}

        out = []
        for h in (hotels_list or [])[:20]:
            price = None
            try:
                price = h.get("price") or h.get("avg_price") or (h.get("raw") or {}).get("price")
                if isinstance(price, str):
                    price = float(re.sub(r"[^0-9.]", "", price)) if re.search(r"\d", price) else None
                if price is None:
                    pid = str(h.get("id") or h.get("poi_id") or "")
                    d = details_map.get(pid)
                    if d:
                        candidates = []
                        for key in ("avg_price", "price", "min_price", "minprice", "avgprice"):
                            val = d.get(key) or (d.get("biz_ext") or {}).get(key) or (d.get("ext") or {}).get(key)
                            if val:
                                candidates.append(val)
                        if not candidates:
                            candidates.append(json.dumps(d, ensure_ascii=False))
                        for c in candidates:
                            if isinstance(c, (int, float)):
                                price = float(c); break
                            if isinstance(c, str) and re.search(r"\d", c):
                                s = re.search(r"(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?|\d+)", c.replace("¥", "").replace("￥", ""))
                                if s:
                                    num = s.group(1).replace(",", "")
                                    try:
                                        price = float(num); break
                                    except Exception:
                                        continue
                if price is not None:
                    price = float(price)
            except Exception:
                price = None
            out.append({"id": str(h.get("id") or h.get("poi_id") or ""), "name": h.get("name"), "price": price, "ok": price is not None})
        ok_any = any(item["ok"] for item in out)
        return {"ok": ok_any, "data": out, "error": None if ok_any else "no prices found"}

    hotels_list = poi_results.get("Hotels") or []
    prices = {}
    try:
        from concurrent.futures import ThreadPoolExecutor as _TPE
        with _TPE(max_workers=3) as pex:
            ph = pex.submit(_fetch_price_hotels, hotels_list, city, poi_details.get('Hotels'))
            try:
                prices['hotels'] = ph.result()
            except Exception:
                prices['hotels'] = {"ok": False, "data": None}
    except Exception:
        prices = {"ok": False, "error": "price extraction failed"}

    routes = {}
    distance = None
    route_matrix = None
    origin = str(poi_results.get("Hotels", [])[0].get("location") or "") if poi_results.get("Hotels") else ""
    destination = str(poi_results.get("Attractions", [])[0].get("location") or "") if poi_results.get("Attractions") else ""
    if origin and destination:
        try:
            routes = {
                "driving": fetch_gaode_route_driving(origin, destination),
                "walking": fetch_gaode_route_walking(origin, destination),
                "bicycling": fetch_gaode_route_bicycling(origin, destination),
                "transit": fetch_gaode_route_transit(origin, destination, city=city),
            }
            distance = fetch_gaode_distance([origin], [destination], mode="driving")
            route_matrix = fetch_gaode_route_matrix([origin], [destination], mode="driving")
        except Exception:
            routes = {}

    return {
        "geocode": geocode,
        "canonical_location": canonical_location,
        "poi_envelopes": poi_envelopes,
        "around_poi_envelopes": around_poi_envelopes,
        "poi_results": poi_results,
        "poi_details": poi_details,
        "enriched": enriched,
        "routes": routes,
        "prices": prices,
        "tools_partial": {
            "route_matrix": route_matrix,
            "distance": distance,
        },
        "elapsed": time.time() - start,
    }
