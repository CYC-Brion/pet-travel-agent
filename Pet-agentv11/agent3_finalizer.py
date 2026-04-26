import json
from typing import Any, Dict, Optional

# Robust import
try:
    import agent3_planning as planner
except Exception:
    import sys, os
    sys.path.insert(0, os.getcwd())
    import agent3_planning as planner


def _build_budget_summary(merged: Dict[str, Any]) -> Dict[str, Any]:
    budget_est = merged.get("budget_estimate")
    if isinstance(budget_est, dict):
        return budget_est
    if isinstance(budget_est, (int, float)):
        return {"total_estimate": float(budget_est), "breakdown": {}, "transport_source": "unknown"}
    return {"total_estimate": 0, "breakdown": {}, "transport_source": "unknown"}


def _build_pet_safety_reminders(merged: Dict[str, Any]) -> list:
    reminders = [
        "Use leash/harness at all outdoor venues.",
        "Provide water and rest every 2-3 hours.",
        "Avoid heat exposure and crowded/noisy areas.",
    ]
    hosp = merged.get("hospital_recommendations") or {}
    severity = str(hosp.get("severity") or "").upper()
    if severity in ("EMERGENCY", "CRITICAL", "HIGH"):
        reminders.append("Seek veterinary care immediately based on triage severity.")
    # Deduplicate while preserving order
    out = []
    seen = set()
    for r in reminders:
        if r not in seen:
            seen.add(r)
            out.append(r)
    return out


def _build_compliance_report(merged: Dict[str, Any]) -> Dict[str, Any]:
    reasons = []
    status = "pass"

    itineraries = merged.get("itineraries") or []
    if not itineraries:
        status = "conditional"
        reasons.append("No itineraries generated.")

    constraints = merged.get("constraints") or {}
    budget_val = constraints.get("budget")
    if budget_val in (None, "", 0):
        status = "conditional"
        reasons.append("Budget not clearly defined in constraints.")

    hosp = merged.get("hospital_recommendations") or {}
    severity = str(hosp.get("severity") or "").upper()
    if severity in ("EMERGENCY", "CRITICAL"):
        status = "conditional"
        reasons.append("Emergency triage present; prioritize medical response.")

    return {
        "status": status,
        "reasons": reasons,
    }


def _align_output_contract(merged: Dict[str, Any], fast: Dict[str, Any], refined: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Attach Prompt 8.0-lite output_contract keys while preserving legacy keys."""
    budget_summary = _build_budget_summary(merged)
    pet_safety_reminders = _build_pet_safety_reminders(merged)
    compliance_report = _build_compliance_report(merged)

    source_trace = [
        {"branch": "3A", "used": bool(fast)},
        {"branch": "3B", "used": bool(refined)},
        {"branch": "3C", "used": True},
    ]

    route_calc_report = {
        "itinerary_count": len(merged.get("itineraries") or []),
        "has_constraints": bool(merged.get("constraints")),
        "method": "planner_pipeline_merge",
    }

    final_merged_result = {
        "itineraries": merged.get("itineraries") or [],
        "budget_summary": budget_summary,
        "notes": merged.get("notes") or [],
        "compliance_report": compliance_report,
    }

    # Required keys from output_contract
    merged["final_merged_result"] = final_merged_result
    merged["budget_summary"] = budget_summary
    merged["pet_safety_reminders"] = pet_safety_reminders
    merged["compliance_report"] = compliance_report

    # Optional keys from output_contract
    merged["qa_result"] = {
        "branch": "3A",
        "available": bool(fast),
        "notes": (fast or {}).get("notes") or [],
    }
    merged["planning_result"] = {
        "branch": "3B",
        "available": bool(refined),
        "notes": (refined or {}).get("notes") or [],
    }
    merged["adjusted_itinerary"] = (merged.get("itineraries") or [None])[0]
    merged["route_calc_report"] = route_calc_report
    merged["source_trace"] = source_trace

    return merged


def _merge_responses(fast: Dict[str, Any], refined: Optional[Dict[str, Any]] = None) -> Dict:
    """Merge fast and refined responses preferring refined fields when present."""
    merged = {}
    # keys to merge
    keys = ["constraints", "scored_candidates", "itineraries", "budget_estimate", "hotel_zones", "hospital_recommendations", "flight_suggestions", "restaurant_suggestions"]
    for k in keys:
        if refined and k in refined:
            merged[k] = refined[k]
        else:
            merged[k] = fast.get(k)

    notes = []
    notes.extend(fast.get("notes") or [])
    if refined:
        notes.extend(refined.get("notes") or [])
    merged["notes"] = notes

    try:
        planner.validate_planner_output(merged)
    except Exception:
        pass

    return merged


def finalize(fast_payload: Dict[str, Any], refined_payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    fast = fast_payload.get("fast_response") if fast_payload and "fast_response" in fast_payload else fast_payload
    refined = refined_payload.get("refined_response") if refined_payload and "refined_response" in refined_payload else refined_payload
    merged = _merge_responses(fast or {}, refined or None)
    merged = _align_output_contract(merged, fast or {}, refined or None)
    return {"final": merged}


if __name__ == '__main__':
    import sys
    # Expect stdin JSON: {user_profile, retrieval_data, trip_days}
    try:
        payload = json.load(sys.stdin)
    except Exception:
        print(json.dumps({"error": "Provide JSON on stdin with keys user_profile, retrieval_data, trip_days"}))
        sys.exit(1)

    # Run full pipeline locally
    from agent3_fetcher import fetch
    from agent3_reasoner import refine

    fast_out = fetch(payload.get("user_profile", {}), payload.get("retrieval_data", {}), payload.get("trip_days", 1), lang=payload.get("lang", "en"))
    refined_out = refine({"user_profile": payload.get("user_profile", {}), "retrieval_data": payload.get("retrieval_data", {}), "trip_days": payload.get("trip_days", 1), "lang": payload.get("lang", "en")})

    final = finalize(fast_out, refined_out)
    print(json.dumps(final, ensure_ascii=False, indent=2))
