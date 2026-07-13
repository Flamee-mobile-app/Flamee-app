# AI Module & Smart Logic

> Phần "thông minh" của Flamee. Tách riêng khỏi CRUD để dễ bảo trì và swap provider.

---

## 1. Tổng quan

### Vấn đề cần giải quyết
1. **AI provider thay đổi**: OpenAI, Anthropic, local LLM — mỗi cái có API khác nhau.
2. **AI có thể lỗi**: timeout, rate limit, content filter. Phải fallback gracefully.
3. **Prompt phân tán**: dễ sửa chỗ này quên chỗ kia.
4. **Chi phí AI**: gọi không kiểm soát là tốn tiền.

### Giải pháp: 4 module tách biệt

```
ai/
├── provider.py           # Interface + factory
├── openai_provider.py    # OpenAI implementation
├── anthropic_provider.py # Anthropic implementation
├── ollama_provider.py    # Local LLM (Ollama)
└── prompts.py            # Tất cả prompt ở 1 chỗ

smart/
├── mood_analyzer.py      # Phân tích mood 3 ngày
├── date_suggester.py     # Gợi ý date idea
├── mission_picker.py     # Daily mission (phase 2)
└── reminder_scheduler.py # Smart reminder (phase 2)
```

---

## 2. AI Provider — Strategy Pattern

### 2.1. Interface

```python
# ai/provider.py
from typing import Protocol

class AIProvider(Protocol):
    """Interface cho mọi AI provider."""

    async def chat(
        self,
        system: str,
        user: str,
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 500,
        json_mode: bool = False,
    ) -> str:
        """Gọi AI chat, trả về text (hoặc JSON string nếu json_mode=True)."""
        ...

    async def embed(self, text: str) -> list[float]:
        """Tạo embedding vector (cho phase 2)."""
        ...
```

### 2.2. Factory — chọn provider qua config

```python
# ai/provider.py
from app.config import settings

def get_ai_provider() -> AIProvider:
    match settings.ai_provider:
        case "openai":
            return OpenAIProvider(api_key=settings.openai_api_key)
        case "anthropic":
            return AnthropicProvider(api_key=settings.anthropic_api_key)
        case "ollama":
            return OllamaProvider(base_url=settings.ollama_base_url)
        case _:
            raise ValueError(f"Unknown AI provider: {settings.ai_provider}")
```

### 2.3. Config linh hoạt

```python
# config.py
class Settings(BaseSettings):
    # AI Provider: openai | anthropic | ollama
    ai_provider: str = "openai"

    # Model - tuỳ chỉnh được
    ai_chat_model: str = "gpt-4o-mini"
    ai_embed_model: str = "text-embedding-3-small"

    # Provider-specific
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    ollama_base_url: str = "http://localhost:11434"

    # Limits
    ai_max_tokens: int = 500
    ai_temperature: float = 0.7
    ai_timeout_seconds: int = 30

    class Config:
        env_prefix = "FLAMEE_"
```

**Env file mẫu**:
```bash
FLAMEE_AI_PROVIDER=openai
FLAMEE_AI_CHAT_MODEL=gpt-4o-mini
FLAMEE_OPENAI_API_KEY=sk-xxx

# Hoặc đổi sang Anthropic:
# FLAMEE_AI_PROVIDER=anthropic
# FLAMEE_AI_CHAT_MODEL=claude-3-5-haiku-20241022
# FLAMEE_ANTHROPIC_API_KEY=sk-ant-xxx

# Hoặc local Ollama:
# FLAMEE_AI_PROVIDER=ollama
# FLAMEE_AI_CHAT_MODEL=llama3.2
# FLAMEE_OLLAMA_BASE_URL=http://localhost:11434
```

### 2.4. Implementation mẫu (OpenAI)

```python
# ai/openai_provider.py
import httpx
from app.config import settings

class OpenAIProvider:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.openai.com/v1"
        self.timeout = settings.ai_timeout_seconds

    async def chat(
        self,
        system: str,
        user: str,
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 500,
        json_mode: bool = False,
    ) -> str:
        model = model or settings.ai_chat_model
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json=payload,
            )
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]
```

### 2.5. Xử lý lỗi AI

```python
# ai/provider.py
class AIService:
    """Wrapper có retry + fallback."""

    def __init__(self, provider: AIProvider):
        self.provider = provider

    async def chat_safe(self, system: str, user: str, *, json_mode: bool = True) -> str | None:
        """
        Gọi AI có retry. Trả None nếu fail hết (để caller fallback rule-based).
        """
        for attempt in range(2):
            try:
                return await self.provider.chat(
                    system=system,
                    user=user,
                    json_mode=json_mode,
                )
            except (httpx.TimeoutException, httpx.HTTPStatusError) as e:
                logger.warning(f"AI call failed (attempt {attempt+1}): {e}")
                if attempt == 1:
                    logger.error("AI call failed all attempts")
                    return None
                await asyncio.sleep(1)
```

**Nguyên tắc**: AI fail → trả về rule-based (vẫn hoạt động). Không bao giờ để AI lỗi làm crash app.

---

## 3. Smart Logic chi tiết

### 3.1. Mood Analyzer — phân tích 3 ngày

**File**: `smart/mood_analyzer.py`

**Mục tiêu**: Phát hiện mood tiêu cực kéo dài → cảnh báo partner.

**Input**:
```python
@dataclass
class MoodAnalyzerInput:
    moods: list[Mood]              # 3 ngày gần nhất
    user_name: str                  # Tên user
    partner_name: str               # Tên partner
    couple_language: str = "vi"     # Ngôn ngữ output
```

**Output**:
```python
@dataclass
class MoodAlert:
    risk_level: str                 # 'none' | 'low' | 'medium' | 'high'
    should_notify: bool
    title: str
    message: str
    actions: list[str]              # 3 hành động gợi ý cho partner
```

**Thuật toán 2 bước**:

#### Bước 1: Rule-based pre-check (chạy offline, không tốn tiền)

```python
NEGATIVE_MOODS = {"sad", "angry", "tired", "anxious", "sick"}

def _rule_based_check(moods: list[Mood]) -> str | None:
    """
    Nếu 3 ngày liên tiếp đều negative → return 'medium'.
    Nếu 2 ngày âm + 1 ngày trung tính → return 'low'.
    Còn lại → None (không cần AI).
    """
    if len(moods) < 3:
        return None

    negative_count = sum(1 for m in moods if m.mood in NEGATIVE_MOODS)
    avg_intensity = sum(m.intensity for m in moods) / len(moods)

    if negative_count == 3 and avg_intensity < 4:
        return "medium"  # 3 ngày liên tiếp negative + intensity thấp
    if negative_count >= 2:
        return "low"
    return None
```

#### Bước 2: AI enrichment (chỉ gọi khi rule-based trigger)

```python
async def analyze_mood(input: MoodAnalyzerInput) -> MoodAlert | None:
    # Step 1: rule-based
    risk = _rule_based_check(input.moods)
    if risk is None:
        return None

    # Step 2: AI để generate message + actions tế nhị
    mood_summary = "\n".join(
        f"- {m.date}: {m.mood} (cường độ {m.intensity}/10)"
        + (f" — note: \"{m.note}\"" if m.note else "")
        for m in input.moods
    )

    prompt_user = f"""
Partner của {input.user_name} (tên {input.partner_name}) đã có {len(input.moods)} ngày tâm trạng tiêu cực.

Mood gần đây:
{mood_summary}

Trả về JSON:
{{
  "title": "Tiêu đề ngắn (< 50 ký tự)",
  "message": "Tin nhắn cảnh báo cho partner (< 200 ký tự, nhẹ nhàng, không gây hoang mang)",
  "actions": ["hành động 1", "hành động 2", "hành động 3"]
}}

Nguyên tắc:
- Nhẹ nhàng, không chẩn đoán bệnh
- Khuyến khích quan tâm
- Hành động cụ thể, dễ làm
- Viết bằng tiếng Việt
"""

    result = await ai_service.chat_safe(
        system=MOOD_ANALYZER_SYSTEM,
        user=prompt_user,
        json_mode=True,
    )

    if not result:
        # Fallback rule-based
        return _fallback_alert(risk)

    data = json.loads(result)
    return MoodAlert(
        risk_level=risk,
        should_notify=True,
        title=data["title"],
        message=data["message"],
        actions=data["actions"],
    )
```

**Trigger**:
- Sau khi user checkin mood → tự động chạy analyzer trong background.
- Hoặc cronjob tối 21:00 phân tích.

**Output ví dụ**:
```json
{
  "risk_level": "medium",
  "should_notify": true,
  "title": "Người ấy có chuyện buồn",
  "message": "Anh Minh đã có vài ngày tâm trạng không tốt. Hãy dành chút thời gian quan tâm nhé.",
  "actions": [
    "Gọi điện hỏi thăm tối nay",
    "Nấu món ăn yêu thích của anh ấy",
    "Lên kế hoạch đi chơi cuối tuần"
  ]
}
```

### 3.2. Date Suggester — gợi ý date idea

**File**: `smart/date_suggester.py`

**Mục tiêu**: Gợi ý date idea cá nhân hoá (không random).

**Input**:
```python
@dataclass
class DateContext:
    couple_id: str
    category: str | None = None        # Optional filter
    budget: float | None = None
    city: str | None = None
    mood: str | None = None            # Mood hiện tại của couple
    weather: str | None = None         # sunny | rainy | cloudy
    count: int = 5
```

**Output**:
```python
@dataclass
class DateSuggestion:
    template_id: str
    title: str
    description: str
    estimated_cost: float
    duration_min: int
    difficulty: str
    steps: list[str]
    tips: list[str]
    match_reason: str                  # Tại sao AI chọn cái này
    confidence: float                  # 0-1
```

**Thuật toán 3 bước**:

#### Bước 1: Lấy candidates từ DB (rule-based filter)

```python
def _get_candidates(ctx: DateContext, exclude_ids: set[str]) -> list[DateTemplate]:
    """Lấy template phù hợp từ DB, lọc theo category/budget, loại đã làm."""
    query = db.query(DatePlanTemplate)

    if ctx.category:
        query = query.filter(DatePlanTemplate.category == ctx.category)
    if ctx.budget:
        query = query.filter(DatePlanTemplate.estimated_cost <= ctx.budget)
    if ctx.weather == "rainy":
        query = query.filter(DatePlanTemplate.weather_dependent == False)

    templates = query.limit(20).all()
    return [t for t in templates if t.id not in exclude_ids]
```

**Lấy exclude_ids** (đã làm gần đây):
```python
recent = db.query(DatePlan.template_id).filter(
    DatePlan.couple_id == ctx.couple_id,
    DatePlan.start_time >= datetime.now() - timedelta(days=60),
    DatePlan.template_id.isnot(None),
).all()
exclude_ids = {r.template_id for r in recent if r.template_id}
```

#### Bước 2: AI ranking

```python
async def rank_suggestions(
    candidates: list[DateTemplate],
    ctx: DateContext,
    couple_prefs: dict,
) -> list[DateSuggestion]:
    """Gửi candidates cho AI, AI chọn top N phù hợp nhất."""

    candidates_text = "\n\n".join(
        f"ID: {c.id}\n"
        f"Title: {c.title}\n"
        f"Category: {c.category}\n"
        f"Cost: {c.estimated_cost} VND\n"
        f"Duration: {c.duration_min} phút\n"
        f"Best for: {c.best_for}\n"
        f"Description: {c.description}"
        for c in candidates
    )

    prompt_user = f"""
Context:
- Couple preferences: {couple_prefs}
- Mood hiện tại: {ctx.mood or 'không rõ'}
- Thời tiết: {ctx.weather or 'không rõ'}
- Ngân sách: {ctx.budget} VND
- Số lượng cần chọn: {ctx.count}

Danh sách date idea candidates:
{candidates_text}

Hãy chọn {ctx.count} idea phù hợp nhất. Với mỗi idea, giải thích ngắn (< 50 ký tự) tại sao phù hợp.

Trả về JSON array:
[
  {{"template_id": "...", "match_reason": "...", "confidence": 0.9}},
  ...
]

Sắp xếp theo confidence giảm dần.
"""

    result = await ai_service.chat_safe(
        system=DATE_SUGGESTER_SYSTEM,
        user=prompt_user,
        json_mode=True,
    )

    # Parse + merge với candidate data
    ranked = json.loads(result)
    return _build_suggestions(ranked, candidates)
```

#### Bước 3: Fallback khi AI lỗi

```python
def _fallback_suggestions(candidates: list[DateTemplate], count: int) -> list[DateSuggestion]:
    """Khi AI lỗi, lấy top theo popularity."""
    sorted_candidates = sorted(candidates, key=lambda c: c.popularity, reverse=True)
    return [
        DateSuggestion(
            template_id=c.id,
            title=c.title,
            description=c.description,
            estimated_cost=c.estimated_cost,
            duration_min=c.duration_min,
            difficulty=c.difficulty,
            steps=json.loads(c.steps or "[]"),
            tips=json.loads(c.tips or "[]"),
            match_reason="Phổ biến cho các cặp đôi",
            confidence=0.5,
        )
        for c in sorted_candidates[:count]
    ]
```

**Cost optimization**:
- Cache kết quả AI trong 24h (Redis hoặc in-memory).
- Chỉ gọi AI khi user bấm "Refresh gợi ý".

### 3.3. Mission Picker — Phase 2 (chỉ thiết kế)

**File**: `smart/mission_picker.py`

**Mục tiêu**: Daily mission không random, dựa trên context.

**Logic**:
```python
def pick_mission(couple: Couple, recent_moods: list[Mood], history: list[Mission]) -> Mission:
    # 1. Xác định tone từ mood
    tone = _infer_tone(recent_moods)  # 'fun' | 'romantic' | 'active' | 'calm'

    # 2. Lọc mission templates theo tone
    candidates = get_mission_templates(tone=tone)

    # 3. Loại mission đã làm gần đây
    exclude_ids = {m.template_id for m in history[-14:]}
    candidates = [m for m in candidates if m.id not in exclude_ids]

    # 4. Ưu tiên mission cho streak milestone
    streak = compute_streak(history)
    if streak in (6, 13, 29):  # Sắp đạt milestone
        candidates = [m for m in candidates if m.is_milestone]
        candidates.sort(key=lambda m: -m.reward_points)

    return candidates[0] if candidates else random.choice(get_all_templates())
```

### 3.4. Reminder Scheduler — Phase 2 (chỉ thiết kế)

**File**: `smart/reminder_scheduler.py`

**Logic smart reminder**:
```python
class ReminderScheduler:
    def __init__(self):
        self.user_patterns: dict[int, UserPattern] = {}  # cache

    def should_send_mood_reminder(self, user_id: int) -> bool:
        """Học thói quen: nếu user thường checkin 21:00, nhắc lúc 21:30."""
        pattern = self._get_pattern(user_id)
        now = datetime.now()

        # Quiet hours: 22:00 - 07:00 không nhắc
        if now.hour >= 22 or now.hour < 7:
            return False

        # Đã checkin hôm nay chưa
        if self.has_checked_in_today(user_id):
            return False

        # Nhắc 30 phút sau giờ checkin trung bình
        usual_hour = pattern.avg_checkin_hour
        if now.hour >= usual_hour + 0.5 and not pattern.reminded_today:
            return True

        return False
```

---

## 4. Prompts — tất cả ở 1 chỗ

**File**: `ai/prompts.py`

```python
# System prompts

MOOD_ANALYZER_SYSTEM = """
Bạn là trợ lý AI chuyên phân tích tâm trạng nhẹ nhàng cho ứng dụng cặp đôi.

Nguyên tắc:
- Nhẹ nhàng, không xâm phạm, không chẩn đoán bệnh
- Tin nhắn ngắn gọn, dễ hiểu
- Hành động cụ thể, dễ thực hiện
- Luôn viết bằng tiếng Việt
- Tránh từ ngữ tiêu cực nặng nề (trầm cảm, bệnh, ...)
"""

DATE_SUGGESTER_SYSTEM = """
Bạn là trợ lý AI gợi ý ý tưởng hẹn hò cho các cặp đôi.

Nhiệm vụ:
- Xếp hạng các date idea theo context (mood, thời tiết, preferences, ngân sách)
- Giải thích ngắn gọn tại sao idea phù hợp
- Output JSON array

Nguyên tắc:
- Tin tưởng vào dữ liệu đầu vào, không bịa
- Confidence cao = match tốt
- Viết bằng tiếng Việt
"""
```

---

## 5. Tích hợp vào Service

**Service gọi Smart Logic, không gọi AI trực tiếp**:

```python
# services/mood_service.py
from app.smart.mood_analyzer import analyze_mood

class MoodService:
    def __init__(self, mood_repo: MoodRepository, ai: AIService):
        self.mood_repo = mood_repo
        self.ai = ai

    async def create_mood(self, user_id: str, couple_id: str, data: CreateMoodRequest) -> Mood:
        # 1. Lưu mood
        mood = self.mood_repo.create(user_id=user_id, couple_id=couple_id, data=data)

        # 2. Background: phân tích mood cho partner (không block response)
        asyncio.create_task(self._analyze_and_notify(user_id, couple_id, mood))

        return mood

    async def _analyze_and_notify(self, user_id: str, couple_id: str, mood: Mood):
        # Lấy 3 mood gần nhất
        recent = self.mood_repo.get_recent(user_id, days=3)

        # Phân tích
        alert = await analyze_mood(
            input=MoodAnalyzerInput(
                moods=recent,
                user_name=...,
                partner_name=...,
            ),
            ai=self.ai,
        )

        if alert and alert.should_notify:
            # Gửi notification cho partner
            await notification_service.send_alert(couple_id, exclude_user=user_id, alert=alert)
```

---

## 6. Testing Smart Logic

```python
# tests/test_mood_analyzer.py

def test_rule_based_3_negative_days():
    moods = [
        Mood(mood="sad", intensity=3, date="2026-07-08"),
        Mood(mood="tired", intensity=4, date="2026-07-09"),
        Mood(mood="sad", intensity=2, date="2026-07-10"),
    ]
    result = _rule_based_check(moods)
    assert result == "medium"

def test_rule_based_no_alert():
    moods = [
        Mood(mood="happy", intensity=7, date="2026-07-08"),
        Mood(mood="calm", intensity=5, date="2026-07-09"),
        Mood(mood="love", intensity=8, date="2026-07-10"),
    ]
    assert _rule_based_check(moods) is None

async def test_fallback_when_ai_fails():
    # Mock AI trả về None
    ai = MockAIService(return_value=None)
    moods = [...3 negative moods...]

    alert = await analyze_mood(moods=moods, ai=ai, ...)
    assert alert is not None  # Vẫn trả về nhờ fallback rule-based
    assert alert.risk_level == "medium"
```

---

## 7. Cost Optimization

| Kỹ thuật | Tiết kiệm |
|----------|-----------|
| Rule-based pre-check trước khi gọi AI | 70-80% calls |
| Cache kết quả date suggestion 24h | 90% calls |
| AI ranking thay vì AI generation | 50% tokens |
| max_tokens=500 cho short response | Giảm chi phí |
| Rate limit: 10 AI calls/user/hour | Chống abuse |
| Dùng `gpt-4o-mini` thay vì `gpt-4` | 30x rẻ hơn |

---

## 8. Roadmap Smart Features

| Feature | MVP | Phase 2 | Phase 3 |
|---------|-----|---------|---------|
| Mood rule-based check | ✅ | | |
| Mood AI enrichment | ✅ | | |
| Date AI ranking | ✅ | | |
| Date AI generation (từ đầu) | | ✅ | |
| Mission picker | | ✅ | |
| Smart reminder | | ✅ | |
| Compatibility score | | | ✅ |
| Love letter generation | | | ✅ |
| Embedding-based recommendations | | | ✅ |