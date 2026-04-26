import os
from datetime import datetime
from helper import (
    save_message, load_recent_conversation, detect_language,
    analyze_message, agent_response_conversation, openai_chat, openai_chat_stream,
    update_user_locale_preferences, save_user_slot, load_user_slots, safe_input,
    save_trip_plan, load_trip_plan, format_cached_plan_response
)
try:
    from agent2_retrieval import agent2_retrieval, agent2_retrieval_streaming
except Exception:
    agent2_retrieval = None
    agent2_retrieval_streaming = None

from agent3_planning import _format_budget



def _build_explanation_block(recommendations, retrieval_data):
    """Convert structured Agent 3 results into natural-language explanation blocks for the LLM system prompt."""
    lines = []

    # Rule explanation
    rules_eval = retrieval_data.get("rules_evaluation") or {}
    if rules_eval.get("result") == "FAIL":
        lines.append(f"RULE FAILURE: {rules_eval.get('explanation', 'Pet travel not permitted under current rules.')}")
    elif rules_eval.get("explanation"):
        lines.append(f"Rules: {rules_eval['explanation']}")

    # Itinerary explanation
    itineraries = recommendations.get("itineraries") or []
    for plan in itineraries:
        tier = plan.get("option", "")
        cost = plan.get("total_cost_cny", "?")
        hours = plan.get("total_hours", "?")
        count = plan.get("attractions_count", "?")
        lines.append(f"{tier} plan: {count} attractions, {hours}h total, ¥{cost} estimated cost.")

    # Hotel zone explanation
    bundles = (recommendations.get("hotel_zones") or {}).get("bundles") or []
    for b in bundles[:2]:
        zone = b.get("zone", "")
        km = b.get("commute_km_to_attractions")
        rec = b.get("recommended") or {}
        comfort = (rec.get("Comfort") or [{}])[0].get("name", "")
        if comfort:
            lines.append(f"Hotel zone {zone} ({km}km from attractions): recommended {comfort} for Comfort tier.")

    # Filtered attractions explanation
    scored = recommendations.get("scored_candidates") or {}
    filtered = [c for c in scored.get("Attractions", []) if c.get("filtered")]
    for c in filtered[:3]:
        lines.append(f"Excluded '{c.get('name')}': {c.get('filter_reason', 'does not meet constraints')}.")

    # Hospital recommendation
    hosp = recommendations.get("hospital_recommendations")
    if hosp:
        candidates = hosp.get("candidates") or []
        for h in candidates[:3]:
            lines.append(f"  Pet Hospital: {h.get('name')}, ETA {h.get('eta_minutes')}min.")

    # Key risks
    risks = []
    constraints = recommendations.get("constraints") or {}
    avoid = (constraints.get("weather") or {}).get("avoid_conditions", [])
    if "rain" in avoid:
        risks.append("Rain expected — outdoor venues may be unsuitable.")
    if "high_temperature" in avoid:
        risks.append("High temperature — limit outdoor activity duration.")
    if rules_eval.get("result") == "CONDITIONAL":
        risks.append(f"Conditional travel: {rules_eval.get('explanation', '')}")

    # Document expiry warnings
    docs = retrieval_data.get("documents") or {}
    for doc_name, doc_info in docs.items():
        if isinstance(doc_info, dict) and doc_info.get("expiry_warning"):
            risks.append(f"Document expiry: {doc_name} — {doc_info['expiry_warning']}")

    # Medication schedule conflicts
    med_conflicts = recommendations.get("medication_conflicts") or []
    for conflict in med_conflicts:
        risks.append(f"Medication conflict: {conflict}")

    if risks:
        lines.append("Key risks: " + " | ".join(risks))

    # Actionable next steps
    next_steps = recommendations.get("next_steps") or []
    if not next_steps:
        if hosp and hosp.get("candidates"):
            next_steps.append("Visit the nearest recommended pet hospital or clinic.")
        elif itineraries:
            next_steps.append("Confirm hotel booking for recommended zone.")
            next_steps.append("Check pet entry documents before departure.")
    if next_steps:
        lines.append("Next steps: " + " | ".join(next_steps))

    return "\n".join(lines)


def _check_consistency(retrieval_data, recommendations):
    """Detect conflicts between Agent 2 retrieval data and Agent 3 recommendations."""
    conflicts = []

    # Check hotel pet fee vs user budget
    budget = None
    try:
        budget = float((recommendations.get("constraints") or {}).get("budget") or 0)
    except Exception:
        pass
    bundles = (recommendations.get("hotel_zones") or {}).get("bundles") or []
    for b in bundles:
        for tier, hotels in (b.get("recommended") or {}).items():
            for h in (hotels or []):
                fee = h.get("pet_fee")
                if budget and fee and fee > budget:
                    conflicts.append(f"Hotel '{h.get('name')}' pet fee ¥{fee} exceeds budget ¥{budget}.")

    # Check rules evaluation vs itinerary existence
    rules_eval = retrieval_data.get("rules_evaluation") or {}
    if rules_eval.get("result") == "FAIL" and recommendations.get("itineraries"):
        conflicts.append("Rules evaluation FAILED but itineraries were generated — verify compliance before travel.")

    # Check weather avoid conditions vs outdoor attractions in itinerary
    avoid = ((recommendations.get("constraints") or {}).get("weather") or {}).get("avoid_conditions", [])
    if avoid:
        for plan in (recommendations.get("itineraries") or []):
            for stop in (plan.get("stops") or []):
                if stop.get("type") == "outdoor":
                    conflicts.append(f"Outdoor stop '{stop.get('name')}' scheduled despite weather constraint: {avoid}.")
                    break

    return conflicts


def _align_agent3_output_contract(recommendations):
    """Ensure Prompt 8.0-lite output keys exist without breaking legacy key usage."""
    rec = recommendations if isinstance(recommendations, dict) else {}

    # Keep legacy key while exposing new key
    budget_est = rec.get("budget_estimate")
    if isinstance(budget_est, dict):
        budget_summary = budget_est
    elif isinstance(budget_est, (int, float)):
        budget_summary = {"total_estimate": float(budget_est), "breakdown": {}, "transport_source": "unknown"}
    else:
        budget_summary = {"total_estimate": 0, "breakdown": {}, "transport_source": "unknown"}

    pet_safety = rec.get("pet_safety_reminders")
    if not isinstance(pet_safety, list):
        pet_safety = [
            "Use leash/harness at outdoor venues.",
            "Provide water and rest every 2-3 hours.",
        ]

    compliance = rec.get("compliance_report")
    if not isinstance(compliance, dict):
        compliance = {
            "status": "pass" if rec.get("itineraries") else "conditional",
            "reasons": [] if rec.get("itineraries") else ["No itineraries generated."],
        }

    rec.setdefault("final_merged_result", {
        "itineraries": rec.get("itineraries") or [],
        "budget_summary": budget_summary,
        "notes": rec.get("notes") or [],
        "compliance_report": compliance,
    })
    rec["budget_summary"] = budget_summary
    rec["pet_safety_reminders"] = pet_safety
    rec["compliance_report"] = compliance

    rec.setdefault("qa_result", {"branch": "3A", "available": False})
    rec.setdefault("planning_result", {"branch": "3B", "available": bool(rec.get("itineraries"))})
    rec.setdefault("adjusted_itinerary", (rec.get("itineraries") or [None])[0])
    rec.setdefault("route_calc_report", {
        "itinerary_count": len(rec.get("itineraries") or []),
        "has_constraints": bool(rec.get("constraints")),
    })
    rec.setdefault("source_trace", [])
    return rec


def agent1_orchestrator(session_id, user_name, user_prompt, trip_context, user_profile):
    # Save user message
    save_message(session_id, "user", user_prompt, user_name)

    # Detect user language and store in context
    lang = detect_language(user_prompt)
    trip_context.setdefault("lang", lang)

    # Load last 10 turns
    history = load_recent_conversation(session_id, user_name, limit=10)

    # Load persistent user slots and merge into trip_context
    try:
        user_slots = load_user_slots(user_name) or {}
        if os.getenv("MEMORY_DEBUG") == "1":
            print(f"[MEMORY DEBUG] agent1_orchestrator: loaded user_slots={user_slots}")
        for k, v in user_slots.items():
            if not trip_context.get(k):
                trip_context[k] = v
    except Exception:
        user_slots = {}

    # Restore full pet profile fields from memory into user_profile
    for field in ("age", "weight", "health_status", "vaccination_records", "medical_history"):
        if not user_profile.get(field) and user_slots.get(field):
            user_profile[field] = user_slots[field]

    # Single LLM call: intent + slot extraction + agent routing
    analysis = analyze_message(user_prompt, lang)
    intent = analysis
    mode = trip_context.pop("initial_mode", None) or analysis.get("mode", "trip_companion")
    action = analysis.get("action", "other")

    # Persist any slots extracted from this message
    for k, v in analysis.get("slots", {}).items():
        if v and not trip_context.get(k):
            trip_context[k] = v
            try:
                save_user_slot(user_name, k, v)
            except Exception:
                pass

    reply = None

    # Load cached plan for replanning scenarios (modify, change params, etc.)
    previous_plan = None
    if action in ("plan", "compare", "modify", "replace"):
        # Try to load most recent plan to use as reference context
        try:
            previous_plan = load_trip_plan(user_name)
            if previous_plan and os.getenv("MEMORY_DEBUG") == "1":
                print(f"[MEMORY DEBUG] Loaded previous plan for replanning context: {previous_plan.get('city')}")
        except Exception as exc:
            if os.getenv("MEMORY_DEBUG") == "1":
                print(f"[MEMORY DEBUG] Failed to load previous plan for context: {exc}")
            previous_plan = None

    # Handle recall action: user is asking to see a previous trip plan
    if action == "recall":
        # Try to load the most recent trip plan
        cached_plan = load_trip_plan(user_name)
        if cached_plan:
            formatted = format_cached_plan_response(cached_plan, lang)
            reply = formatted
            save_message(session_id, "user", user_prompt, user_name)
            save_message(session_id, "assistant", reply, user_name)
            return reply
        else:
            no_plan_msg = "I don't have any previous trip plans saved. Would you like me to create a new plan?" if lang != 'zh' else "我没有保存任何之前的旅行计划。您想让我创建一个新计划吗？"
            reply = no_plan_msg
            save_message(session_id, "user", user_prompt, user_name)
            save_message(session_id, "assistant", reply, user_name)
            return reply

    if mode == "pre_trip":
        city = trip_context.get("city", "")
        travel_date = trip_context.get("date", "")
        raw_days = trip_context.get("days", 1)

        for key in ("num_people", "num_pets", "budget", "transport", "pet_weight", "departure"):
            if trip_context.get(key):
                user_profile[key] = trip_context[key]
                try:
                    save_user_slot(user_name, key, trip_context[key])
                except Exception:
                    pass

        # Map departure city name to IATA code for flight search
        _CITY_IATA = {
            "shanghai": "SHA", "上海": "SHA", "pudong": "PVG",
            "beijing": "PEK", "北京": "PEK",
            "guangzhou": "CAN", "广州": "CAN",
            "shenzhen": "SZX", "深圳": "SZX",
            "chengdu": "CTU", "成都": "CTU",
            "hangzhou": "HGH", "杭州": "HGH",
            "chongqing": "CKG", "重庆": "CKG",
            "xiamen": "XMN", "厦门": "XMN",
            "wuhan": "WUH", "武汉": "WUH",
            "xian": "XIY", "西安": "XIY",
        }
        dep = str(trip_context.get("departure") or "").strip().lower()
        if dep and not trip_context.get("departure_id"):
            iata = _CITY_IATA.get(dep) or _CITY_IATA.get(dep.replace(" ", ""))
            if iata:
                trip_context["departure_id"] = iata

        arr = str(city or "").strip().lower()
        if arr and not trip_context.get("arrival_id"):
            iata = _CITY_IATA.get(arr) or _CITY_IATA.get(arr.replace(" ", ""))
            if iata:
                trip_context["arrival_id"] = iata

        # Save city, date, days to user slots
        for key, val in (("city", city), ("date", travel_date), ("days", raw_days)):
            try:
                save_user_slot(user_name, key, val)
            except Exception:
                pass

        # Ensure trip_days is an int for downstream calls
        try:
            trip_days = int(trip_context.get("days") or 1)
        except Exception:
            trip_days = 1

        # Decide which agents to run for this request
        decision = {"call_agent2": analysis.get("call_agent2", True), "call_agent3": analysis.get("call_agent3", True)}
        call_agent2 = decision.get("call_agent2", True)
        call_agent3 = decision.get("call_agent3", True)
        parallel = decision.get("parallel", False)
        needs_retrieval = decision.get("needs_retrieval", True)

        # persist user locale
        update_user_locale_preferences(user_name, locale=lang)

        retrieval_data = {}
        recommendations = {}
        _fast_label = "Agent (quick):" if lang != "zh" else "助手（快速）："

        if call_agent2 and call_agent3:
            from agent3_planning import agent3_planning
            from agent3_fetcher import fetch as _fetch
            from agent3_finalizer import finalize as _finalize
            from concurrent.futures import ThreadPoolExecutor

            _fetcher_future = [None]

            def _on_partial(partial_data):
                # Start fetcher immediately with partial data while serpapi still runs
                _fetcher_future[0] = ThreadPoolExecutor(max_workers=1).submit(
                    _fetch, user_profile, partial_data, int(trip_days), lang
                )

            full_retrieval = agent2_retrieval_streaming(user_profile, city, trip_context, _on_partial)
            retrieval_data = full_retrieval

            fast_out = _fetcher_future[0].result() if _fetcher_future[0] else None
            if fast_out:
                print(f"\n{_fast_label} Initial plan ready. Refining details...\n")

            from agent3_reasoner import refine as _refine
            refined_out = _refine({"user_profile": user_profile, "retrieval_data": full_retrieval, "trip_days": int(trip_days), "lang": lang})
            recommendations = _finalize(fast_out, refined_out).get("final", (fast_out or {}).get("fast_response", {}))
        elif call_agent2:
            retrieval_data = agent2_retrieval(user_profile, city, trip_context)
        elif call_agent3:
            from agent3_planning import agent3_planning
            recommendations = agent3_planning(user_profile, retrieval_data, int(trip_days), lang)
        if not call_agent3:
            recommendations = {"routes": [], "budget_estimate": {"total_estimate": 0, "breakdown": {}, "transport_source": "static"}, "notes": ["No planning requested."]}

        recommendations = _align_agent3_output_contract(recommendations)

        conflicts = _check_consistency(retrieval_data, recommendations)
        if conflicts:
            recommendations.setdefault("notes", []).extend(conflicts)

        # Build context string
        _pois_data = retrieval_data.get("pois", )
        def _poi_label(p, k):
            name = p.get("name", "Unknown")
            if k in ("Hospitals", "PetHospitalsNearby"):
                addr = p.get("address") or p.get("Address") or "N/A"
                phone = p.get("tel") or p.get("phone") or p.get("Phone") or p.get("Contact") or p.get("contact") or "N/A"
                return f"{name} | Address: {addr} | Phone: {phone}"
            return name
        poi_summary = {
            k: (["[No pet-friendly options found, showing general results]"] if _pois_data.get(f"{k}_fallback") else []) + [_poi_label(p, k) for p in v[:3]]
            for k, v in _pois_data.items() if not k.endswith("_fallback")
        }

        weather_block = retrieval_data.get("weather", {})

        # Add previous plan context if replanning
        previous_plan_context = ""
        if previous_plan:
            prev_recs = previous_plan.get("recommendations") or {}
            prev_city = previous_plan.get("city", "Unknown")
            prev_date = previous_plan.get("date", "Unknown")
            prev_days = previous_plan.get("days", "Unknown")
            prev_hotels = prev_recs.get("hotels", [])
            prev_attractions = prev_recs.get("attractions", [])
            prev_budget = prev_recs.get("budget_summary") or prev_recs.get("budget_estimate", "Unknown")

            previous_plan_context = f"""
        
        --- REFERENCE: Previous Trip Plan (for modification/comparison) ---
        Previous Plan: {prev_city} ({prev_date}, {prev_days} days)
        Previous Budget: {prev_budget}
        Previous Hotels Recommended: {[h.get('name', 'Unknown') for h in prev_hotels[:3]]}
        Previous Top Attractions: {[a.get('name', 'Unknown') for a in prev_attractions[:5]]}
        
        User is now replanning: Please reference previous plan and explain what changed/improved.
        """

        context = f"""
        User Profile: Pet type {user_profile.get('pet_type')}, Breed {user_profile.get('breed')}, Pet weight {user_profile.get('pet_weight')}kg, Budget {user_profile.get('budget')}, Preferences {user_profile.get('preferences')}
        People: {user_profile.get('num_people', 1)}, Pets: {user_profile.get('num_pets', 1)}, Transport: {user_profile.get('transport')}
        Departure city: {user_profile.get('departure')}
        Destination city: {city}
        Travel date: {travel_date}
        Trip days: {trip_days}
        Weather Now: {weather_block.get('now')}
        Weather Forecast: {weather_block.get('forecast')}
        Weather Minutely: {weather_block.get('minutely')}
        Weather Indices: {weather_block.get('indices')}
        Rules: {[r.get('rule_name', '') for r in retrieval_data.get('rules', [])[:3]]}
        Breed Info: {retrieval_data.get('breed_info')}
        Agent Policy: {retrieval_data.get('agent_policy')}
        POIs:
          Hotels: {poi_summary.get('Hotels', [])}
          Restaurants: {poi_summary.get('Restaurants', [])}
          Attractions: {poi_summary.get('Attractions', [])}
          Hospitals: {poi_summary.get('Hospitals', [])}
        Route Summary: {recommendations.get('routes', [])}
        Budget Estimate: {_format_budget(recommendations.get('budget_estimate'))}
        Notes: {recommendations.get('notes', [])}{previous_plan_context}

        --- Explanation & Recommendations ---
        {_build_explanation_block(recommendations, retrieval_data)}
        """

        # Let GPT generate the reply
        messages = [{"role": h["role"], "content": h["content"]} for h in history]
        sys_msg = (
            "请用中文回复。你是宠物旅行助手。每次规划或重新规划行程时，必须严格按以下格式输出：\n"
            "1. 推荐酒店：从候选中选评分最高的一家，给出名称、价格、推荐理由。必须给出，不可省略。\n"
            "2. 航班建议（仅当用户选择飞机出行时）：必须给出具体航空公司、航班号、出发/到达时间和价格。不可省略。\n"
            "3. 每日行程：每天必须包含：\n"
            "   - 时间段使用：上午、下午、晚上（不要使用具体时间如9:00）\n"
            "   - 餐厅推荐：2-3家，含名称和简短理由\n"
            "   - 景点推荐：1-2个，含名称和简短理由\n"
            "   - 交通方式：如何从酒店/上一个地点前往每个景点\n"
            "4. 预算估算明细（每次规划必须显示）\n"
            "5. 关键风险提示（规则限制、天气、宠物体重限制等）\n"
            "6. 证件提醒：提供人和宠物所需的重要证件清单，包括检疫证明、疫苗记录及交付手续。\n"
            "重要：上下文中已提供的信息（目的地、日期、出发城市、天数、人数、宠物数量、预算、交通方式等）不得再次向用户询问。直接使用已有信息。\n"
            "严格范围规则：如果用户只问酒店，只输出酒店选项；只问餐厅，只输出餐厅；只问景点，只输出景点。除非用户明确要求完整行程，否则不得添加行程、预算、风险等其他内容。\n"
            "重要：如果用户提到宠物生病、受伤，或询问医院/诊所/兽医，请立即从上下文中列出最近的宠物医院或诊所，不得询问任何问题，直接提供列表。"
            if lang == 'zh' else
            "You are a pet travel assistant. Answer ONLY what the user asked — do not output unrequested sections.\n"
            "STRICT SCOPE RULE: If the user asks only for hotels → output ONLY hotels. If only restaurants → output ONLY restaurants. If only attractions → output ONLY attractions. NEVER add itinerary, budget, risks, or other sections unless the user explicitly asked for a full plan.\n"
            "If the user asks for a full plan or itinerary, output all of: 1. Hotel recommendation 2. Flight (if flight transport chosen) 3. Daily itinerary (Morning/Afternoon/Evening only, never specific times) with restaurants, attractions, transport 4. Budget breakdown 5. Key risks.\n"
            "IMPORTANT: Never ask the user for information already in the context (destination, date, departure, days, people, pets, budget, transport). Use what is already known.\n"
            "IMPORTANT: If the user mentions their pet is sick, hurt, or asks for a hospital/vet/clinic, immediately list the nearest pet hospitals or vet clinics from the context. Do NOT ask any clarifying questions — just provide the list directly.\n"
            "IMPORTANT: For all place names, show the original Chinese name first, then English name or pinyin in parentheses — e.g. '锦江宾馆 (Jinjiang Hotel)'. Never invent a name; if unsure, keep Chinese only.\n"
            "IMPORTANT: Never hallucinate. Only use hotels, restaurants, attractions, flight numbers, prices, and facts that appear in the provided context. If information is not in the context, say it is unavailable rather than making it up.\n"
            "Document Reminder: Provide a checklist of essential documents for humans and pets, including quarantine certificates, vaccine records, and delivery formalities.\n"
            "Reply in English."
        )
        messages.insert(0, {"role": "system", "content": sys_msg})
        messages.append({"role": "assistant", "content": context})
        messages.append({"role": "user", "content": user_prompt})

        completion = openai_chat(messages=messages, model=os.getenv("AGENT1_MODEL", "gpt-5-mini"))
        reply = completion.choices[0].message.content
        save_message(session_id, "assistant", reply, user_name)

        # Save full session output to memory
        try:
            recommendations["triage_result"] = recommendations.get("hospital_recommendations")
            recommendations["document_state"] = retrieval_data.get("documents")
            recommendations["itinerary_changes"] = recommendations.get("itineraries")
            ok = save_trip_plan(user_name, city, travel_date, trip_days, recommendations, retrieval_data)
            if not ok:
                print(f"[WARN] save_trip_plan failed for {user_name}:{city}:{travel_date}", flush=True)
        except Exception as exc:
            print(f"[WARN] Failed to save trip plan during pre_trip: {exc}", flush=True)

        return reply



    elif mode == "trip_companion":
        city = trip_context.get("city", "current location")
        travel_date = trip_context.get("date", datetime.now().strftime("%Y-%m-%d"))

        # Decide which agents to run for this request
        call_agent2 = analysis.get("call_agent2", True)
        call_agent3 = analysis.get("call_agent3", True)

        retrieval_data = {}
        recommendations = {}

        # Cached shortcut path: partial substitution + cached enriched data exists → skip Agent 2
        _used_cache = False
        if call_agent2 and action in ("modify", "replace") and previous_plan:
            cached_retrieval = previous_plan.get("retrieval_data") or {}
            if cached_retrieval.get("enriched_pois") or cached_retrieval.get("pois"):
                retrieval_data = cached_retrieval
                _used_cache = True

        try:
            days_val = trip_context.get("days", 1)
            trip_days_int = int(days_val)
        except Exception:
            trip_days_int = 1

        _fast_label = "Agent (quick):" if lang != "zh" else "助手（快速）："

        if call_agent2 and not _used_cache and call_agent3:
            from agent3_fetcher import fetch as _fetch
            from agent3_reasoner import refine as _refine
            from agent3_finalizer import finalize as _finalize
            from concurrent.futures import ThreadPoolExecutor

            _fetcher_future = [None]

            def _on_partial(partial_data):
                _fetcher_future[0] = ThreadPoolExecutor(max_workers=1).submit(
                    _fetch, user_profile, partial_data, trip_days_int, lang
                )

            full_retrieval = agent2_retrieval_streaming(user_profile, city, trip_context, _on_partial)
            retrieval_data = full_retrieval

            fast_out = _fetcher_future[0].result() if _fetcher_future[0] else None
            if fast_out:
                print(f"\n{_fast_label} Initial plan ready. Refining details...\n")

            refined_out = _refine({"user_profile": user_profile, "retrieval_data": full_retrieval, "trip_days": trip_days_int, "lang": lang})
            recommendations = _finalize(fast_out, refined_out).get("final", (fast_out or {}).get("fast_response", {}))
        else:
            if call_agent2 and not _used_cache:
                retrieval_data = agent2_retrieval(user_profile, city, trip_context)
            if call_agent3:
                from agent3_planning import agent3_planning
                recommendations = agent3_planning(user_profile, retrieval_data or {}, trip_days_int, lang)
            else:
                recommendations = {"routes": [], "budget_estimate": 0, "notes": ["No planning requested."]}

        recommendations = _align_agent3_output_contract(recommendations)

        conflicts = _check_consistency(retrieval_data, recommendations)
        if conflicts:
            recommendations.setdefault("notes", []).extend(conflicts)

        # Format POIs nicely
        _pois_data = retrieval_data.get("pois", {})
        def _poi_label(p, k):
            name = p.get("name", "Unknown")
            if k in ("Hospitals", "PetHospitalsNearby"):
                addr = p.get("address") or p.get("Address") or "N/A"
                phone = p.get("tel") or p.get("phone") or p.get("Phone") or p.get("Contact") or p.get("contact") or "N/A"
                return f"{name} | Address: {addr} | Phone: {phone}"
            return name
        poi_summary = {
            k: (["[No pet-friendly options found, showing general results]"] if _pois_data.get(f"{k}_fallback") else []) + [_poi_label(p, k) for p in v[:3]]
            for k, v in _pois_data.items() if not k.endswith("_fallback")
        }

        # Build context string
        weather_block = retrieval_data.get("weather", {})

        # Add previous plan context if replanning during trip
        previous_plan_context = ""
        if previous_plan and action in ("plan", "compare", "modify"):
            prev_recs = previous_plan.get("recommendations") or {}
            prev_city = previous_plan.get("city", "Unknown")
            prev_date = previous_plan.get("date", "Unknown")
            prev_days = previous_plan.get("days", "Unknown")
            prev_hotels = prev_recs.get("hotels") or []
            prev_restaurants = prev_recs.get("restaurants") or []
            prev_attractions = prev_recs.get("attractions") or []
            prev_hospitals = prev_recs.get("hospitals") or []
            prev_flights = prev_recs.get("flights") or []
            prev_budget = prev_recs.get("budget_total") or prev_recs.get("budget_summary") or prev_recs.get("budget_estimate", "Unknown")

            prev_lines = [
                f"        Previous Plan: {prev_city} ({prev_date}, {prev_days} days)",
                f"        Previous Budget: {prev_budget}",
                f"        Previous Hotels: {[h.get('name', 'Unknown') for h in prev_hotels[:3]]}",
                f"        Previous Restaurants: {[r.get('name', 'Unknown') for r in prev_restaurants[:5]]}",
                f"        Previous Attractions: {[a.get('name', 'Unknown') for a in prev_attractions[:5]]}",
            ]
            if prev_hospitals:
                prev_lines.append(f"        Previous Hospitals: {[h.get('name', 'Unknown') for h in prev_hospitals[:3]]}")
            if prev_flights:
                prev_lines.append(f"        Previous Flights: {[f.get('airline', '') + ' ' + f.get('flight_number', '') for f in prev_flights[:2]]}")

            previous_plan_context = "\n        --- REFERENCE: Previous Trip Plan (do NOT repeat these suggestions) ---\n" + "\n".join(prev_lines) + "\n        IMPORTANT: Do NOT suggest any of the above. Suggest different options only.\n"

        context = f"""
        Companion Mode
        Departure city: {user_profile.get('departure')}
        Destination city: {city}
        Travel date: {travel_date}
        Trip days: {trip_context.get("days", 1)}
        User Profile: Pet type {user_profile.get('pet_type')}, Breed {user_profile.get('breed')}, Pet weight {user_profile.get('pet_weight')}kg, Budget {user_profile.get('budget')}, Preferences {user_profile.get('preferences')}
        People: {user_profile.get('num_people', 1)}, Pets: {user_profile.get('num_pets', 1)}, Transport: {user_profile.get('transport')}
        Weather Now: {weather_block.get('now')}
        Weather Forecast: {weather_block.get('forecast')}
        Weather Minutely: {weather_block.get('minutely')}
        Weather Indices: {weather_block.get('indices')}
        Rules: {[r.get('rule_name', '') for r in retrieval_data.get('rules', [])[:3]]}
        Breed Info: {retrieval_data.get('breed_info')}
        Agent Policy: {retrieval_data.get('agent_policy')}
        POIs:
          Hotels: {poi_summary.get('Hotels', [])}
          Restaurants: {poi_summary.get('Restaurants', [])}
          Attractions: {poi_summary.get('Attractions', [])}
          Hospitals: {poi_summary.get('Hospitals', [])}
          Transport: {poi_summary.get('Transport', [])}

        Route Summary: {recommendations.get('routes', [])}

        Budget Estimate: {_format_budget(recommendations.get('budget_estimate'))}
        Notes: {recommendations.get('notes', [])}{previous_plan_context}

        --- Explanation & Recommendations ---
        {_build_explanation_block(recommendations, retrieval_data)}
        """

        # Let GPT generate the reply
        messages = [{"role": h["role"], "content": h["content"]} for h in history]
        sys_msg = (
            "请用中文回复。你是宠物旅行助手。每次规划或重新规划行程时，必须严格按以下格式输出：\n"
            "1. 推荐酒店：从候选中选评分最高的一家，给出名称、价格、推荐理由。必须给出，不可省略。\n"
            "2. 航班建议（仅当用户选择飞机出行时）：必须给出具体航空公司、航班号、出发/到达时间和价格。不可省略。\n"
            "3. 每日行程：每天必须包含：\n"
            "   - 餐厅推荐：2-3家，含名称和简短理由\n"
            "   - 景点推荐：1-2个，含名称和简短理由\n"
            "   - 交通方式：如何从酒店/上一个地点前往每个景点\n"
            "4. 预算估算明细（每次规划必须显示）\n"
            "5. 关键风险提示（规则限制、天气、宠物体重限制等）\n"
            "6. 证件提醒：提供人和宠物所需的重要证件清单，包括检疫证明、疫苗记录及交付手续。\n"
            "重要：上下文中已提供的信息（目的地、日期、出发城市、天数、人数、宠物数量、预算、交通方式等）不得再次向用户询问。直接使用已有信息。\n"
            "严格范围规则：如果用户只问酒店，只输出酒店选项；只问餐厅，只输出餐厅；只问景点，只输出景点。除非用户明确要求完整行程，否则不得添加行程、预算、风险等其他内容。\n"
            "重要：如果用户提到宠物生病、受伤，或询问医院/诊所/兽医，请立即从上下文中列出最近的宠物医院或诊所，不得询问任何问题，直接提供列表。"
            if lang == 'zh' else
            "You are a pet travel assistant. Answer ONLY what the user asked — do not output unrequested sections.\n"
            "STRICT SCOPE RULE: If the user asks only for hotels → output ONLY hotels. If only restaurants → output ONLY restaurants. If only attractions → output ONLY attractions. NEVER add itinerary, budget, risks, or other sections unless the user explicitly asked for a full plan.\n"
            "If the user asks for a full plan or itinerary, output all of: 1. Hotel recommendation 2. Flight (if flight transport chosen) 3. Daily itinerary (Morning/Afternoon/Evening only) with restaurants, attractions, transport 4. Budget breakdown 5. Key risks.\n"
            "IMPORTANT: Never ask the user for information already in the context. Use what is already known.\n"
            "IMPORTANT: If the user mentions their pet is sick, hurt, or asks for a hospital/vet/clinic, immediately list the nearest pet hospitals or vet clinics from the context. Do NOT ask any clarifying questions — just provide the list directly.\n"
            "IMPORTANT: For all place names, show the original Chinese name first, then English name or pinyin in parentheses — e.g. '锦江宾馆 (Jinjiang Hotel)'. Never invent a name; if unsure, keep Chinese only.\n"
            "IMPORTANT: Never hallucinate. Only use hotels, restaurants, attractions, flight numbers, prices, and facts that appear in the provided context. If information is not in the context, say it is unavailable rather than making it up.\n"
            "Document Reminder: Provide a checklist of essential documents for humans and pets, including quarantine certificates, vaccine records, and delivery formalities.\n"
            "Reply in English."
        )
        messages.insert(0, {"role": "system", "content": sys_msg})
        messages.append({"role": "assistant", "content": context})
        messages.append({"role": "user", "content": user_prompt})
        completion = openai_chat(messages=messages, model=os.getenv("AGENT1_MODEL", "gpt-5-mini"))
        reply = completion.choices[0].message.content
        save_message(session_id, "assistant", reply, user_name)
        try:
            # Save full session output to memory
            trip_date = trip_context.get("date", datetime.now().strftime("%Y-%m-%d"))
            trip_days = trip_context.get("days", 1)
            recommendations["triage_result"] = recommendations.get("hospital_recommendations")
            recommendations["document_state"] = retrieval_data.get("documents")
            recommendations["itinerary_changes"] = recommendations.get("itineraries")
            ok = save_trip_plan(user_name, city, trip_date, trip_days, recommendations, retrieval_data)
            if not ok:
                print(f"[WARN] save_trip_plan failed for {user_name}:{city}:{trip_date}", flush=True)
        except Exception as exc:
            print(f"[WARN] Failed to save trip plan (trip_companion): {exc}", flush=True)


    elif mode == "conversation":
        reply = agent_response_conversation(session_id, user_name, user_prompt, history, lang, user_profile, trip_context)
        save_message(session_id, "assistant", reply, user_name)

    return reply


def agent1_orchestrator_streaming(session_id, user_name, user_prompt, trip_context, user_profile):
    """Streaming variant: prints stage progress then streams the final LLM reply token-by-token.
    Returns the full reply string when done."""
    def _progress(msg):
        print(f"\n[...] {msg}", flush=True)

    save_message(session_id, "user", user_prompt, user_name)
    lang = detect_language(user_prompt)
    trip_context.setdefault("lang", lang)
    history = load_recent_conversation(session_id, user_name, limit=10)

    try:
        user_slots = load_user_slots(user_name) or {}
        for k, v in user_slots.items():
            if not trip_context.get(k):
                trip_context[k] = v
    except Exception:
        user_slots = {}

    for field in ("age", "weight", "health_status", "vaccination_records", "medical_history"):
        if not user_profile.get(field) and user_slots.get(field):
            user_profile[field] = user_slots[field]

    _progress("Analyzing your request...")
    analysis = analyze_message(user_prompt, lang)
    mode = trip_context.pop("initial_mode", None) or analysis.get("mode", "trip_companion")
    action = analysis.get("action", "other")

    for k, v in analysis.get("slots", {}).items():
        if v and not trip_context.get(k):
            trip_context[k] = v
            try:
                save_user_slot(user_name, k, v)
            except Exception:
                pass

    # recall shortcut
    if action == "recall":
        cached_plan = load_trip_plan(user_name)
        if cached_plan:
            reply = format_cached_plan_response(cached_plan, lang)
        else:
            reply = "I don't have any previous trip plans saved." if lang != 'zh' else "我没有保存任何之前的旅行计划。"
        print(f"\nAgent: {reply}", flush=True)
        save_message(session_id, "assistant", reply, user_name)
        return reply

    # conversation mode
    if mode == "conversation":
        _progress("Generating response...")
        reply = agent_response_conversation(session_id, user_name, user_prompt, history, lang, user_profile, trip_context)
        save_message(session_id, "assistant", reply, user_name)
        print(f"\nAgent: {reply}", flush=True)
        return reply

    # pre_trip / trip_companion: build context then stream
    city = trip_context.get("city", "")
    travel_date = trip_context.get("date", "")
    try:
        trip_days = int(trip_context.get("days") or 1)
    except Exception:
        trip_days = 1

    if mode == "pre_trip":
        for key in ("num_people", "num_pets", "budget", "transport", "pet_weight", "departure"):
            if trip_context.get(key):
                user_profile[key] = trip_context[key]
                try:
                    save_user_slot(user_name, key, trip_context[key])
                except Exception:
                    pass
        update_user_locale_preferences(user_name, locale=lang)

    retrieval_data = {}
    recommendations = {}
    call_agent2 = analysis.get("call_agent2", True)
    call_agent3 = analysis.get("call_agent3", True)

    if call_agent2 and call_agent3:
        from agent3_fetcher import fetch as _fetch
        from agent3_reasoner import refine as _refine
        from agent3_finalizer import finalize as _finalize
        from concurrent.futures import ThreadPoolExecutor

        _fetcher_future = [None]

        def _on_partial(partial_data):
            _fetcher_future[0] = ThreadPoolExecutor(max_workers=1).submit(
                _fetch, user_profile, partial_data, trip_days, lang
            )

        _progress("Fetching travel data & rules...")
        full_retrieval = agent2_retrieval_streaming(user_profile, city, trip_context, _on_partial)
        retrieval_data = full_retrieval

        fast_out = _fetcher_future[0].result() if _fetcher_future[0] else None
        if fast_out:
            _progress("Initial plan ready — refining details...")

        _progress("Refining recommendations...")
        refined_out = _refine({"user_profile": user_profile, "retrieval_data": full_retrieval, "trip_days": trip_days, "lang": lang})
        recommendations = _finalize(fast_out, refined_out).get("final", (fast_out or {}).get("fast_response", {}))
    elif call_agent2:
        _progress("Fetching travel data...")
        retrieval_data = agent2_retrieval(user_profile, city, trip_context)
    elif call_agent3:
        from agent3_planning import agent3_planning
        _progress("Planning itinerary...")
        recommendations = agent3_planning(user_profile, retrieval_data, trip_days, lang)

    if not call_agent3:
        recommendations = {"routes": [], "budget_estimate": {"total_estimate": 0, "breakdown": {}, "transport_source": "static"}, "notes": ["No planning requested."]}

    recommendations = _align_agent3_output_contract(recommendations)
    conflicts = _check_consistency(retrieval_data, recommendations)
    if conflicts:
        recommendations.setdefault("notes", []).extend(conflicts)

    _pois_data = retrieval_data.get("pois", {})
    def _poi_label(p, k):
        name = p.get("name", "Unknown")
        if k in ("Hospitals", "PetHospitalsNearby"):
            addr = p.get("address") or p.get("Address") or "N/A"
            phone = p.get("tel") or p.get("phone") or p.get("Phone") or p.get("Contact") or p.get("contact") or "N/A"
            return f"{name} | Address: {addr} | Phone: {phone}"
        return name
    poi_summary = {
        k: (["[No pet-friendly options found, showing general results]"] if _pois_data.get(f"{k}_fallback") else []) + [_poi_label(p, k) for p in v[:3]]
        for k, v in _pois_data.items() if not k.endswith("_fallback")
    }
    weather_block = retrieval_data.get("weather", {})

    context = f"""
    User Profile: Pet type {user_profile.get('pet_type')}, Breed {user_profile.get('breed')}, Pet weight {user_profile.get('pet_weight')}kg, Budget {user_profile.get('budget')}, Preferences {user_profile.get('preferences')}
    People: {user_profile.get('num_people', 1)}, Pets: {user_profile.get('num_pets', 1)}, Transport: {user_profile.get('transport')}
    Departure: {user_profile.get('departure')}, Destination: {city}, Date: {travel_date}, Days: {trip_days}
    Weather Now: {weather_block.get('now')}
    Weather Forecast: {weather_block.get('forecast')}
    Rules: {[r.get('rule_name', '') for r in retrieval_data.get('rules', [])[:3]]}
    POIs: Hotels {poi_summary.get('Hotels', [])}, Restaurants {poi_summary.get('Restaurants', [])}, Attractions {poi_summary.get('Attractions', [])}, Hospitals {poi_summary.get('Hospitals', [])}
    Budget Estimate: {_format_budget(recommendations.get('budget_estimate'))}
    Notes: {recommendations.get('notes', [])}

    --- Explanation & Recommendations ---
    {_build_explanation_block(recommendations, retrieval_data)}
    """

    sys_msg = (
        "请用中文回复。你是宠物旅行助手。每次规划或重新规划行程时，必须严格按以下格式输出：\n"
        "1. 推荐酒店 2. 航班建议（飞机出行时）3. 每日行程（含餐厅、景点、交通，时间段用上午/下午/晚上，不用具体时间）4. 预算估算明细 5. 关键风险提示 6. 证件提醒：提供人和宠物所需的重要证件清单，包括检疫证明、疫苗记录及交付手续。\n"
        "重要：上下文中已提供的信息不得再次向用户询问。\n"
        "严格范围规则：如果用户只问酒店，只输出酒店选项；只问餐厅，只输出餐厅；只问景点，只输出景点。除非用户明确要求完整行程，否则不得添加行程、预算、风险等其他内容。\n"
        "重要：如果用户提到宠物生病、受伤，或询问医院/诊所/兽医，请立即从上下文中列出最近的宠物医院或诊所，不得询问任何问题，直接提供列表。"
        if lang == 'zh' else
        "You are a pet travel assistant. Answer ONLY what the user asked — do not output unrequested sections. "
        "If the user asks for a full plan, output: 1. Hotel recommendation 2. Flight (if flight transport) 3. Daily itinerary (Morning/Afternoon/Evening only) with restaurants, attractions, transport 4. Budget breakdown 5. Key risks. "
        "STRICT SCOPE RULE: If the user asks only for hotels → output ONLY hotels. If only restaurants → output ONLY restaurants. If only attractions → output ONLY attractions. NEVER add itinerary, budget, risks, or other sections unless the user explicitly asked for a full plan. "
        "If the user asks only for hotels, output only hotels. If only restaurants, output only restaurants. "
        "Never ask for info already in context. "
        "If the user mentions their pet is sick, hurt, or asks for a hospital/vet/clinic, immediately list the nearest pet hospitals or vet clinics from the context. Do NOT ask any clarifying questions — just provide the list directly. "
        "For all place names, show the original Chinese name first, then English name or pinyin in parentheses — e.g. '锦江宾馆 (Jinjiang Hotel)'. Never invent a name; if unsure, keep Chinese only. "
        "Never hallucinate. Only use hotels, restaurants, attractions, flight numbers, prices, and facts from the provided context. If information is unavailable, say so rather than making it up. "
        "Document Reminder: Provide a checklist of essential documents for humans and pets, including quarantine certificates, vaccine records, and delivery formalities. "
        "Reply in English."
    )

    messages = [{"role": h["role"], "content": h["content"]} for h in history]
    messages.insert(0, {"role": "system", "content": sys_msg})
    messages.append({"role": "assistant", "content": context})
    messages.append({"role": "user", "content": user_prompt})

    _progress("Generating your plan...")
    print("\nAgent: ", end="", flush=True)
    reply_parts = []
    for chunk in openai_chat_stream(messages=messages, model=os.getenv("AGENT1_MODEL", "gpt-5-mini")):
        print(chunk, end="", flush=True)
        reply_parts.append(chunk)
    print()  # newline after stream ends

    reply = "".join(reply_parts)
    save_message(session_id, "assistant", reply, user_name)

    try:
        recommendations["triage_result"] = recommendations.get("hospital_recommendations")
        recommendations["document_state"] = retrieval_data.get("documents")
        recommendations["itinerary_changes"] = recommendations.get("itineraries")
        ok = save_trip_plan(user_name, city, travel_date, trip_days, recommendations, retrieval_data)
        if not ok:
            print(f"[WARN] save_trip_plan failed for {user_name}:{city}:{travel_date}", flush=True)
    except Exception as exc:
        print(f"[WARN] Failed to save trip plan (streaming): {exc}", flush=True)

    return reply