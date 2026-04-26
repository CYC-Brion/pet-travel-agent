# Pet-agentv9

A pet travel planning agent that generates personalized trip itineraries with pet-specific constraints — hotels, flights, restaurants, weather, routes, and emergency vet recommendations.

## Architecture 

```
#for Agent 3
Fetcher ──┐
          ├──► Finalizer
Reasoner ─┘
```

- **Fetcher** (`agent3_fetcher.py`) — fast, deterministic, no LLM. Scores candidates, builds itineraries, estimates budget.
- **Reasoner** (`agent3_reasoner.py`) — LLM-enhanced refinement using OpenAI for smarter constraint extraction and triage.
- **Finalizer** (`agent3_finalizer.py`) — merges both outputs, preferring reasoner fields when present.

### Agent Layers

| Module | Role |
|---|---|
| `agent1_orchestrator.py` | Top-level orchestrator |
| `agent2_retrieval.py` | **Core agent 2** — orchestrates all data retrieval; feeds agent 3 |
| `agent2_serpapi.py` | Hotels, flights, restaurants/attractions via SerpAPI |
| `agent2_weather.py` | Weather, forecast, rain alerts, lifestyle indices via QWeather |
| `agent2_gaode.py` | Geocoding, POI search, routing, and traffic via Gaode/Amap |
| `agent2_rules.py` | Pet policy and breed rule evaluation via Cosmos DB + OpenAI |
| `agent3_planning.py` | **Core agent 3** — shared planning logic: scoring, optimization, hospital recommendations |
| `agent3_fetcher.py` | Deterministic scoring, itinerary building, budget estimation |
| `agent3_reasoner.py` | LLM-enhanced constraint extraction and emergency triage |
| `agent3_finalizer.py` | Result synthesis and output formatting |

### MCP Tool Schemas

`dynamic_toolsV5/` contains 15+ JSON schema definitions (Gaode, QWeather, Google Hotels, SerpAPI) with a standardized `ok / data / error` response envelope.

## Trip Plan Persistence

Trip plans are stored in Cosmos DB using a split-document model so the agent can both recall earlier trips and replan from structured JSON without hitting Cosmos item size limits.

### What is stored

- `trip_plan_cache` — compact latest plan for fast recall and replanning.
- `trip_plan_version` — compact version history for the same user/city/date.
- `trip_plan_itinerary_detail` — separate child documents for full itinerary JSON when a plan is too large to fit in one item.

### Cached fields

The persisted plan keeps only the fields needed for recall and modification:

- `hotels` — capped to 1-2 suggestions
- `budget_summary`
- `itineraries`
- `flights` — capped to 1-2 suggestions

If an itinerary is still too large, the system stores a compact summary in the parent item and the full itinerary in a child detail document referenced by `detail_id`.

### Replanning behavior

When the user asks to change a hotel or attractions, the orchestrator loads the previous cached plan, hydrates any itinerary detail documents, and gives the agent structured JSON instead of plain text. This makes it easier to compare the old and new plan and update only the affected parts.

### Size and history controls

Optional environment variables:

- `TRIP_PLAN_HISTORY_LIMIT` — how many version docs to keep per user/city/date
- `TRIP_PLAN_MAX_DOC_BYTES` — soft limit used before compacting itinerary payloads

## Setup

1. Create and activate a virtual environment:

```bash
python -m venv .venv
.\.venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy `.env` and fill in your API keys:

```
GAODE_API_KEY=
QWEATHER_API_KEY=
SERPAPI_KEY=
OPENAI_API_KEY=
COSMOS_ENDPOINT=
COSMOS_KEY=
TRIP_PLAN_HISTORY_LIMIT=5
TRIP_PLAN_MAX_DOC_BYTES=1700000
```

4. Run the main entrypoint:

```bash
python main.py
```

## Testing

```bash
pytest -q
```

All external APIs (QWeather, Gaode, Cosmos, OpenAI) are mocked in `conftest.py` for deterministic tests.

## External APIs

- [QWeather](https://dev.qweather.com/) — weather data
- [SerpAPI](https://serpapi.com/) — Google Hotels, Flights, Maps
- [Gaode / Amap](https://lbs.amap.com/) — geocoding, POI, routing
- [Azure Cosmos DB](https://azure.microsoft.com/products/cosmos-db) — pet breed profiles and policies
- [OpenAI](https://platform.openai.com/) — LLM constraint extraction and triage



## Changelog 24/4 14:00 From ECHO

### v7 — Budget Calculation Overhaul (`agent3_planning.py`)

**Live data integration**

Budget estimation now uses live SerpAPI data fetched by `agent2_retrieval` instead of static fallbacks where possible. All 6 budget components:

| Component | Live Source | Fallback |
|---|---|---|
| hotel | `prices["hotels_search_env"]` — median/cheapest/priciest by tier | `_STATIC_KB["hotel"] * days` |
| food | `prices["restaurants_env"]` — avg restaurant price level × 3 meals/day | `_STATIC_KB["food"] * days` |
| attraction | `prices["attractions_env"]` — avg ticket price × 2 attractions/day | `_STATIC_KB["attraction"]` |
| transport | Gaode route matrix → haversine itinerary distances | `¥80 * days` flat |
| flights | `prices["flights_env"]` — lowest one-way × 2 (round-trip) × adults | `_STATIC_KB["flights"]` (only if `departure_id` set, else ¥0) |
| pet_fee | — | `_STATIC_KB["pet_fee"] * days` (always static) |

**Hotel tier-aware selection**

Live hotel prices are now filtered by budget tier:
- `economy` → cheapest available price
- `comfort` → median price
- `luxury` → most expensive available price

**Flight opt-in**

Flights are only included in the budget if `user_profile["departure_id"]` is set. Local trips without a flight leg correctly show `flights: ¥0`.

**Static KB updated**

Added `flights` as a flat per-trip fallback to `_STATIC_KB`:
- luxury: ¥2000, comfort: ¥1200, economy: ¥600

**`_format_budget()` updated**

Now displays all 6 components with their data sources, e.g.:
```
¥5621 total (hotel ¥2550 [serpapi_google_hotels, n=3], food ¥630 [serpapi_google_maps_restaurants], attraction ¥217 [serpapi_google_maps_attractions], pet fee ¥240, transport ¥112 [itinerary_haversine], flights ¥1360 [serpapi_google_flights])
```


### SerpAPI internal parallelism (`agent2_retrieval.py`)

`_serpapi_subagent` now runs hotels, maps, and flights concurrently via `ThreadPoolExecutor(max_workers=3)` instead of sequentially. Reduces SerpAPI fetch time from ~3× to ~1× serial latency.


## Changelog 24/4 21:30 From ECHO

### Budget Calculation with People & Pets
Trip cost estimation now accounts for number of travelers and pets alongside standard expenses. Each category (hotel, food, transport, attractions, pet-fee) scales dynamically based on group size.

### Bilingual UI (`main.py`, `helper.py`)

All user-facing prompts and messages now display both English and Chinese side by side, e.g.:
```
✈️ Destination city / 目的地城市:
💰 Budget range (e.g., 1000-3000 CNY) / 预算范围（如 1000-3000 元）:
```
Covers: user ID, mode selection, all trip detail inputs, resume/new trip messages, welcome, goodbye, and onboarding prompts in `helper.py`.

Chinese input is supported natively via Python 3's `input()`. Set `PYTHONIOENCODING=utf-8` on Windows if characters appear garbled.

### Flight Suggestions (`agent3_fetcher.py`, `agent3_finalizer.py`)

When the user selects flight as preferred transport, agent 3 now extracts flight options from `retrieval_data["prices"]["flights_env"]` and includes them in the final plan output under `flight_suggestions`:

```json
[{"airline": "Air China", "departure": "08:00", "arrival": "10:30", "duration_min": 150, "price": 680}]
```

- Only populated when transport contains "flight", "fly", "plane", or "飞机"
- `agent3_finalizer.py` merge keys updated to include `flight_suggestions`

### Flight Budget Fix (`agent3_planning.py`)

`has_flight` previously only checked `user_profile["departure_id"]` (never set from user input — always `False`). Now also checks the user's transport input:

```python
has_flight = bool(user_profile.get("departure_id")) or any(k in transport for k in ("flight", "fly", "plane", "飞机"))
```

Flight cost is now correctly included in the budget estimate when the user chooses flight transport.

### Single-amount Budget Input (`agent3_planning.py`)

`_parse_budget_range` already handles a single number (e.g., `1000`) by treating it as the maximum: `(0.0, 1000.0)`. Budget caps are applied as:
- Hotel target: 50% of `budget_max` per day
- Attraction cap: 30% of `budget_max` per day

Note: `budget_min` is extracted but currently unused — only the upper bound is enforced.

## Changelog 25/4 02:00 From ECHO

### Flight & Restaurant Scoring (`agent3_planning.py`, `agent3_fetcher.py`, `agent3_finalizer.py`)

**New scoring functions:**

`_score_flight(flight, budget_max, adults)` — scores 0-100:
- Price score (50 pts): how affordable vs 40% of total budget per adult
- Duration score (50 pts): shorter is better, 0 pts at ≥360 min

`_score_restaurant_candidate(it, dist)` — scores 0-100, combining:
- **Gaode** (POI): distance penalty (up to -20 pts), pet-friendly bonus (+15 pts)
- **SerpAPI** (`restaurants_env`): rating bonus (up to +20 pts), price level vs daily food budget (±20 pts), matched by name

Restaurants now use `_score_restaurant_candidate` in `filter_and_score_candidates` instead of the generic fallback scorer.

Flight suggestions in `agent3_fetcher.py` are now scored and sorted best-first. Restaurant suggestions are also extracted, scored, and added to the fast response under `restaurant_suggestions`.

`agent3_finalizer.py` merge keys updated to include `restaurant_suggestions`.

### Bilingual Category Detection (`agent3_planning.py`)

POI category flags now handle both English and Chinese category names from Gaode:

| Category | English | Chinese |
|---|---|---|
| Hospital | `hospital` | `医院` |
| Attraction | `attraction/s` | `景点` |
| Hotel | `hotel` | `酒店`, `住宿` |
| Restaurant | `restaurant` | `餐厅`, `餐饮` |

### Flight Budget Fix (`agent3_planning.py`)

`has_flight` now also triggers from user transport input ("flight", "fly", "plane", "飞机"), not just `departure_id`. Flight cost is correctly included in budget when user chooses flight transport.

## Changelog 25/4 03:00 From ECHO

### Single Budget-Fitted Itinerary (`agent3_planning.py`)

Replaced the three-tier (Premium/Comfort/Economy) itinerary generation with a single "Recommended" plan that fits within the user's budget range:
- Hotel nightly cost uses live SerpAPI price if available, else scales to 50% of daily budget
- Meal/pet costs scale with hotel price level (no fixed tiers)
- Number of attractions per day adjusts to fit remaining attraction budget
- Output uses `"option": "Recommended"` with `budget_range` showing the user's input

### Flight Details in Suggestions (`agent3_fetcher.py`)

Flight suggestions now include `flight_number` and `airplane` type from SerpAPI response, e.g.:
```json
{"airline": "Hainan", "flight_number": "HU 7602", "airplane": "Airbus A330", "departure": "2026-05-01 08:20", "arrival": "2026-05-01 10:40", "duration_min": 140, "price": 5016, "score": 72}
```

### Departure City & Pet Weight Input (`main.py`, `agent1_orchestrator.py`)

New inputs added to pre-trip onboarding (both branches), in order:
1. Departure city → auto-mapped to IATA code via `_CITY_IATA` lookup for flight search
2. Pet weight (kg) → passed to LLM context for weight-based restriction advice (e.g., airline cabin limits)

`pet_weight` and `departure` are copied from `trip_context` into `user_profile` and saved to user slots each session (in-memory only, not persisted to Cosmos DB).

### Budget Estimate Always Shown (`agent1_orchestrator.py`)

Both pre_trip and trip_companion system prompts now explicitly instruct the LLM to always include the budget estimate breakdown whenever a plan or replan is presented.


### Departure City in LLM Context (`agent1_orchestrator.py`)

`Departure city` is now included in both `pre_trip` and `trip_companion` context blocks sent to the LLM, so the agent no longer asks the user for departure information that was already provided.

### Arrival IATA Mapping (`agent1_orchestrator.py`)

The destination city is now also mapped to an IATA code (`arrival_id`) using the same `_CITY_IATA` lookup as departure. This was the missing piece preventing live flight data from being fetched — `agent2_retrieval` requires both `departure_id` and `arrival_id` to call SerpAPI Google Flights.


### Structured Plan Output (`agent1_orchestrator.py`)

Both `pre_trip` and `trip_companion` system prompts now enforce a mandatory output structure for every plan/replan:
1. **Hotel recommendation** — highest-scored candidate, name + price + reason (never omitted)
2. **Flight suggestion** — airline, flight number, departure/arrival times, price (only when user chose flight transport; mandatory if so)
3. **Daily itinerary** — for each day: 2-3 restaurant suggestions, 1-2 attraction suggestions, transport directions between stops
4. **Budget estimate breakdown** — always shown
5. **Key risks** — rules, weather, pet weight restrictions

## Changelog 25/4 10:30 From Lizabel
- Session Memory: No Re-asking Known Fields
- Both pre_trip and trip_companion system prompts now explicitly instruct the LLM never to re-ask for "information already present in the context block (destination, date, departure city, trip days, "number of people/pets, budget, transport).

### Mid-chat Slot Extraction

- Values mentioned by the user in chat are now parsed and persisted immediately via analyze_message(). 

- "Previously, only values entered at startup were saved to trip_context and Cosmos DB user slots.

### Unified Single LLM Call for Message Analysis

- Replaced 3 sequential LLM calls (classify_intent + extract_slots_from_message + decide_agents) 

- with a single analyze_message() call returning {mode, domain, action, call_agent2, call_agent3, slots}. 
Saves ~3s per request.

## Changelog 25/4 11:30 From Lizabel

### Agent 3 Output Contract Alignment (`agent3_finalizer.py`, `agent1_orchestrator.py`)

- To keep runtime output consistent with the Prompt 8.0-lite design contract (without YAML runtime binding), Agent 3 now guarantees a stable set of output keys.

**What changed**

- Added contract-key synthesis in `agent3_finalizer.py` during final merge.
- Added orchestrator-side normalization in `agent1_orchestrator.py` so all execution paths are aligned (`pre_trip`, `trip_companion`, and no-planning fallback).

**Guaranteed keys (now always present)**

- `final_merged_result`
- `itineraries`
- `budget_summary`
- `pet_safety_reminders`
- `compliance_report`
- `qa_result`
- `planning_result`
- `adjusted_itinerary`
- `route_calc_report`
- `source_trace`

**Backward compatibility**

Existing runtime keys remain available and unchanged, including:

- `budget_estimate`
- `constraints`
- `notes`
- `hotel_zones`
- `scored_candidates`
- `hospital_recommendations`

This reduces schema drift risk and downstream breakage while preserving existing logic.

### Prompt 8.0 Lightweight Design Contract (`prompt/agent_prompt 8.0.yaml`)

`agent_prompt 8.0.yaml` was rewritten as a lightweight design-spec file (`Prompt 8.0-lite`) focused on:

- Agent 3 routing contract
- input/output contract
- hard constraints
- finalizer conflict policy
- scoring weights
- latency guardrails
- non-goals

Important: this YAML is design documentation only; runtime behavior remains code-authoritative in Python.


## Changelog 25/4 12:31 From Lizabel

### Smarter Intent Routing (`helper.py` — `analyze_message`)

`analyze_message` now makes accurate mode and agent routing decisions based on question type and date context.

**Date-aware mode classification**

Today's date is injected into the LLM prompt. When a message mentions a specific date:
- date > today → `pre_trip`
- date == today or date < today → `trip_companion`

Example: "take my pet to hospital on 2026-04-26" → `pre_trip`. "take my pet to hospital on 2026-04-25" → `trip_companion`.

**Explicit mode rules**

- `pre_trip`: planning a future trip ("plan a trip", "going to", future dates)
- `trip_companion`: real-time or current-day questions (weather today/tomorrow, nearby POIs, on-trip emergencies)
- `conversation`: general chat, greetings

**Agent routing rules**

- Weather-only questions → `call_agent2=true`, `call_agent3=false` (fetch data, skip full planning)
- Simple factual questions → `call_agent3=false`
- Full trip plan requests → `call_agent2=true`, `call_agent3=true`

## Changelog 25/4 16:00 Lizabel 

### Session Memory: No Re-asking Known Fields

Both  and  system prompts now explicitly instruct the LLM never to re-ask for information already present in the context block (destination, date, departure city, trip days, number of people/pets, budget, transport).

### Mid-chat Slot Extraction

Values mentioned by the user in chat are now parsed and persisted immediately via . Previously, only values entered at startup were saved to  and Cosmos DB user slots.

### Unified Single LLM Call for Message Analysis

Replaced 3 sequential LLM calls ( +  + ) with a single  call returning . Saves ~3s per request.

## Changelog 25/4 18:40 Lizabel

### Streaming Orchestration Upgrade (`agent1_orchestrator.py`)

When both Agent 2 and Agent 3 are needed, orchestration now starts Agent 3 fetcher early from partial retrieval data (via callback) while Agent 2 continues streaming the full payload.

- Added partial callback (`_on_partial`) flow using `agent2_retrieval_streaming(...)`
- Starts `agent3_fetcher.fetch(...)` immediately in a background thread
- Then runs `agent3_reasoner.refine(...)` on full retrieval data and merges via `agent3_finalizer.finalize(...)`
- Applied in both `pre_trip` and `trip_companion`, including streaming path

This improves perceived latency by showing an initial plan sooner and refining after full data arrives.

### Output Grounding And Name Policy (`agent1_orchestrator.py`)

System prompts were tightened to reduce hallucination and improve location naming consistency:

- Answer only the scope of the user request (avoid extra unrequested sections)
- Never ask again for fields already present in context
- Place names should prefer Chinese original name first, then English/pinyin in parentheses when available
- If a fact is not in context, explicitly say unavailable instead of inventing values

### Helper Reliability Hardening (`helper.py`)

- Added strict required-env validation for core runtime settings (Cosmos and Foundry endpoints, SerpAPI key)
- Normalized SerpAPI endpoint resolution (supports multiple env names; normalizes `/search` to `/search.json`)
- Added per-agent model env configuration (`AGENT1_MODEL`, `AGENT2_MODEL`, `AGENT3_MODEL`) with `OPENAI_DEFAULT_MODEL`
- `openai_chat(...)` now adapts token parameter for GPT-5 style deployments (`max_completion_tokens`)

### Reasoner Import Fallback (`agent3_reasoner.py`)

`agent3_reasoner.py` now includes a robust import fallback that inserts current working directory into `sys.path` before retrying `agent3_planning` import. This helps execution in environments where module resolution differs between direct script run and package-style run.

## Changelog 25/4 20:30 From ECHO

### Long-term Memory Fix: Conversation Mode Missing User Profile (`helper.py`, `agent1_orchestrator.py`)

`agent_response_conversation` previously received no `user_profile` or `trip_context`, so the LLM had no knowledge of the user's pet, destination, or trip details in `conversation` mode — causing it to re-ask questions already answered.

- Added `user_profile` and `trip_context` parameters to `agent_response_conversation`
- Injects pet type, breed, weight, trip city, dates, and transport into the system prompt with explicit instruction: "do NOT ask for this information again"
- Both non-streaming (`agent1_orchestrator`) and streaming call sites updated to pass these parameters

### Pet Hospital Search Fix (`agent2_gaode.py`)

The keyword POI search for hospitals used `"hospital"` (English), which returned general and military hospitals on Gaode Maps (a Chinese service).

- Changed keyword to `"宠物医院|动物医院|宠物诊所|兽医诊所|pet hospital|vet clinic"` — returns vet clinics and pet hospitals
- `around_hospitals` radius search already used correct Chinese keywords; now consistent with keyword search
- Added fallback: if no pet hospitals/clinics found, retries with `"医院|hospital"` (general hospitals) and returns up to 5 results

### POI Keyword Localization (`agent2_gaode.py`)

All Gaode POI keyword searches switched from English to Chinese for accurate results:

| Category | Before | After |
|---|---|---|
| Hotels | `pet friendly hotel` | `宠物友好酒店\|可带宠物酒店\|酒店` |
| Restaurants | `restaurant` | `餐厅\|饭店\|restaurant` |
| Attractions | `attraction` | `景点\|旅游景区\|attraction` |

### POI Fallback with Clear Labeling (`agent2_gaode.py`, `agent1_orchestrator.py`)

When pet-specific POI searches return no results, the agent now falls back to general results and clearly labels them in the LLM context:

- Hotels fallback: `"酒店|宾馆|hotel"`
- Restaurants fallback: `"餐厅|饭店"`
- Attractions fallback: `"景点|旅游"`
- Hospitals fallback: `"医院|hospital"`

Each fallback category is flagged with `_fallback=True` in `poi_results`. All three `poi_summary` build sites in `agent1_orchestrator.py` prepend `"[No pet-friendly options found, showing general results]"` when a fallback is active, so the LLM communicates this clearly to the user.

### Immediate Hospital Response (No Clarifying Questions) (`main.py`, `agent1_orchestrator.py`)

Previously the agent asked clarifying questions (severity, symptoms) before suggesting hospitals, adding unnecessary delay.

- Expanded `_EMERGENCY_KEYWORDS` in `main.py` to include: `sick`, `hospital`, `vet`, `clinic`, `hurt`, `injured`, `vomit`, `diarrhea`, `limp`, `pain`, and Chinese equivalents (`生病`, `医院`, `诊所`, `受伤`, `呕吐`, `腹泻`, `疼痛`)
- Added instruction to all 3 system prompts (EN + ZH): if user mentions pet is sick/hurt or asks for hospital/vet/clinic, immediately list nearest pet hospitals from context without asking any questions

### Hospital Recommendation Simplified (`agent1_orchestrator.py` — `_build_explanation_block`)

Removed severity-gated hospital display. Previously hospitals were only shown for `CRITICAL` or `HIGH` severity triage results.

- Always shows up to 3 pet hospital candidates when present, regardless of severity
- Removed `severity`, `strategy`, and `capability_score` from output — no triage classification shown to user
- Next steps default to "Visit the nearest recommended pet hospital or clinic" when candidates exist

### Cosmos DB Document ID Fix (`helper.py`)

Cosmos DB rejected document IDs containing `:` (illegal character), causing `[WARN] save_trip_plan exception: Id contains illegal chars`.

- `version_id`: `trip_plan_version:{user}:{city}:{date}:{uuid}` → `trip_plan_version_{user}_{city}_{date}_{uuid}`
- `canonical_id`: `trip_plan:{user}:{city}:{date}` → `trip_plan_{user}_{city}_{date}` (fixed in both save and load paths)

## Changelog 25/4 21:30 From ECHO

### Trip Plan Cache Now Stores Restaurants, Attractions, Hospitals (`helper.py`)

`_build_minimal_recs` previously only saved hotels, flights, itineraries, and budget. When users asked "suggest other restaurants", the agent had no cached data to reference.

Now persists:
- `restaurants` (up to 5) — from `scored_candidates.Restaurants` or `restaurant_suggestions`
- `attractions` (up to 5) — from `scored_candidates.Attractions`
- `hospitals` (up to 3) — from `hospital_recommendations.candidates`
- `budget_total` (single int) — replaces `budget_summary` dict; stores only `total_estimate`
- Hotels now correctly extracted from `scored_candidates.Hotels` when `recommendations["hotels"]` is empty

### POI Fallback Boolean TypeError Fixed (`agent2_gaode.py`, `agent3_planning.py`)

Storing `_fallback=True` flags inside `poi_results` caused `TypeError: 'bool' object is not iterable/subscriptable` in multiple places when the dict was iterated.

- `agent2_gaode.py` poi_details loop: added `if not isinstance(items, list): continue`
- `agent3_planning.py` `filter_and_score_candidates`: added `if not isinstance(items, list): continue`
- `agent3_planning.py` `_flatten_pois`: added `if not isinstance(items, list): continue`
- `agent1_orchestrator.py` all 3 poi_summary sites: already safe with `if not k.endswith("_fallback")`

### Strict Response Scope Rule (`agent1_orchestrator.py`)

Added `STRICT SCOPE RULE` to all 6 system prompts (EN + ZH): if the user asks only for hotels/restaurants/attractions, output only that category. Never add itinerary, budget, or risks unless the user explicitly asked for a full plan.


### Trip Plan Cache Slim Storage (`helper.py`)

Hotels and attractions were storing full raw Gaode POI metadata (40+ fields including photos, indoor_data, pcode, etc.), bloating Cosmos DB documents.

Added `_slim()` helper that extracts only essential fields before saving:
- Hotels: `id`, `name`, `address`, `location`, `tel`, `rating`, `price_level`, `pet_friendly`
- Restaurants/Attractions: `id`, `name`, `address`, `location`, `rating`, `pet_friendly`, `score`
- Hospitals: `id`, `name`, `address`, `location`, `tel`, `eta_minutes`, `capability_score`

### Itinerary Detail ID Fix (`helper.py`)

`trip_plan_itinerary_detail` document IDs used `:` separator, causing Cosmos DB illegal chars error.

- `trip_plan_itinerary:{user}:{city}:{date}:{uuid}:{idx}` → `trip_plan_itinerary_{user}_{city}_{date}_{uuid}_{idx}`

### Previous Plan Context Expanded (`agent1_orchestrator.py`)

When replanning, the previous plan reference context only included hotels and attractions — missing restaurants, hospitals, and flights. The LLM could re-suggest the same restaurants.

Now includes all categories with conditional display (hospitals/flights only shown if present):
- Previous Hotels, Restaurants, Attractions (always shown)
- Previous Hospitals, Flights (only if non-empty)
- Instruction changed from "compare and explain" to "do NOT suggest any of the above — suggest different options only"

## Changelog 25/4 22:00 From Echo

### Trip Plan Cache Merge on Partial Updates (`helper.py`)

When a user asked for only one category (e.g., "suggest other attractions"), `save_trip_plan` overwrote the full cached plan with the partial result — losing previously stored hotels, restaurants, and hospitals.

`_build_minimal_recs` now loads the existing `trip_plan_cache` doc before building the new record and uses its categories as fallback for any that are empty in the current result:
- If new result has no hotels → keep previous hotels
- If new result has no restaurants → keep previous restaurants
- If new result has no attractions → keep previous attractions
- If new result has no hospitals → keep previous hospitals
- If new result has no flights → keep previous flights

This ensures the cached plan always holds the full set of suggestions across partial update requests.

### Fuel & Parking Budget for Self-Drive (`agent3_planning.py`)

When the user selects car/self-drive transport ("car", "drive", "自驾", "开车"), the budget now includes:
- Fuel: ¥150/day (static estimate)
- Parking: ¥80/day (static estimate)

Both appear in the breakdown and `_format_budget` output, e.g.:
```
..., transport ¥320 [gaode], fuel ¥450 [static], parking ¥240 [static])
```
Only shown when non-zero (i.e., only for car transport).


## Changelog 25/4 23:00 From ECHO

### Emergency Button for Older Users (`main.py`)

Added an `e` / `emergency` input option that is shown only when `user_profile["is_older_user"]` is `True`.

**Trigger points**
- At the `y/n/h` resume prompt — typing `e` triggers emergency and exits the loop
- During the main chat loop — typing `e` triggers emergency and continues the loop

**What happens on `e`**
1. Prints emergency numbers:
   - 📞 120 (medical / 急救)
   - 📞 110 (police / 警察)
   - 📞 112 (international)
2. Immediately calls `agent1_orchestrator_streaming` with a hospital search prompt, so the agent finds and recommends real nearby hospitals with addresses and phone numbers using Gaode POI tools.

**Activation**

Set `"is_older_user": True` in the user's Cosmos DB profile to enable the feature.

### Itinerary Day-Level Merge on Partial Updates (`helper.py`)

When a user asked to change only day 2, `save_trip_plan` replaced the entire itinerary with only the updated day — losing day 1 and day 3.

Before writing itinerary detail docs, `save_trip_plan` now loads the previous cached itinerary and merges `day_plans` by day index:
- New days overwrite the matching previous day
- Previous days not in the new result are kept unchanged

This preserves the full multi-day itinerary when only a single day is replanned.

## Changelog 25/4 23:30 From ECHO

### Removed Decision Log (`agent1_orchestrator.py`, `helper.py`)

`decision_log` was a write-only audit trail with no consumer — nothing ever read it back.

- Removed all 3 `save_decision()` call sites from `agent1_orchestrator.py`
- Removed `save_decision` import from `agent1_orchestrator.py`
- Deleted `save_decision()` function from `helper.py`

Reduces unnecessary Cosmos DB writes on every request.

## Changelog 26/4 From ECHO and Lizabel

### Hospital Address & Phone in LLM Context (`agent1_orchestrator.py`)

All three `poi_summary` build sites now include address and phone for hospital entries instead of just the name.

- Added `_poi_label(p, k)` helper in each block: for `Hospitals` and `PetHospitalsNearby`, returns `"{name} | Address: {addr} | Phone: {phone}"`
- Phone lookup chain: `tel` → `phone` → `Phone` → `Contact` → `contact` (covers both Gaode and Cosmos DB field names)
- Applies to `pre_trip`, `trip_companion`, and streaming paths

### Hospital Category Filtering by Pet Type (`agent2_gaode.py`)

Cosmos DB hospitals are now filtered by the user's pet type before being passed to the LLM.

- `gaode_subagent` accepts a new `pet_type` parameter
- Filters `cosmos_hospitals` by the `categories` field (`"cat"`, `"dog"`, `"cat and dog"`)
- A dog owner no longer receives cat-only hospitals; a cat owner no longer receives dog-only hospitals
- Records with no `categories` field are kept (no info = include)

### Cosmos DB Contact Field Propagated to Gaode Results (`agent2_gaode.py`)

`PetHospitalsNearby` results come from Gaode around-search and lack the `contact` phone field stored in Cosmos DB.

- After building `PetHospitalsNearby`, the code merges phone numbers from `cosmos_hospitals` by name match (exact → substring → 4-char prefix) and address match
- Remaining entries without a phone are enriched via Gaode POI detail API (`_fetch_tel`)
- `enrich_poi_candidates` in `helper.py` also checks `raw.get("contact")` and `it.get("contact")` when building the `tel` field

### Pet Type Passed to Gaode Subagent (`agent2_retrieval.py`)

Both `agent2_retrieval` and `agent2_retrieval_streaming` now pass `pet_type=user_profile.get("pet_type")` to `gaode_subagent`, enabling the category filter above.

### Trip Plan Cache Uses Correct Hotel Source (`helper.py`)

`_build_minimal_recs` now uses `retrieval_data["pois"]["Hotels"]` as the primary hotel source, so the cached plan stores the hotels actually shown to the user rather than a different internal list.
