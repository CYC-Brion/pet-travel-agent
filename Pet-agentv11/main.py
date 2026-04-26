import os
import uuid
from dotenv import load_dotenv
from helper import get_or_create_user_profile, safe_input, load_user_slots, load_user_conversation, save_user_slot
from agent1_orchestrator import agent1_orchestrator_streaming

load_dotenv()

def _handle_emergency(session_id, user_name, trip_context, user_profile):
    print("🚨 EMERGENCY / 紧急情况 🚨")
    print("📞 Call 120 (medical) / 拨打 120（急救）")
    print("📞 Call 110 (police)  / 拨打 110（警察）")
    print("📞 Call 112 (international) / 拨打 112（国际）")
    city = trip_context.get("city") or trip_context.get("departure") or "current location"
    agent1_orchestrator_streaming(
        session_id, user_name,
        f"EMERGENCY: Search and recommend the nearest real hospitals with addresses and phone numbers in {city}.",
        trip_context, user_profile
    )

_EMERGENCY_KEYWORDS = ["emergency", "urgent", "not breathing", "seizure", "bleeding", "unconscious", "sick", "hospital", "vet", "clinic", "hurt", "injured", "vomit", "diarrhea", "limp", "pain", "紧急", "急救", "生病", "医院", "诊所", "受伤", "呕吐", "腹泻", "疼痛"]

if __name__ == "__main__":
    session_id = str(uuid.uuid4())
    user_name = safe_input("👤 Enter your user name / 请输入用户名: ")

    user_profile = get_or_create_user_profile(user_name)
    trip_context = {}

    try:
        user_slots = load_user_slots(user_name) or {}
    except Exception:
        user_slots = {}

    if user_slots:
        summary = ", ".join(f"{k}={v}" for k, v in user_slots.items())
        while True:
            choice = safe_input(f"Found previous trip data: {summary}.\nEnter 'y' to resume, 'n' for a new trip, 'h' to show recent chat history, or 'e' for emergency\n找到之前的行程数据：{summary}。\n输入 'y' 继续，'n' 新建行程，'h' 查看历史记录，或 'e' 紧急求助: ").strip().lower()
            if choice in ("y", "yes"):
                trip_context.update(user_slots)
                print("Resuming previous trip context. / 正在恢复之前的行程。")
                break
            if choice in ("n", "no"):
                print("Starting a new trip. Previous memory will be retained but not used. / 开始新行程，之前的记录将保留但不使用。")
                trip_context["departure"] = safe_input("🛫 Departure city / 出发城市: ")
                trip_context["city"] = safe_input("✈️ Destination city / 目的地城市: ")
                trip_context["date"] = safe_input("📅 Travel date (e.g., 2026-05-01) / 出行日期（如 2026-05-01）: ")
                trip_context["days"] = safe_input("🗓️ How many days? / 几天？: ")
                trip_context["num_people"] = safe_input("👥 How many people? / 几位旅客？: ")
                trip_context["num_pets"] = safe_input("🐾 How many pets? / 几只宠物？: ")
                trip_context["pet_weight"] = safe_input("⚖️ Pet weight in kg (e.g., 5) / 宠物体重（公斤，如 5）: ")
                trip_context["budget"] = safe_input("💰 Budget range (e.g., 1000-3000 CNY) / 预算范围（如 1000-3000 元）: ")
                trip_context["transport"] = safe_input("🚗 Preferred transport (e.g., car, train, flight) / 交通方式（如 自驾、火车、飞机）: ")
                trip_context["initial_mode"] = "pre_trip"
                for k in ("departure", "city", "date", "days", "num_people", "num_pets", "pet_weight", "budget", "transport"):
                    if trip_context.get(k):
                        save_user_slot(user_name, k, trip_context[k])
                break
            if choice in ("h", "history"):
                conv = load_user_conversation(user_name, limit=10)
                print("Recent messages:")
                for m in conv:
                    print(f"{m.get('timestamp','')} {m.get('role','')}: {m.get('content','')}")
                continue
            if choice in ("e", "emergency"):
                _handle_emergency(session_id, user_name, trip_context, user_profile)
                break
            print("Please enter 'y', 'n', 'h' or 'e'. / 请输入 'y'、'n'、'h' 或 'e'。")
    else:
        _mode_map = {"1": "pre_trip", "2": "trip_companion", "3": "conversation"}
        _intent = safe_input(
            "What would you like to do? / 您想做什么？\n"
            "  (1) Plan a trip / 规划行程\n"
            "  (2) Ask questions about a trip / 咨询行程问题\n"
            "  (3) Just chat / general questions / 闲聊或一般问题\n"
            "Enter 1, 2, or 3 / 请输入 1、2 或 3: "
        ).strip()
        trip_context["initial_mode"] = _mode_map.get(_intent, "trip_companion")

        if _intent == "1":
            trip_context["departure"] = safe_input("🛫 Departure city / 出发城市: ")
            trip_context["city"] = safe_input("✈️ Destination city / 目的地城市: ")
            trip_context["date"] = safe_input("📅 Travel date (e.g., 2026-05-01) / 出行日期（如 2026-05-01）: ")
            trip_context["days"] = safe_input("🗓️ How many days? / 几天？: ")
            trip_context["num_people"] = safe_input("👥 How many people? / 几位旅客？: ")
            trip_context["num_pets"] = safe_input("🐾 How many pets? / 几只宠物？: ")
            trip_context["pet_weight"] = safe_input("⚖️ Pet weight in kg (e.g., 5) / 宠物体重（公斤，如 5）: ")
            trip_context["budget"] = safe_input("💰 Budget range (e.g., 1000-3000 CNY) / 预算范围（如 1000-3000 元）: ")
            trip_context["transport"] = safe_input("🚗 Preferred transport (e.g., car, train, flight) / 交通方式（如 自驾、火车、飞机）: ")
            for k in ("departure", "city", "date", "days", "num_people", "num_pets", "pet_weight", "budget", "transport"):
                if trip_context.get(k):
                    save_user_slot(user_name, k, trip_context[k])

    print("🐾 Welcome to your Pet Travel Planner! / 欢迎使用宠物旅行规划助手！")
    print("Type 'exit' anytime to end. / 随时输入 'exit' 退出。\n")

    # Auto-trigger planning for pre_trip mode without waiting for user input
    if trip_context.get("initial_mode") == "pre_trip":
        auto_prompt = f"Plan a trip to {trip_context.get('city')} from {trip_context.get('date')} for {trip_context.get('days')} days."
        agent1_orchestrator_streaming(session_id, user_name, auto_prompt, trip_context, user_profile)

    while True:
        user_input = safe_input("You: ").strip()

        if user_input.lower() in ("exit", "quit", "bye"):
            print("Goodbye! Safe travels with your pet. 🐾 / 再见！祝您和宠物旅途愉快。🐾")
            break

        if user_input.lower() in ("e", "emergency"):
            _handle_emergency(session_id, user_name, trip_context, user_profile)
            continue

        # Emergency shortcut: inject symptoms into user_profile for Agent 3 triage
        if any(k in user_input.lower() for k in _EMERGENCY_KEYWORDS):
            user_profile["symptoms"] = user_input
        else:
            user_profile.pop("symptoms", None)

        agent1_orchestrator_streaming(session_id, user_name, user_input, trip_context, user_profile)
