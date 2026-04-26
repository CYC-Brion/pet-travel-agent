# Schema 确认文档

> 本文档用于前后端团队确认数据接口契约，确保前后端基于同一套数据结构开发。

---

## 一、什么是 Schema？

### 1.1 定义

**Schema = 数据结构契约**

Schema 定义了后端输出的数据"长什么样"，前端严格按照 Schema 规定的字段名、类型、结构来读取和渲染数据。

```
后端输出什么字段  ────Schema 定义────▶  前端就用什么字段
```

### 1.2 为什么要 Schema？

| 问题 | 解决 |
|------|------|
| 后端改了字段名，前端报错 | Schema 锁定，双方不能随意改 |
| 前端不知道后端返回什么 | Schema 就是文档 |
| 联调时数据对不上 | 以 Schema 为准 |

### 1.3 Schema 锁定后的规则

- **后端**：输出必须符合 Schema，改字段名需要通知前端并更新 Schema 版本
- **前端**：只依赖 Schema 字段，不访问 Schema 之外的字段
- **数据库**：存入 DB 的结构 = API 返回的结构 = Schema 定义的结构

---

## 二、数据流向

```
┌─────────────────────────────────────────────────────────────────┐
│                         数据流向                                  │
└─────────────────────────────────────────────────────────────────┘

  ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
  │  后端 Agent  │       │    Cosmos    │       │   前端 UI    │
  │              │ 存储   │     DB       │  API   │              │
  │ Agent2 检索  │──────▶│              │──────▶│  渲染展示    │
  │ Agent3 规划  │       │ recommendations    │  数据消费    │
  └──────────────┘       └──────────────┘       └──────────────┘
         │                      │                       │
         │ 存入 DB 的结构        │ API 返回的结构        │ 前端使用的结构
         │ = recommendations     │ = Schema 定义        │ = Schema 定义
         │ = retrieval_data      │                       │
         │                       │                       │
         ▼                       ▼                       ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  核心原则：存入 DB = API 返回 = Schema 定义（三者一致）          │
  └─────────────────────────────────────────────────────────────────┘
```

---

## 三、Schema 边界说明

### 3.1 包含在 Schema 中的数据

这些数据会存入 Cosmos DB，也会通过 API 返回给前端：

| 数据类别 | 说明 | 对应代码 |
|----------|------|----------|
| 行程方案 itineraries | 3档方案（Premium/Comfort/Economy） | agent3_planning.py |
| 预算估算 budget_estimate | 总价 + 分项 + 数据来源 | agent3_planning.py |
| 医院推荐 hospital_recommendations | 紧急程度 + 候选医院列表 | agent3_planning.py |
| 酒店区域 hotel_zones | 分区 + 各档酒店推荐 | agent3_planning.py |
| 约束条件 constraints | 8维度约束（宠物/用户/交通/天气等） | agent3_planning.py |
| 风险提示 notes | 天气/规则/用药冲突等警告 | agent3_planning.py |
| 天气信息 weather | 实时 + 预报 + 分钟级 | agent2_retrieval.py |
| POI 摘要 pois_count | 各类 POI 数量统计 | agent2_retrieval.py |
| 规则评估 rules_evaluation | 宠物进入规则结果 | agent2_retrieval.py |
| 用户画像 user_profile | 宠物信息 + 偏好 | Cosmos DB |

### 3.2 不包含在 Schema 中的数据

这些是后端内部实现细节，不对外暴露：

| 数据类别 | 说明 | 原因 |
|----------|------|------|
| 高德地图原始返回 | poi_id, location 等原始字段 | 内部实现，可能变化 |
| SerpAPI 原始响应 | hotels_search_env 等信封结构 | 内部实现 |
| QWeather 原始字段 | obs_time, humidity_pct 等 | 内部实现 |
| LLM 推理中间产物 | prompt/response 原始文本 | 不稳定 |
| 数据库内部 ID | _rid, _self 等 | 前端不需要 |

---

## 四、完整 Schema 定义

### 4.1 通用响应结构（所有 API 统一）

```json
{
  "status": "success | error | partial",
  "request_id": "uuid",
  "timestamp": "ISO8601",
  "data": { },
  "errors": [
    {
      "code": "ERR_MISSING_FIELD",
      "message": "缺少必填字段 city",
      "field": "city"
    }
  ]
}
```

---

### 4.2 POST /v1/plan/generate（生成行程）

#### 请求

```json
{
  "user_id": "string",
  "session_id": "string",
  "city": "杭州",
  "date": "2026-05-01",
  "days": 3,
  "pet": {
    "type": "dog",
    "breed": "金毛",
    "weight": 25.5,
    "health_status": "healthy"
  },
  "budget": {
    "min": 2000,
    "max": 5000,
    "currency": "CNY"
  },
  "transport_mode": "driving",
  "preferences": {
    "pace": "moderate",
    "hotel_area": "西湖区"
  }
}
```

#### 响应（完整 Schema）

```json
{
  "status": "success",
  "data": {
    "reply_text": "已为您生成杭州3日宠物友好行程规划...",
    "plan_id": "plan_789",
    "recommendations": {
      "itineraries": [
        {
          "option": "Premium",
          "hotel_tier": "luxury",
          "days": 3,
          "hotel_nightly_price": 1200.0,
          "hotel_price_source": "serpapi_google_hotels | static_fallback",
          "total_km": 45.2,
          "total_minutes": 1440,
          "total_hours": 24.0,
          "total_cost_cny": 4500,
          "cost_breakdown": {
            "hotel": 3600,
            "meals": 900,
            "pet_fee": 240,
            "transport": 113,
            "tickets": 150
          },
          "day_plans": [
            {
              "day": 1,
              "legs": [
                {
                  "from": "杭州西子湖四季酒店",
                  "to": "西湖风景区",
                  "distance_km": 3.5,
                  "travel_minutes": 12,
                  "visit_minutes": 120,
                  "ticket_price": 0
                },
                {
                  "from": "西湖风景区",
                  "to": "河坊街",
                  "distance_km": 2.1,
                  "travel_minutes": 8,
                  "visit_minutes": 90,
                  "ticket_price": 0
                }
              ],
              "total_minutes": 240,
              "total_hours": 4.0
            }
          ],
          "attractions_count": 6
        }
      ],
      "hotel_zones": {
        "bundles": [
          {
            "zone": "西湖区",
            "commute_km_to_attractions": 2.5,
            "hotels_by_tier": {
              "luxury": [{"name": "杭州西子湖四季酒店", "id": "h001"}],
              "comfort": [{"name": "杭州香格里拉饭店", "id": "h002"}],
              "budget": [{"name": "如家酒店", "id": "h003"}]
            },
            "recommended": {
              "Premium": [{"name": "杭州西子湖四季酒店", "id": "h001"}],
              "Comfort": [{"name": "杭州香格里拉饭店", "id": "h002"}],
              "Economy": [{"name": "如家酒店", "id": "h003"}]
            }
          }
        ]
      },
      "hospital_recommendations": {
        "severity": "Low | Medium | High | Emergency",
        "strategy": "nearest_first | capability_match_first",
        "transport_mode": "driving | taxi | transit",
        "candidates": [
          {
            "name": "浙江大学动物医院",
            "id": "hosp_001",
            "distance_km": 3.5,
            "eta_minutes": 12,
            "capability_score": 95,
            "opening_hours": "24小时",
            "phone": "0571-xxxxxxx"
          }
        ],
        "next_actions": ["预约就诊", "携带疫苗证书"]
      },
      "budget_estimate": {
        "total_estimate": 4500,
        "breakdown": {
          "hotel": 3600,
          "food": 900,
          "attraction": 150,
          "pet_fee": 240,
          "transport": 113
        },
        "transport_source": "gaode | itinerary_haversine | static",
        "hotel_source": "serpapi_google_hotels | static",
        "hotel_samples_used": 5,
        "days": 3,
        "budget_tier": "luxury | comfort | economy"
      },
      "constraints": {
        "pet": {
          "type": "dog",
          "breed": "金毛",
          "age": 3,
          "weight_kg": 25.5
        },
        "user": {
          "budget": "luxury",
          "physical_stamina": "normal"
        },
        "transport": {
          "preferred_mode": "driving",
          "pet_friendly_modes": ["driving", "taxi"]
        },
        "weather": {
          "avoid_conditions": ["rain", "high_temperature"],
          "current_temp": 28,
          "forecast_summary": ["多云 22-28°C", "晴 25-30°C"]
        },
        "spatiotemporal": {
          "trip_days": 3,
          "destination": "杭州",
          "daily_activity_hours": 8
        },
        "operational": {
          "max_daily_travel_minutes": 480,
          "hospital_operating": true
        },
        "route": {
          "max_commute_minutes": 60
        },
        "compliance": {
          "rules_evaluation": "PASS | FAIL | CONDITIONAL",
          "explanation": "金毛可进入西湖风景区，需系绑绳"
        },
        "confidence": 0.85
      },
      "notes": [
        "天气炎热时减少户外活动时间",
        "提前预约宠物友好酒店"
      ]
    },
    "retrieval_summary": {
      "pois_count": {
        "Hotels": 5,
        "Attractions": 8,
        "Restaurants": 6,
        "Hospitals": 3
      },
      "weather": {
        "now": {
          "temp_c": 25,
          "text": "晴",
          "feels_like_c": 27,
          "humidity_pct": 60
        },
        "forecast": [
          {"text": "多云", "temp_max": 28, "temp_min": 22},
          {"text": "晴", "temp_max": 30, "temp_min": 25}
        ]
      },
      "canonical_location": {
        "lat": 30.25,
        "lon": 120.15,
        "city": "杭州"
      }
    }
  }
}
```

---

### 4.3 POST /v1/trip/replan（应急重规划）

#### 请求

```json
{
  "user_id": "string",
  "session_id": "string",
  "plan_id": "plan_789",
  "event_type": "weather | traffic | closure | pet_health | other",
  "event_detail": {
    "type": "rain | high_temperature | traffic_jam | venue_closed | emergency",
    "severity": "Emergency | High | Medium | Low",
    "affected_stops": ["西湖风景区"]
  },
  "current_location": { "lat": 30.246, "lon": 120.147 },
  "remaining_budget": 2000,
  "remaining_minutes": 180
}
```

#### 响应

```json
{
  "status": "success",
  "data": {
    "reply_text": "检测到雨天，我已为您重新规划路线...",
    "revised_plan": {
      "status": "replanned | no_alternatives",
      "failed_nodes": ["西湖风景区"],
      "legs": [
        {
          "from": "当前位置",
          "to": "杭州博物馆",
          "distance_km": 1.2,
          "travel_minutes": 5,
          "visit_minutes": 120
        }
      ],
      "total_minutes": 150,
      "total_hours": 2.5,
      "attractions_count": 1
    },
    "alternatives": [
      {
        "name": "中国丝绸博物馆",
        "id": "attr_002",
        "compatibility_score": 85,
        "distance_km": 2.1,
        "visit_minutes": 90,
        "rationale": "same category, 2.1 km away, pet-friendly confirmed"
      }
    ],
    "next_actions": [
      "建议前往杭州博物馆避雨",
      "如有需要可前往浙江大学动物医院（12分钟车程）"
    ],
    "live_constraints_applied": {
      "remaining_budget": 2000,
      "remaining_minutes": 180,
      "weather_avoid": ["rain"]
    }
  }
}
```

---

### 4.4 POST /v1/trip/replace-stop（单点替换）

#### 请求

```json
{
  "user_id": "string",
  "session_id": "string",
  "failed_stop": {
    "name": "西湖风景区",
    "id": "attr_001"
  },
  "current_location": { "lat": 30.246, "lon": 120.147 },
  "max_results": 3
}
```

#### 响应

```json
{
  "status": "success",
  "data": {
    "failed_stop": {
      "name": "西湖风景区",
      "id": "attr_001"
    },
    "alternatives": [
      {
        "name": "中国丝绸博物馆",
        "id": "attr_002",
        "compatibility_score": 85,
        "distance_km": 2.1,
        "visit_minutes": 90,
        "rationale": "same category (outdoor), 2.1 km away, pet-friendly confirmed"
      }
    ]
  }
}
```

---

### 4.5 GET /v1/user/{user_id}/profile

#### 响应

```json
{
  "status": "success",
  "data": {
    "user_id": "user_123",
    "pet": {
      "type": "dog",
      "breed": "金毛",
      "age": 3,
      "weight": 25.5,
      "health_status": "healthy",
      "vaccination_records": "完整",
      "has_pet_certificate": true
    },
    "preferences": {
      "budget": "comfort",
      "pace": "moderate",
      "hotel_area": "西湖区",
      "transport_mode": "driving"
    },
    "recent_trips": [
      {
        "plan_id": "plan_789",
        "city": "杭州",
        "date": "2026-05-01",
        "days": 3,
        "timestamp": "2026-04-24T10:30:00Z"
      }
    ],
    "saved_at": "2026-04-24T10:00:00Z"
  }
}
```

---

### 4.6 GET /v1/chat/history

#### 请求参数

- `user_id`: string（必填）
- `session_id`: string（必填）
- `limit`: int（可选，默认 20）

#### 响应

```json
{
  "status": "success",
  "data": {
    "messages": [
      {
        "role": "user",
        "content": "我想带金毛去杭州玩",
        "timestamp": "2026-04-24T10:00:00Z"
      },
      {
        "role": "assistant",
        "content": "好的，请问您计划什么时候出发？",
        "timestamp": "2026-04-24T10:00:05Z"
      }
    ]
  }
}
```

---

## 五、字段对照表

### 5.1 行程相关

| 前端使用 | Schema 路径 | 类型 | 说明 |
|----------|-------------|------|------|
| 方案名称 | `itineraries[].option` | string | Premium/Comfort/Economy |
| 酒店档次 | `itineraries[].hotel_tier` | string | luxury/comfort/budget |
| 单晚价格 | `itineraries[].hotel_nightly_price` | number | 元 |
| 总费用 | `itineraries[].total_cost_cny` | number | 元 |
| 总公里数 | `itineraries[].total_km` | number | km |
| 第几天 | `itineraries[].day_plans[].day` | number | 1, 2, 3... |
| 出发地 | `itineraries[].day_plans[].legs[].from` | string | 景点/酒店名 |
| 目的地 | `itineraries[].day_plans[].legs[].to` | string | 景点名 |
| 距离 | `itineraries[].day_plans[].legs[].distance_km` | number | km |
| 行车时间 | `itineraries[].day_plans[].legs[].travel_minutes` | number | 分钟 |
| 游览时间 | `itineraries[].day_plans[].legs[].visit_minutes` | number | 分钟 |

### 5.2 预算相关

| 前端使用 | Schema 路径 | 类型 | 说明 |
|----------|-------------|------|------|
| 住宿费 | `itineraries[].cost_breakdown.hotel` | number | 元 |
| 餐饮费 | `itineraries[].cost_breakdown.meals` | number | 元 |
| 宠物费 | `itineraries[].cost_breakdown.pet_fee` | number | 元 |
| 交通费 | `itineraries[].cost_breakdown.transport` | number | 元 |
| 门票费 | `itineraries[].cost_breakdown.tickets` | number | 元 |
| 估算总价 | `budget_estimate.total_estimate` | number | 元 |

### 5.3 医院相关

| 前端使用 | Schema 路径 | 类型 | 说明 |
|----------|-------------|------|------|
| 紧急程度 | `hospital_recommendations.severity` | string | Low/Medium/High/Emergency |
| 医院名称 | `hospital_recommendations.candidates[].name` | string | |
| 预计时间 | `hospital_recommendations.candidates[].eta_minutes` | number | 分钟 |
| 能力评分 | `hospital_recommendations.candidates[].capability_score` | number | 0-100 |
| 营业时间 | `hospital_recommendations.candidates[].opening_hours` | string | |

### 5.4 天气相关

| 前端使用 | Schema 路径 | 类型 | 说明 |
|----------|-------------|------|------|
| 当前温度 | `retrieval_summary.weather.now.temp_c` | number | ℃ |
| 天气文字 | `retrieval_summary.weather.now.text` | string | 晴/阴/雨 |
| 体感温度 | `retrieval_summary.weather.now.feels_like_c` | number | ℃ |
| 湿度 | `retrieval_summary.weather.now.humidity_pct` | number | % |

---

## 六、团队确认签字

### 6.1 Schema 版本信息

| 项目 | 内容 |
|------|------|
| Schema 版本 | v1.0 |
| 创建日期 | 2026-04-24 |
| 基于代码 | agent1_orchestrator.py, agent2_retrieval.py, agent3_planning.py, helper.py |

### 6.2 确认事项

请各团队确认以下事项：

#### 后端团队确认

- [ ] Agent3 输出字段与 Schema 定义一致
- [ ] 存入 Cosmos DB 的结构与 Schema 定义一致
- [ ] API 返回的 JSON 结构与 Schema 定义一致
- [ ] 不在 Schema 中的字段不对外暴露

#### 前端团队确认

- [ ] 已阅读并理解 Schema 定义
- [ ] UI 渲染严格基于 Schema 字段
- [ ] 不访问 Schema 定义之外的字段
- [ ] 对 Schema 中未定义字段的需求，提交 Issue 讨论

### 6.3 签字

| 角色 | 姓名 | 日期 | 签字 |
|------|------|------|------|
| 后端负责人 | | | |
| 前端负责人 | | | |
| 项目经理 | | | |

---

## 七、Schema 变更记录

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| v1.0 | 2026-04-24 | 初始版本，基于真实代码结构 | |

---

*本文档为团队内部数据接口契约，请妥善保管。*
*后续 Schema 变更需经过团队评审并更新版本号。*
