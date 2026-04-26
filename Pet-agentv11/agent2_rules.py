import json
import os
from helper import (
    openai_chat,
    cosmos_query_rules,
    cosmos_query_agent_policy,
    cosmos_query_pet_travel_experience,
    cosmos_query_dog_profile,
    cosmos_query_cat_profile,
)


def rule_evaluator(profile: dict, destination: str, rules_list=None, static_text=None):
    """2A — fetches all static/policy data internally, then runs LLM rules interpretation."""
    # Fetch DB data internally
    rules = rules_list if rules_list is not None else cosmos_query_rules()
    agent_policy = cosmos_query_agent_policy()
    pet_travel_experience = cosmos_query_pet_travel_experience(destination)

    pet_type = (profile or {}).get("pet_type")
    breed = (profile or {}).get("breed")
    if pet_type == "dog":
        breed_info = cosmos_query_dog_profile(breed)
    elif pet_type == "cat":
        breed_info = cosmos_query_cat_profile(breed)
    else:
        breed_info = []

    if static_text is None:
        static_text = json.dumps(
            {"rules": rules, "agent_policy": agent_policy, "pet_travel_experience": pet_travel_experience},
            ensure_ascii=False,
        )

    prompt = (
        "You are a rules interpreter for pet travel.\n"
        "Given user profile and a set of rules/policies, output JSON with keys: "
        "result (PASS/FAIL/CONDITIONAL), constraints (object), explanation (short human text).\n"
        "Return only valid JSON.\n"
    )
    user_block = {
        "user_profile": profile,
        "destination": destination,
        "rules_count": len(rules),
    }
    try:
        completion = openai_chat(
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": json.dumps(user_block, ensure_ascii=False) + "\n\nSTATIC_RULES:\n" + static_text[:8000]},
            ],
            model=os.getenv("AGENT2_MODEL", "gpt-4.1-mini"),
            max_tokens=600,
        )
        raw = completion.choices[0].message.content
        try:
            parsed = json.loads(raw)
            return {
                "result": parsed.get("result") or parsed.get("status") or "CONDITIONAL",
                "constraints": parsed.get("constraints") or {},
                "explanation": parsed.get("explanation") or parsed.get("reason") or "",
                "raw": parsed,
                "rules": rules,
                "agent_policy": agent_policy,
                "pet_travel_experience": pet_travel_experience,
                "breed_info": breed_info,
            }
        except Exception:
            return {"result": "CONDITIONAL", "constraints": {}, "explanation": raw[:500], "raw": raw,
                    "rules": rules, "agent_policy": agent_policy, "pet_travel_experience": pet_travel_experience, "breed_info": breed_info}
    except Exception as exc:
        return {"result": "CONDITIONAL", "constraints": {}, "explanation": f"rule interpreter failed: {exc}", "raw": None,
                "rules": rules, "agent_policy": agent_policy, "pet_travel_experience": pet_travel_experience, "breed_info": breed_info}
