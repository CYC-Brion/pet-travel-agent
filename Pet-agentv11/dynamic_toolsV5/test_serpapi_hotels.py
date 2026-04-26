import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

endpoint = os.getenv("SERPAPI_GOOGLE_HOTELS_ENDPOINT")
api_key = os.getenv("SERPAPI_API_KEY")

params = {
    "engine": "google_hotels",
    "q": "Shanghai hotel",
    "check_in_date": "2026-05-01",
    "check_out_date": "2026-05-03",
    "adults": 2,
    "currency": "CNY",
    "sort_by": 8,
    "no_cache": "true",
    "api_key": api_key
}

response = requests.get(endpoint, params=params)
print(f"Status code: {response.status_code}")

with open("serpapi_hotels_response.json", "w", encoding="utf-8") as f:
    json.dump(response.json(), f, ensure_ascii=False, indent=2)

print("Response saved to serpapi_hotels_response.json")

result = response.json()
properties = result.get("properties", [])
print(f"Number of properties returned: {len(properties)}")