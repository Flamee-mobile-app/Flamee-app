"""Phát hiện khủng hoảng tâm lý & nội dung an toàn."""
from __future__ import annotations

import re
from typing import Optional

from app.config import settings

# Từ khóa tiếng Việt fallback nếu không gọi được OpenAI Moderation API
_CRISIS_REGEX = re.compile(
    r"tự\s*tử|tự\s*vẫn|muốn\s*chết|chết\s*đi|kết\s*thúc\s*cuộc\s*sống|"
    r"không\s*muốn\s*sống|biến\s*mất\s*khỏi\s*thế\s*giới|rạch\s*tay|"
    r"tự\s*hại|tự\s*sát|suicide|kill\s*myself|want\s*to\s*die",
    re.IGNORECASE,
)

# Hotline chính thống hỗ trợ khủng hoảng tại Việt Nam
# (Cần được Pháp lý/người có chuyên môn duyệt trước khi phát hành)
CRISIS_HELPLINES = [
    {
        "name": "Đường dây nóng Ngày Mai (Hỗ trợ người trầm cảm/khủng hoảng)",
        "phone": "096 306 1414",
    },
    {
        "name": "Viện Sức khỏe Tâm thần - Bệnh viện Bạch Mai",
        "phone": "024 3869 3731",
    },
    {
        "name": "Tổng đài Quốc gia Bảo vệ Trẻ em & Thanh thiếu niên",
        "phone": "111",
    },
]


def detect_crisis_signals(text: Optional[str]) -> bool:
    """Phát hiện dấu hiệu khủng hoảng/tự hại.

    Ưu tiên OpenAI Moderation API (miễn phí, phân loại self-harm).
    Fallback regex nếu không có API key hoặc gọi thất bại.
    """
    if not text or not text.strip():
        return False

    if settings.openai_api_key:
        try:
            import httpx

            resp = httpx.post(
                "https://api.openai.com/v1/moderations",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={"input": text},
                timeout=3.0,
            )
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                if results:
                    categories = results[0].get("categories", {}) or {}
                    if any(
                        categories.get(k)
                        for k in ("self-harm", "self-harm/intent", "self-harm/instructions", "violence")
                    ):
                        return True
        except Exception:
            pass

    return bool(_CRISIS_REGEX.search(text))


def get_safety_intervention_nudge(
    partner_nickname: str,
    user_nickname: str,
) -> dict:
    """Trả về gợi ý an toàn + hotline khi phát hiện khủng hoảng."""
    return {
        "observation": f"{partner_nickname} đang có dấu hiệu khủng hoảng tâm lý nghiêm trọng.",
        "action_type": "call",
        "draft": (
            f"{partner_nickname} ơi, mình đang rất lo cho bạn. "
            "Hãy nghe máy của mình nhé, mình luôn ở đây bên bạn ❤️"
        ),
        "reason": (
            "Dấu hiệu khủng hoảng cần sự kết nối trực tiếp ngay lập tức "
            "thay vì tin nhắn thông thường."
        ),
        "tone": "supportive",
        "is_crisis": True,
        "helplines": CRISIS_HELPLINES,
    }


__all__ = ["detect_crisis_signals", "get_safety_intervention_nudge", "CRISIS_HELPLINES"]