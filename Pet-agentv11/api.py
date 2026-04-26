from __future__ import annotations

import json
import os
import re
import uuid
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


TripStatus = Literal["draft", "planned", "in_progress", "completed"]
EmergencyDecision = Literal["none", "accepted_alternative", "kept_original", "cancelled"]


class LoginRequest(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None


class TripInput(BaseModel):
    departure: str = "Shanghai"
    destination: str
    start_date: str
    end_date: str
    days: int = Field(default=3, ge=1)
    num_people: int = Field(default=1, ge=1)
    num_pets: int = Field(default=1, ge=1)
    budget_min: int = Field(default=0, ge=0)
    budget_max: int = Field(default=0, ge=0)
    transport: str = "car"
    hotel_preference: str = "4-star"
    pace: str = "relaxed"


class PetInput(BaseModel):
    name: str = "Biscuit"
    type: str = "dog"
    breed: str = "Golden Retriever"
    age: int = Field(default=3, ge=0)
    weight_kg: float = Field(default=35, ge=0)
    health_status: str = "good"
    medical_notes: str = ""


class SafetyInput(BaseModel):
    emergency_contact: str = "Jane Chen (+86 138-0000-1234)"
    include_pet_hospitals: bool = True


class PlanRequest(BaseModel):
    user_id: str = "alex-chen"
    session_id: Optional[str] = None
    trip: TripInput
    pet: PetInput
    safety: SafetyInput = Field(default_factory=SafetyInput)


class StatusRequest(BaseModel):
    status: TripStatus


class EmergencyReplanRequest(BaseModel):
    issue: str = "Heavy rain near West Lake"
    selected_day: int = 2
    affected_stop: Optional[str] = None
    symptoms: Optional[str] = None
    reason: Optional[str] = None


class EmergencyDecisionRequest(BaseModel):
    decision: EmergencyDecision


class ReviewRequest(BaseModel):
    rating: float = Field(default=4.5, ge=0, le=5)
    notes: str = ""
    highlights: List[str] = Field(default_factory=list)
    spending: Dict[str, Any] = Field(default_factory=dict)
    pet_experience: str = ""


class ProfileRequest(BaseModel):
    fullName: str = "Alex Chen"
    email: str = "alex.chen@example.com"
    phone: str = "+86 138-0000-1234"
    petName: str = "Biscuit"
    petType: str = "dog"
    breed: str = "Golden Retriever"
    age: str = "3"
    weight: str = "35"
    healthStatus: str = "healthy"
    healthNotes: str = "Vaccinations up to date. No known allergies."
    minBudget: str = "3500"
    maxBudget: str = "6000"
    transportPreference: str = "car"
    hotelPreference: str = "4-star"
    travelPace: str = "moderate"
    emergencyName: str = "Jane Chen"
    emergencyPhone: str = "+86 138-0000-1234"
    emergencyRelation: str = "Spouse"


app = FastAPI(title="Pet Agent API", version="v11")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


DATA_DIR = Path(__file__).parent / "data"
STATE_FILE = DATA_DIR / "app_state.json"


def _load_state() -> Dict[str, Dict[str, Any]]:
    if not STATE_FILE.exists():
        return {"profiles": {}, "trips": {}, "reviews": {}}
    try:
        payload = json.loads(STATE_FILE.read_text(encoding="utf-8"))
        return {
            "profiles": payload.get("profiles", {}),
            "trips": payload.get("trips", {}),
            "reviews": payload.get("reviews", {}),
        }
    except Exception:
        return {"profiles": {}, "trips": {}, "reviews": {}}


def _save_state() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "profiles": PROFILES,
        "trips": TRIPS,
        "reviews": REVIEWS,
        "updated_at": datetime.utcnow().isoformat(),
    }
    STATE_FILE.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


_state = _load_state()
PROFILES: Dict[str, Dict[str, Any]] = _state["profiles"]
TRIPS: Dict[str, Dict[str, Any]] = _state["trips"]
REVIEWS: Dict[str, Dict[str, Any]] = _state["reviews"]


def _slug(value: str) -> str:
    text = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return text or "user"


def _fmt_currency(value: Any) -> str:
    try:
        return f"¥{int(float(value)):,}"
    except Exception:
        return "¥0"


def _date_label(start: str, end: str) -> str:
    try:
        s = datetime.fromisoformat(start)
        e = datetime.fromisoformat(end)
        if s.year == e.year and s.month == e.month:
            return f"{s.strftime('%b')} {s.day}-{e.day}, {s.year}"
        return f"{s.strftime('%b')} {s.day}, {s.year} - {e.strftime('%b')} {e.day}, {e.year}"
    except Exception:
        return f"{start} to {end}"


def _default_profile(user_id: str, email: Optional[str] = None, name: Optional[str] = None) -> Dict[str, Any]:
    full_name = name or "Alex Chen"
    return {
        "user_id": user_id,
        "fullName": full_name,
        "email": email or "alex.chen@example.com",
        "phone": "+86 138-0000-1234",
        "petName": "Biscuit",
        "petType": "dog",
        "breed": "Golden Retriever",
        "age": "3",
        "weight": "35",
        "healthStatus": "healthy",
        "healthNotes": "Vaccinations up to date. No known allergies.",
        "minBudget": "3500",
        "maxBudget": "6000",
        "transportPreference": "car",
        "hotelPreference": "4-star",
        "travelPace": "moderate",
        "emergencyName": "Jane Chen",
        "emergencyPhone": "+86 138-0000-1234",
        "emergencyRelation": "Spouse",
    }


def _fallback_itinerary(req: PlanRequest) -> List[Dict[str, Any]]:
    city = req.trip.destination
    return [
        {
            "day": 1,
            "date": req.trip.start_date,
            "activities": [
                {"id": "d1-1", "time": "09:00", "type": "transport", "title": f"Depart {req.trip.departure}", "duration": "2 hrs", "price": "¥200 gas", "petPolicy": None},
                {"id": "d1-2", "time": "11:30", "type": "hotel", "title": f"Check-in: {city} Pet-Friendly Hotel", "duration": None, "price": "¥680", "petPolicy": "Friendly", "hours": "24 hours"},
                {"id": "d1-3", "time": "14:00", "type": "attraction", "title": "Su Causeway Walk", "duration": "2 hrs", "ticket": "Free", "petPolicy": "Leash required", "hours": "Always open"},
                {"id": "d1-4", "time": "16:30", "type": "meal", "title": "Pet-Friendly Cafe", "petPolicy": "Friendly"},
                {"id": "d1-5", "time": "18:00", "type": "meal", "title": "Dinner at Hubin Road Pet Restaurant", "petPolicy": "Friendly"},
            ],
        },
        {
            "day": 2,
            "date": req.trip.start_date,
            "activities": [
                {"id": "d2-1", "time": "08:30", "type": "attraction", "title": "Prince Bay Park", "duration": "2.5 hrs", "ticket": "Free", "petPolicy": "Leash required", "hours": "Open until 18:00"},
                {"id": "d2-2", "time": "12:00", "type": "meal", "title": "Lunch Break"},
                {"id": "d2-3", "time": "14:00", "type": "transport", "title": "Drive to Yunqi Bamboo Trail", "duration": "30 min", "price": "¥30 gas"},
                {"id": "d2-4", "time": "15:00", "type": "attraction", "title": "Yunqi Bamboo Trail", "duration": "2 hrs", "ticket": "¥8", "petPolicy": "Friendly", "hours": "Open until 17:00"},
                {"id": "d2-5", "time": "17:30", "type": "meal", "title": "Tea House Rest Stop", "petPolicy": "Friendly"},
            ],
        },
        {
            "day": 3,
            "date": req.trip.end_date,
            "activities": [
                {"id": "d3-1", "time": "09:00", "type": "attraction", "title": "Longjing Village", "duration": "2 hrs", "ticket": "Free", "petPolicy": "Friendly"},
                {"id": "d3-2", "time": "12:00", "type": "hotel", "title": "Hotel Check-out"},
                {"id": "d3-3", "time": "13:30", "type": "transport", "title": f"Return to {req.trip.departure}", "duration": "2 hrs", "price": "¥200 gas"},
            ],
        },
    ][: req.trip.days]


def _fallback_hospitals(city: str) -> List[Dict[str, Any]]:
    return [
        {
            "id": "hospital-1",
            "name": f"{city} Pet Hospital (24hr)",
            "rating": 4.8,
            "hours": "24 hours",
            "distance": "2.3 km",
            "eta": "8 min",
            "phone": "+86 571-8888-0000",
            "address": f"No. 268 Kaixuan Road, {city}",
        },
        {
            "id": "hospital-2",
            "name": f"{city} Pet Care Hospital",
            "rating": 4.6,
            "hours": "08:00-22:00",
            "distance": "4.1 km",
            "eta": "12 min",
            "phone": "+86 571-8888-0001",
            "address": f"No. 155 Wensan West Road, {city}",
        },
    ]


def _normalize_plan(req: PlanRequest, recommendations: Optional[Dict[str, Any]] = None, retrieval_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    rec = recommendations or {}
    budget_summary = rec.get("budget_summary") or rec.get("budget_estimate") or {}
    total = budget_summary.get("total_estimate") if isinstance(budget_summary, dict) else None
    if not total:
        total = min(max(req.trip.budget_min + 1000, req.trip.budget_min), req.trip.budget_max or req.trip.budget_min + 1000)

    itineraries = rec.get("itineraries") if isinstance(rec.get("itineraries"), list) else []
    itinerary_days = _fallback_itinerary(req)
    if itineraries:
        first = itineraries[0]
        stops = first.get("stops") if isinstance(first, dict) else None
        if isinstance(stops, list) and stops:
            itinerary_days = [{
                "day": 1,
                "date": req.trip.start_date,
                "activities": [
                    {
                        "id": str(stop.get("id") or f"stop-{idx + 1}"),
                        "time": stop.get("time") or "TBD",
                        "type": stop.get("type") or "attraction",
                        "title": stop.get("name") or stop.get("title") or "Trip stop",
                        "duration": stop.get("duration"),
                        "ticket": stop.get("ticket"),
                        "price": stop.get("price"),
                        "petPolicy": stop.get("pet_policy") or stop.get("petPolicy"),
                    }
                    for idx, stop in enumerate(stops)
                ],
            }]

    hospitals = _fallback_hospitals(req.trip.destination)
    hosp_rec = rec.get("hospital_recommendations") or {}
    if isinstance(hosp_rec, dict) and isinstance(hosp_rec.get("candidates"), list) and hosp_rec["candidates"]:
        hospitals = [
            {
                "id": str(item.get("id") or f"hospital-{idx + 1}"),
                "name": item.get("name") or "Pet Hospital",
                "rating": item.get("rating") or 4.5,
                "hours": item.get("hours") or "Call to confirm",
                "distance": item.get("distance") or "Nearby",
                "eta": f"{item.get('eta_minutes')} min" if item.get("eta_minutes") else "TBD",
                "phone": item.get("tel") or item.get("phone") or item.get("contact") or "N/A",
                "address": item.get("address") or "Address unavailable",
            }
            for idx, item in enumerate(hosp_rec["candidates"][:3])
        ]

    attractions = [
        {"id": "a1", "name": "Su Causeway Walk", "type": "Nature", "petFriendly": True},
        {"id": "a2", "name": "Prince Bay Park", "type": "Park", "petFriendly": True},
        {"id": "a3", "name": "Yunqi Bamboo Trail", "type": "Nature", "petFriendly": True},
    ]
    restaurants = [
        {"id": "r1", "name": "Pet-Friendly Cafe", "type": "Cafe", "petFriendly": True},
        {"id": "r2", "name": "Hubin Road Pet Restaurant", "type": "Restaurant", "petFriendly": True},
    ]

    return {
        "title": f"Your Pet-Friendly Trip to {req.trip.destination}",
        "route": f"{req.trip.departure} to {req.trip.destination}",
        "dates": _date_label(req.trip.start_date, req.trip.end_date),
        "budget_range": {"min": req.trip.budget_min, "max": req.trip.budget_max, "currency": "CNY"},
        "estimated_total": int(float(total)),
        "hotel": {"name": f"{req.trip.destination} Pet-Friendly Hotel", "type": req.trip.hotel_preference, "price": "¥680/night", "petPolicy": "Friendly"},
        "itinerary_days": itinerary_days,
        "restaurants": restaurants,
        "attractions": attractions,
        "hospitals": hospitals,
        "flights": rec.get("flight_suggestions") or [],
        "risks": rec.get("notes") or ["Confirm pet policies before arrival.", "Carry vaccination records and water."],
        "documents": ["Pet vaccination record", "Owner ID/passport", "Hotel pet policy confirmation"],
        "source_trace": rec.get("source_trace") or [{"branch": "fallback", "used": True}],
    }


def _try_agent_plan(req: PlanRequest) -> tuple[Optional[str], Optional[Dict[str, Any]], Optional[Dict[str, Any]], List[str]]:
    if os.getenv("PET_AGENT_USE_LIVE", "0") != "1":
        return None, None, None, ["Live agent disabled; using API fallback plan."]

    try:
        import sys

        sys.path.insert(0, os.path.dirname(__file__))
        from agent1_orchestrator import agent1_orchestrator
        from helper import get_or_create_user_profile

        user_profile = get_or_create_user_profile(req.user_id)
        user_profile.update({
            "pet_type": req.pet.type,
            "breed": req.pet.breed,
            "pet_weight": req.pet.weight_kg,
            "budget": f"{req.trip.budget_min}-{req.trip.budget_max} CNY",
            "transport": req.trip.transport,
            "num_people": req.trip.num_people,
            "num_pets": req.trip.num_pets,
            "departure": req.trip.departure,
        })
        trip_context = {
            "initial_mode": "pre_trip",
            "departure": req.trip.departure,
            "city": req.trip.destination,
            "date": req.trip.start_date,
            "days": str(req.trip.days),
            "num_people": str(req.trip.num_people),
            "num_pets": str(req.trip.num_pets),
            "pet_weight": str(req.pet.weight_kg),
            "budget": f"{req.trip.budget_min}-{req.trip.budget_max} CNY",
            "transport": req.trip.transport,
        }
        prompt = f"Plan a pet-friendly trip to {req.trip.destination}."
        reply = agent1_orchestrator(req.session_id or str(uuid.uuid4()), req.user_id, prompt, trip_context, user_profile)
        return reply, None, None, ["Live agent completed; structured fallback normalizer used for frontend fields."]
    except Exception as exc:
        return None, None, None, [f"Live agent unavailable: {exc}. Using API fallback plan."]


def _trip_summary(trip: Dict[str, Any]) -> Dict[str, Any]:
    plan = trip["plan"]
    status = trip.get("status", "planned")
    return {
        "id": trip["trip_id"],
        "title": plan["title"],
        "route": plan["route"],
        "dates": plan["dates"],
        "petName": trip.get("pet", {}).get("name", "Pet"),
        "status": status,
        "nextStep": (
            "Resume today from the route map" if status == "in_progress"
            else "View trip review" if status == "completed"
            else "Confirm the plan or start the trip"
        ),
        "rating": (REVIEWS.get(trip["trip_id"]) or {}).get("rating"),
    }


@app.get("/health")
def health() -> Dict[str, Any]:
    return {"ok": True, "service": "pet-agent", "version": "v11"}


@app.post("/api/session/login")
def login(req: LoginRequest) -> Dict[str, Any]:
    base = req.email or req.name or "alex.chen@example.com"
    user_id = _slug(base.split("@")[0])
    profile = PROFILES.setdefault(user_id, _default_profile(user_id, req.email, req.name))
    _save_state()
    return {"ok": True, "user_id": user_id, "session_id": str(uuid.uuid4()), "profile": profile}


@app.get("/api/users/{user_id}/profile")
def get_profile(user_id: str) -> Dict[str, Any]:
    profile = PROFILES.setdefault(user_id, _default_profile(user_id))
    _save_state()
    return {"ok": True, "profile": profile}


@app.put("/api/users/{user_id}/profile")
def put_profile(user_id: str, req: ProfileRequest) -> Dict[str, Any]:
    profile = {"user_id": user_id, **req.model_dump()}
    PROFILES[user_id] = profile
    _save_state()
    return {"ok": True, "profile": profile}


@app.post("/api/trips/plan")
def plan_trip(req: PlanRequest) -> Dict[str, Any]:
    session_id = req.session_id or str(uuid.uuid4())
    trip_id = f"trip-{uuid.uuid4().hex[:10]}"
    assistant_reply, rec, retrieval, warnings = _try_agent_plan(req)
    plan = _normalize_plan(req, rec, retrieval)
    if not assistant_reply:
        assistant_reply = f"I created one budget-matched itinerary for {plan['route']} within {_fmt_currency(req.trip.budget_min)} - {_fmt_currency(req.trip.budget_max)}."

    trip_record = {
        "trip_id": trip_id,
        "session_id": session_id,
        "user_id": req.user_id,
        "status": "planned",
        "emergency_decision": "none",
        "trip": req.trip.model_dump(),
        "pet": req.pet.model_dump(),
        "safety": req.safety.model_dump(),
        "plan": plan,
        "assistant_reply": assistant_reply,
        "warnings": warnings,
        "raw": {"recommendations": rec or {}, "retrieval_data": retrieval or {}},
        "created_at": datetime.utcnow().isoformat(),
    }
    TRIPS[trip_id] = trip_record
    _save_state()
    return {
        "ok": True,
        "trip_id": trip_id,
        "session_id": session_id,
        "status": "planned",
        "assistant_reply": assistant_reply,
        "plan": plan,
        "warnings": warnings,
        "raw": trip_record["raw"],
    }


@app.get("/api/users/{user_id}/trips")
def list_trips(user_id: str) -> Dict[str, Any]:
    trips = [_trip_summary(t) for t in TRIPS.values() if t.get("user_id") == user_id]
    if not trips:
        trips = [
            {
                "id": "sample-hangzhou",
                "title": "Hangzhou Pet-Friendly Weekend",
                "route": "Shanghai to Hangzhou",
                "dates": "May 15-18, 2026",
                "petName": "Biscuit",
                "status": "draft",
                "nextStep": "Complete trip details",
            }
        ]
    return {"ok": True, "trips": trips}


@app.get("/api/trips/{trip_id}")
def get_trip(trip_id: str) -> Dict[str, Any]:
    trip = TRIPS.get(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return {"ok": True, **trip}


@app.patch("/api/trips/{trip_id}/status")
def patch_status(trip_id: str, req: StatusRequest) -> Dict[str, Any]:
    trip = TRIPS.get(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    trip["status"] = req.status
    _save_state()
    return {"ok": True, "trip": _trip_summary(trip)}


@app.post("/api/trips/{trip_id}/start")
def start_trip(trip_id: str) -> Dict[str, Any]:
    return patch_status(trip_id, StatusRequest(status="in_progress"))


@app.post("/api/trips/{trip_id}/complete")
def complete_trip(trip_id: str) -> Dict[str, Any]:
    result = patch_status(trip_id, StatusRequest(status="completed"))
    REVIEWS.setdefault(trip_id, _review_from_trip(TRIPS[trip_id]))
    _save_state()
    return result


@app.get("/api/trips/{trip_id}/map")
def get_map(trip_id: str) -> Dict[str, Any]:
    trip = TRIPS.get(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    days = []
    routes: Dict[str, List[Dict[str, Any]]] = {}
    for day in trip["plan"]["itinerary_days"]:
        day_num = int(day.get("day", len(days) + 1))
        days.append({"day": day_num, "date": day.get("date"), "label": f"Day {day_num}"})
        stops = []
        for idx, act in enumerate(day.get("activities", [])):
            stops.append({
                "id": act.get("id") or f"{day_num}-{idx + 1}",
                "time": act.get("time") or "TBD",
                "name": act.get("title") or act.get("name") or "Trip stop",
                "type": act.get("type") or "attraction",
                "duration": act.get("duration"),
                "distance": act.get("distance"),
                "petPolicy": act.get("petPolicy") or act.get("pet_policy"),
                "hours": act.get("hours"),
                "ticket": act.get("ticket"),
                "phone": act.get("phone"),
                "description": act.get("description"),
                "x": 15 + min(idx * 12, 70),
                "y": 45 + ((idx % 3) * 5),
            })
        routes[str(day_num)] = stops
    return {"ok": True, "days": days, "routes": routes, "hospitals": trip["plan"].get("hospitals", [])}


@app.post("/api/trips/{trip_id}/emergency-replan")
def emergency_replan(trip_id: str, req: EmergencyReplanRequest) -> Dict[str, Any]:
    trip = TRIPS.get(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    alt = [
        {"time": "14:00", "name": "Zhejiang Provincial Museum", "type": "indoor", "original": req.affected_stop or "Outdoor stop", "reason": "Indoor venue with safer weather conditions", "distance": "2.5 km", "eta": "15 min", "petService": "Pet boarding available", "ticket": "¥30"},
        {"time": "16:30", "name": "Return to Hotel", "type": "indoor", "original": "Outdoor cafe", "reason": "More comfortable for pets during the alert", "distance": "1.2 km", "eta": "8 min", "petPolicy": "Friendly"},
        {"time": "18:00", "name": "Dinner at Hubin Road", "type": "indoor", "original": "Same as original", "petPolicy": "Friendly"},
    ]
    payload = {
        "ok": True,
        "emergency": {"type": "weather", "severity": "moderate", "title": "Emergency Replan", "description": req.issue, "detectedAt": "Just now"},
        "affectedStops": [{"time": "14:00", "name": req.affected_stop or "Current outdoor stop", "reason": req.reason or req.issue, "impact": "high"}],
        "alternativePlan": alt,
        "originalPlan": alt,
        "hospitals": trip["plan"].get("hospitals", []),
        "safetyChecklist": [
            {"id": 1, "label": "Emergency contact verified", "checked": True},
            {"id": 2, "label": "Nearest pet hospital located", "checked": True},
            {"id": 3, "label": "Hotel notified of early return", "checked": False},
        ],
        "decisionOptions": ["accepted_alternative", "kept_original", "cancelled"],
    }
    trip["last_emergency"] = payload
    _save_state()
    return payload


@app.post("/api/trips/{trip_id}/emergency-decision")
def emergency_decision(trip_id: str, req: EmergencyDecisionRequest) -> Dict[str, Any]:
    trip = TRIPS.get(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    trip["emergency_decision"] = req.decision
    _save_state()
    return {"ok": True, "trip_id": trip_id, "decision": req.decision}


def _review_from_trip(trip: Dict[str, Any]) -> Dict[str, Any]:
    plan = trip["plan"]
    attractions = plan.get("attractions", [])
    total = int(plan.get("estimated_total") or 0)
    return {
        "trip_id": trip["trip_id"],
        "name": plan["title"],
        "dates": plan["dates"],
        "hotel": (plan.get("hotel") or {}).get("name", "Pet-Friendly Hotel"),
        "rating": 4.5,
        "spending": [
            {"category": "Hotel", "amount": _fmt_currency(total * 0.45), "percentage": 45},
            {"category": "Transport", "amount": _fmt_currency(total * 0.14), "percentage": 14},
            {"category": "Meals", "amount": _fmt_currency(total * 0.20), "percentage": 20},
            {"category": "Attractions", "amount": _fmt_currency(total * 0.12), "percentage": 12},
            {"category": "Other", "amount": _fmt_currency(total * 0.09), "percentage": 9},
        ],
        "placesVisited": attractions,
        "petMilestones": [
            {"label": "Pet-friendly stops completed", "value": str(len(attractions))},
            {"label": "Total distance walked", "value": "12.5 km"},
            {"label": "Days without incidents", "value": str(trip.get("trip", {}).get("days", 3))},
            {"label": "New places explored", "value": str(len(attractions))},
        ],
        "notes": "",
    }


@app.get("/api/trips/{trip_id}/review")
def get_review(trip_id: str) -> Dict[str, Any]:
    trip = TRIPS.get(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    review = REVIEWS.setdefault(trip_id, _review_from_trip(trip))
    _save_state()
    return {"ok": True, "review": review}


@app.post("/api/trips/{trip_id}/review")
def post_review(trip_id: str, req: ReviewRequest) -> Dict[str, Any]:
    trip = TRIPS.get(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    review = _review_from_trip(trip)
    review.update(req.model_dump())
    REVIEWS[trip_id] = review
    _save_state()
    return {"ok": True, "review": review}
