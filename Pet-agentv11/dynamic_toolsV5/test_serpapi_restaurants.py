import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

endpoint = os.getenv("SERPAPI_GOOGLE_RESTAURANTS_ENDPOINT")
api_key = os.getenv("SERPAPI_API_KEY")

params = {
    "engine": "google_maps",
    "q": "restaurant near Bund, Shanghai",
    "hl": "zh-CN",
    "gl": "cn",
    "no_cache": "true",
    "api_key": api_key
}

response = requests.get(endpoint, params=params)
print(f"Status code: {response.status_code}")

with open("serpapi_restaurants_response.json", "w", encoding="utf-8") as f:
    json.dump(response.json(), f, ensure_ascii=False, indent=2)

print("Response saved to serpapi_restaurants_response.json")

result = response.json()
places = result.get("local_results", [])
print(f"Number of restaurants returned: {len(places)}")