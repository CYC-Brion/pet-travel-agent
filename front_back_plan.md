Plan

Pet-agentv11 Full Frontend Capability Integration Plan
Summary
Pet-agentv11 already has strong planning, retrieval, memory, hospital search, budget estimation, and emergency-related agent logic, but it does not yet expose the full product capabilities the current frontend needs. The integration should therefore add an API adapter plus a small backend application layer that fills missing frontend-facing capabilities: auth/session, trip lifecycle, saved trip history, structured plan normalization, emergency replanning, map data, review data, and settings/profile persistence.

V1 goal: make the current frontend fully usable with backend-backed state, while keeping main.py CLI behavior intact.

Backend Additions
Add FastAPI service entrypoint Pet-agentv11/api.py with CORS for Vite and GET /health.
Add a frontend-facing service layer that wraps existing agent functions and normalizes outputs into stable JSON contracts.
Add lightweight app-state persistence in Cosmos DB using existing container patterns:
user profile
pet profile
trip records
trip status
latest plan snapshot
review records
Add graceful fallback behavior when live tools fail:
return partial plan data when possible
include warnings
never crash the frontend with raw Python exceptions.
Required API Surface
Session / Profile
POST /api/session/login
Mock-friendly login/create-user endpoint for the frontend.
Creates or loads user profile by email/name.
GET /api/users/{user_id}/profile
Returns user, pet, preferences, and saved defaults.
PUT /api/users/{user_id}/profile
Updates settings page fields, including min/max budget, transport preference, hotel preference, pet profile, and emergency contact.
Trip Planning
POST /api/trips/plan

Main endpoint for InfoCompletionPage -> Loading -> Planning.
Maps frontend min/max budget to backend budget string: "3500-6000 CNY".
Calls existing Agent 2 + Agent 3 planning pipeline.
Saves a trip record with status planned.
Returns normalized plan JSON.
Response must include:

{
  "ok": true,
  "trip_id": "...",
  "session_id": "...",
  "status": "planned",
  "assistant_reply": "...",
  "plan": {
    "title": "Your Pet-Friendly Trip to Hangzhou",
    "route": "Shanghai to Hangzhou",
    "dates": "May 15-18, 2026",
    "budget_range": { "min": 3500, "max": 6000, "currency": "CNY" },
    "estimated_total": 4500,
    "hotel": {},
    "itinerary_days": [],
    "restaurants": [],
    "attractions": [],
    "hospitals": [],
    "flights": [],
    "risks": [],
    "documents": [],
    "source_trace": []
  },
  "warnings": [],
  "raw": {}
}
Trip Lifecycle
GET /api/users/{user_id}/trips
Powers HomeDashboard upcoming, in-progress, and past trip cards.
GET /api/trips/{trip_id}
Loads one full trip plan.
PATCH /api/trips/{trip_id}/status
Supports draft, planned, in_progress, completed.
POST /api/trips/{trip_id}/start
Marks trip as in_progress.
POST /api/trips/{trip_id}/complete
Marks trip as completed and prepares review summary.
Map / Route
GET /api/trips/{trip_id}/map
Returns map-ready itinerary stops.
Normalizes backend itinerary into:
day tabs
stop id/name/type/time/location
route order
pet policy
ticket/price
phone/address when available.
If backend lacks exact route geometry, return ordered POIs and let frontend render the current simplified visual route.
Emergency Replan
POST /api/trips/{trip_id}/emergency-replan
Input: current issue, selected day, affected stop, optional symptoms/weather reason.
Reuses existing emergency/hospital/replan capabilities.
Returns:
affected plan summary
alternative itinerary
nearest pet hospitals
safety checklist
decision options.
POST /api/trips/{trip_id}/emergency-decision
Persists user choice:
accepted_alternative
kept_original
cancelled.
Review
GET /api/trips/{trip_id}/review
Returns post-trip summary for TripReviewPage.
If no explicit review exists, generate summary from completed trip record.
POST /api/trips/{trip_id}/review
Saves rating, notes, highlights, spending, and pet experience.
Backend Capability Gaps To Fill
Auth is not real auth in V1; implement session/user identity as lightweight profile lookup by user id/email.
Trip history is not currently frontend-ready; create normalized trip list records from saved plan cache.
Backend output is partly natural-language and partly structured; add a response normalizer so frontend never parses assistant prose.
Emergency flow exists conceptually, but not as frontend API state; add explicit emergency decision persistence.
Review page has no backend source; derive v1 review data from trip plan + user rating.
Map page needs stable POI coordinates; when coordinates are missing, return null coordinates and preserve ordered stop rendering.
Settings page needs profile persistence; map settings into existing user slots/profile fields.
Frontend Changes
Add src/app/api/client.ts and typed request/response models.
Replace mockAppState as source of truth with API-backed app state, keeping mock fallback only for backend-unavailable development.
ProfilePage
call login endpoint before navigating home.
HomeDashboard
load trips from GET /api/users/{user_id}/trips.
InfoCompletionPage
submit trip form to POST /api/trips/plan.
LoadingPlanningPage
show current animation while request is pending.
on success navigate to Planning.
on failure show retry/back-to-info state.
PlanningResultPage
render API plan instead of hardcoded itinerary.
MapRoutePage
render API map stops when available.
EmergencyReplanPage
call emergency replan and persist decision.
SettingsPage
load/save backend profile.
TripReviewPage
load derived review and submit rating/notes.
Test Plan
Backend:
pytest -q
API tests for health, login, profile save/load, plan creation, trip list, status update, map payload, emergency replan, review save/load.
Mock external APIs so tests do not require live QWeather/Gaode/SerpAPI/OpenAI.
Frontend:
npm run build
Test backend unavailable fallback.
Test successful full path:
Login
Home
Info submit
Loading
Planning
Start trip
Map
Emergency replan
End trip
Review
Back Home shows completed trip.
E2E manual:
Backend: uvicorn api:app --host 127.0.0.1 --port 8000 --reload
Frontend: npm run dev
Verify default Shanghai -> Hangzhou flow with budget 3500-6000 CNY.
Documentation Update
Append this complete plan to FRONTEND_PLAN.md under:

## 2026-04-26 Pet-agentv11 Full Integration Plan

Also mark the previous API-only integration plan as superseded by this fuller plan.

Assumptions
V1 uses non-streaming API calls; SSE streaming is a later enhancement.
The frontend remains English.
Pet-agentv11 remains the backend source of truth.
CLI main.py must continue working.
Real authentication is out of scope for V1; lightweight user/session identity is enough.
Backend should add missing product endpoints rather than forcing the frontend to keep mock state.
