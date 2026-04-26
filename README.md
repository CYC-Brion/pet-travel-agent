# Pet Travel Planning AI Agent

> A pet-friendly trip planning system that generates personalized travel itineraries with pet-specific constraints including hotels, flights, restaurants, weather, routes, and emergency vet recommendations.

## Project Structure

```
BRION/
├── Pet-agentv11/          # Python Backend (Multi-Agent AI System)
├── front_end/             # React Frontend
├── group_info/            # Product Documentation (Chinese)
├── FRONTEND_PLAN.md       # Frontend Architecture Plan
├── schema_confirm.md      # API Schema Contract
└── front_back_plan.md     # Backend Integration Plan
```

---

## System Overview

BRION is a **携宠出行AI规划助手** (Pet Travel AI Assistant) that helps pet owners plan trips with their pets. The system uses a multi-agent architecture to retrieve real-time data and generate comprehensive trip plans.

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **对话入口** | Intent recognition, task routing, slot extraction |
| **用户画像** | User/pet profile, historical trip recovery |
| **规则引擎** | Pet policies for airlines, trains, hotels |
| **POI 检索** | Hotels, restaurants, attractions, hospitals |
| **天气查询** | Real-time weather, forecasts, rain alerts |
| **行程规划** | Multi-day itinerary with budget optimization |
| **应急服务** | Pet hospital search, emergency replanning |
| **地图路线** | Route calculation, distance matrix |

---

## Backend - Pet-agentv11

### Architecture

```
Agent 1 (Orchestrator)
    │
    ├── Agent 2 (Retrieval)
    │     ├── SerpAPI      → Hotels, Flights, Restaurants, Attractions
    │     ├── QWeather     → Weather, Forecast, Rain Alerts
    │     ├── Gaode/Amap   → Geocoding, POI, Routing
    │     └── Rules Engine → Pet Policy Evaluation
    │
    └── Agent 3 (Planning)
          ├── Fetcher      → Deterministic scoring, itinerary building
          ├── Reasoner     → LLM-enhanced constraint extraction
          └── Finalizer    → Result synthesis
```

### Key Files

| File | Role |
|------|------|
| `api.py` | FastAPI server with CORS for frontend |
| `agent1_orchestrator.py` | Top-level orchestration, streaming |
| `agent2_retrieval.py` | Data retrieval coordination |
| `agent3_planning.py` | Core planning logic, scoring |
| `helper.py` | Cosmos DB persistence, utilities |
| `main.py` | CLI entry point |

### Tech Stack

- **LLM**: OpenAI GPT
- **APIs**: QWeather, SerpAPI, Gaode/Amap, Azure Cosmos DB
- **Framework**: Python with FastAPI

### Setup

```bash
cd Pet-agentv11
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

# Configure .env with API keys
GAODE_API_KEY=
QWEATHER_API_KEY=
SERPAPI_KEY=
OPENAI_API_KEY=
COSMOS_ENDPOINT=
COSMOS_KEY=

# Run API server
python api.py

# Or run CLI
python main.py
```

---

## Frontend - front_end

React-based user interface for the trip planning system.

```bash
cd front_end
npm install
npm run dev
```

See [front_end/README.md](front_end/README.md) for details.

---

## Documentation

| Document | Content |
|----------|---------|
| `schema_confirm.md` | API data contract between frontend and backend |
| `FRONTEND_PLAN.md` | Frontend architecture and routing design |
| `front_back_plan.md` | Backend API and integration plan |
| `group_info/产品需求.md` | Product requirements specification |
| `Pet-agentv11/README.md` | Detailed backend changelog and setup |

---

## Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │ ←→  │     API      │ ←→  │  Multi-Agent │
│   (React)    │     │   (FastAPI)  │     │   (Python)   │
└──────────────┘     └──────────────┘     └──────────────┘
                            │                    │
                            │              ┌─────┴─────┐
                            │              │  Cosmos DB│
                            │              └───────────┘
                            ▼
                     ┌──────────────┐
                     │   External    │
                     │   APIs        │
                     └──────────────┘
```

---

## License

This project was developed as a group project for Applied LLMs course.
