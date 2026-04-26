import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

endpoint = os.getenv("SERPAPI_GOOGLE_FLIGHTS_ENDPOINT")
api_key = os.getenv("SERPAPI_API_KEY")

params = {
    "engine": "google_flights",
    "departure_id": "SHA",
    "arrival_id": "PEK",
    "outbound_date": "2026-05-01",
    "return_date": "2026-05-03",
    "adults": 1,
    "currency": "CNY",
    "no_cache": "true",
    "api_key": api_key
}

response = requests.get(endpoint, params=params)
print(f"Status code: {response.status_code}")

with open("serpapi_flights_response.json", "w", encoding="utf-8") as f:
    json.dump(response.json(), f, ensure_ascii=False, indent=2)

print("Response saved to serpapi_flights_response.json")

result = response.json()
flights = result.get("best_flights", [])
print(f"Number of flights returned: {len(flights)}")