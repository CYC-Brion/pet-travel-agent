import json
from typing import Any, Dict

# Robust import of planner
try:
    import agent3_planning as planner
except Exception:
    import sys, os
    sys.path.insert(0, os.getcwd())
    import agent3_planning as planner


def _deterministic_triage(symptoms_text: str) -> Dict:
    s = (symptoms_text or "").lower()
    if any(k in s for k in ["unconscious", "not breathing", "severe bleeding", "seizure", "collapse"]):
        return {"severity": "Emergency", "strategy": "nearest_first", "reasons": ["critical symptoms"], "recommended_actions": ["Call emergency vet immediately", "Go to nearest hospital"]}
    if any(k in s for k in ["vomit", "diarrhea", "lethargy", "swollen", "limping", "wound"]):
        return {"severity": "High", "strategy": "capability_match_first", "reasons": ["serious symptoms"], "recommended_actions": ["Contact vet", "Monitor closely"]}
    if any(k in s for k in ["scratch", "sneeze", "mild", "slight"]):
        return {"severity": "Medium", "strategy": "capability_match_first", "reasons": ["moderate symptoms"], "recommended_actions": ["Monitor, consult vet if worsens"]}
    return {"severity": "Low", "strategy": "capability_match_first", "reasons": [], "recommended_actions": ["Rest, monitor"]}


def fetch(user_profile: Dict[str, Any], retrieval_data: Dict[str, Any], trip_days: int, lang: str = "en") -> Dict:
    """Fetcher: deterministic fast processing (no LLM). Returns fast_response + refinement_payload."""
    constraints = planner.extract_constraints(user_profile, {"days": trip_days}, retrieval_data, lang=lang, use_llm=False)
    scored = planner.filter_and_score_candidates(retrieval_data, constraints)
    itineraries = planner.optimize_itineraries(scored, trip_days, constraints=constraints)
    budget_est = planner.estimate_budget_for_plan(user_profile, itineraries, retrieval_data.get("tools", {}).get("tool.gaode.route_matrix"), prices=retrieval_data.get("prices"))
    hotels_meta = [c["metadata"] for c in scored.get("Hotels", [])]
    attractions_meta = [c["metadata"] for c in scored.get("Attractions", []) if not c.get("filtered")]
    hotel_zones = planner.hotel_zone_and_bundle(hotels_meta, attractions=attractions_meta)

    symptoms = user_profile.get("symptoms") or user_profile.get("emergency_symptoms")
    hospital_recommendations = None

    flight_suggestions = []
    transport = str(user_profile.get("transport") or user_profile.get("transport_mode") or "").lower()
    if any(k in transport for k in ("flight", "fly", "plane", "飞机")):
        flights_env = (retrieval_data.get("prices") or {}).get("flights_env")
        if isinstance(flights_env, dict) and flights_env.get("ok"):
            _, budget_max = planner._parse_budget_range(user_profile.get("budget"))
            adults = int(user_profile.get("adults") or 1)
            for key in ("best_flights", "other_flights"):
                for f in ((flights_env.get("data") or {}).get(key) or []):
                    p = f.get("price")
                    legs = f.get("flights") or []
                    if legs and isinstance(p, (int, float)) and p > 0:
                        suggestion = {
                            "airline": legs[0].get("airline", ""),
                            "flight_number": legs[0].get("flight_number", ""),
                            "airplane": legs[0].get("airplane", ""),
                            "departure": (legs[0].get("departure_airport") or {}).get("time", ""),
                            "arrival": (legs[-1].get("arrival_airport") or {}).get("time", ""),
                            "duration_min": f.get("total_duration"),
                            "price": p,
                        }
                        suggestion["score"] = planner._score_flight(suggestion, budget_max, adults)
                        flight_suggestions.append(suggestion)
            flight_suggestions.sort(key=lambda x: -x["score"])
    # Score and rank restaurants
    _, budget_max_r = planner._parse_budget_range(user_profile.get("budget"))
    trip_days = int(user_profile.get("days") or 1)
    restaurant_suggestions = []
    for r in (scored.get("Restaurants") or scored.get("restaurants") or []):
        if r.get("filtered"):
            continue
        meta = r["metadata"]
        score = planner._score_restaurant(meta, budget_max_r, trip_days)
        restaurant_suggestions.append({
            "name": meta.get("name", ""),
            "rating": meta.get("rating") or (meta.get("raw") or {}).get("rating"),
            "price_level": meta.get("price") or (meta.get("raw") or {}).get("price"),
            "pet_friendly": meta.get("pet_friendly"),
            "score": score,
        })
    restaurant_suggestions.sort(key=lambda x: -x["score"])

    if symptoms:
        triage = _deterministic_triage(symptoms)
        current_loc = user_profile.get("current_location") or str(retrieval_data.get("canonical_location") or "")
        transport_mode = user_profile.get("transport_mode", "taxi")
        hospital_recommendations = planner.recommend_hospitals(triage, scored, current_loc, transport_mode)

    fast = {
        "constraints": constraints,
        "scored_candidates": scored,
        "itineraries": itineraries,
        "budget_estimate": budget_est,
        "hotel_zones": hotel_zones,
        "hospital_recommendations": hospital_recommendations,
        "flight_suggestions": flight_suggestions,
        "restaurant_suggestions": restaurant_suggestions,
        "notes": ["Fast deterministic response from Fetcher (no LLM)."],
    }
    refinement_payload = {"user_profile": user_profile, "retrieval_data": retrieval_data, "trip_days": trip_days, "lang": lang}
    return {"fast_response": fast, "refinement_payload": refinement_payload}


if __name__ == '__main__':
    import sys
    try:
        payload = json.load(sys.stdin)
    except Exception:
        print(json.dumps({"error": "Provide JSON on stdin with keys user_profile, retrieval_data, trip_days"}))
        sys.exit(1)
    out = fetch(payload.get("user_profile", {}), payload.get("retrieval_data", {}), payload.get("trip_days", 1), lang=payload.get("lang", "en"))
    print(json.dumps(out, ensure_ascii=False, indent=2))
