import json
from typing import Any, Dict

# Robust import of planner
try:
    import agent3_planning as planner
except Exception:
    import sys, os
    sys.path.insert(0, os.getcwd())
    import agent3_planning as planner


def refine(payload: Dict[str, Any]) -> Dict:
    """Reasoner: LLM-enhanced constraint extraction and re-scoring. Returns refined_response."""
    user_profile = payload.get("user_profile") or {}
    retrieval_data = payload.get("retrieval_data") or {}
    trip_days = payload.get("trip_days") or 1
    lang = payload.get("lang") or "en"

    constraints = planner.extract_constraints(user_profile, {"days": trip_days}, retrieval_data, lang=lang, use_llm=True)
    scored = planner.filter_and_score_candidates(retrieval_data, constraints)
    itineraries = planner.optimize_itineraries(scored, trip_days, constraints=constraints)
    budget_est = planner.estimate_budget_for_plan(user_profile, itineraries, retrieval_data.get("tools", {}).get("tool.gaode.route_matrix"), prices=retrieval_data.get("prices"))
    hotels_meta = [c["metadata"] for c in scored.get("Hotels", [])]
    attractions_meta = [c["metadata"] for c in scored.get("Attractions", []) if not c.get("filtered")]
    hotel_zones = planner.hotel_zone_and_bundle(hotels_meta, attractions=attractions_meta)

    # LLM triage if symptoms present
    symptoms = user_profile.get("symptoms") or user_profile.get("emergency_symptoms")
    hospital_recommendations = None
    if symptoms:
        try:
            triage = planner.emergency_triage(symptoms, user_profile)
        except Exception:
            triage = {"severity": "Low", "strategy": "capability_match_first", "reasons": [], "recommended_actions": ["Rest, monitor"]}
        current_loc = user_profile.get("current_location") or str(retrieval_data.get("canonical_location") or "")
        transport_mode = user_profile.get("transport_mode", "taxi")
        hospital_recommendations = planner.recommend_hospitals(triage, scored, current_loc, transport_mode)

    refined = {
        "constraints": constraints,
        "scored_candidates": scored,
        "itineraries": itineraries,
        "budget_estimate": budget_est,
        "hotel_zones": hotel_zones,
        "hospital_recommendations": hospital_recommendations,
        "notes": ["Refined response from Reasoner (LLM-enhanced)."],
    }
    return {"refined_response": refined}


if __name__ == '__main__':
    import sys
    try:
        payload = json.load(sys.stdin)
    except Exception:
        print(json.dumps({"error": "Provide JSON on stdin with keys user_profile, retrieval_data, trip_days"}))
        sys.exit(1)
    out = refine(payload)
    print(json.dumps(out, ensure_ascii=False, indent=2))
