"""Smart Nudge templates — fallback khi AI lỗi hoặc quá timeout."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_TEMPLATES_PATH = Path(__file__).parent / "data" / "nudge_templates.json"


@lru_cache(maxsize=1)
def _load_templates() -> dict:
    if _TEMPLATES_PATH.exists():
        with open(_TEMPLATES_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def _parse_json_object(text: str) -> dict:
    """Bóc tách JSON object từ output LLM (có thể bọc trong ```)."""
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return json.loads(cleaned.strip())


def get_template_nudge(
    mood_score: int,
    reasons: list[str] | None,
    partner_name: str = "Người yêu",
) -> dict[str, str]:
    """Chọn template theo mood_score (1..5) và lý do đầu tiên match được."""
    data = _load_templates()
    score_key = str(max(1, min(5, mood_score)))
    score_templates = data.get(score_key, data.get("3", {}))

    template = None
    if reasons:
        for r in reasons:
            if r in score_templates:
                template = score_templates[r]
                break

    if template is None:
        template = score_templates.get(
            "default",
            {
                "observation": f"{partner_name} vừa cập nhật cảm xúc hôm nay.",
                "action_type": "text",
                "draft": f"Hôm nay của {partner_name} thế nào rồi? Có gì kể cho mình nghe nhé!",
                "reason": "Kết nối và lắng nghe là cách tốt nhất để thấu hiểu người thương.",
                "tone": "supportive",
            },
        )

    return {
        "observation": template["observation"].replace("{partner_name}", partner_name),
        "action_type": template["action_type"],
        "draft": template["draft"].replace("{partner_name}", partner_name),
        "reason": template["reason"],
        "tone": template["tone"],
    }


__all__ = ["get_template_nudge", "_parse_json_object"]