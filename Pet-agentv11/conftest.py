import pytest


@pytest.fixture
def sample_user_profile():
    return {
        "user_name": "testuser",
        "pet_type": "dog",
        "breed": "Labrador",
        "budget": "comfort",
        "preferences": "pet-friendly"
    }


@pytest.fixture(autouse=True)
def mock_external_apis(monkeypatch):
    """Monkeypatch external API and Cosmos/LLM calls used by agent2_retrieval for deterministic tests."""
    def ok(data):
        return {"ok": True, "data": data}

    # qweather
    monkeypatch.setattr('helper.fetch_qweather_now', lambda city: ok({"now": {"temp": 25}}))
    monkeypatch.setattr('helper.fetch_qweather_forecast', lambda city, days=3: ok({"forecast": []}))
    monkeypatch.setattr('helper.fetch_qweather_minutely', lambda city: ok({"minutely": {}}))
    monkeypatch.setattr('helper.fetch_qweather_indices', lambda city, days, index_type: ok([]))

    # gaode geocode / poi
    monkeypatch.setattr('helper.fetch_gaode_geocode', lambda city: ok({"items": [{"location": "116.397389,39.908722"}]}))
    monkeypatch.setattr('helper.fetch_gaode_poi_keyword', lambda keyword, city=None: ok({"pois": [{"id": "p1", "name": "Hotel A", "location": "116.397389,39.908722"}]}))
    monkeypatch.setattr('helper.fetch_gaode_poi_around', lambda loc, keywords, radius=5000: ok({"pois": [{"id": "h1", "name": "Pet Hospital", "location": loc}]}))
    monkeypatch.setattr('helper.fetch_gaode_poi_detail', lambda poi_id: ok({"detail": {"id": poi_id, "name": "Detail"}}))

    # routes / distance / matrix
    monkeypatch.setattr('helper.fetch_gaode_route_driving', lambda o, d: ok({"route": "driving"}))
    monkeypatch.setattr('helper.fetch_gaode_route_walking', lambda o, d: ok({"route": "walking"}))
    monkeypatch.setattr('helper.fetch_gaode_route_bicycling', lambda o, d: ok({"route": "bicycling"}))
    monkeypatch.setattr('helper.fetch_gaode_route_transit', lambda o, d, city=None: ok({"route": "transit"}))
    monkeypatch.setattr('helper.fetch_gaode_distance', lambda origins, destinations, mode="driving": ok({"results": []}))
    monkeypatch.setattr('helper.fetch_gaode_route_matrix', lambda origins, destinations, mode="driving": ok({"matrix": []}))
    monkeypatch.setattr('helper.fetch_gaode_traffic_live', lambda loc: ok({"traffic": {}}))

    # cosmos queries
    monkeypatch.setattr('helper.cosmos_query_rules', lambda: [{"rule_name": "r1"}])
    monkeypatch.setattr('helper.cosmos_query_agent_policy', lambda: [{"policy": "p1"}])
    monkeypatch.setattr('helper.cosmos_query_dog_profile', lambda breed: [{"breed_name": breed, "notes": "friendly"}])
    monkeypatch.setattr('helper.cosmos_query_cat_profile', lambda breed: [])

    # LLM rule evaluator: mock helper.openai_client.chat.completions.create
    import helper

    class DummyMsg:
        def __init__(self, content):
            self.content = content

    class DummyChoice:
        def __init__(self, content):
            self.message = DummyMsg(content)

    class DummyResp:
        def __init__(self, content):
            self.choices = [DummyChoice(content)]

    def fake_completion(*args, **kwargs):
        # Return a JSON string the rule_evaluator expects
        return DummyResp('{"result": "PASS", "constraints": {"max_weight": "10kg"}, "explanation": "Allowed"}')

    monkeypatch.setattr(helper.openai_client.chat.completions, 'create', fake_completion)

    yield
