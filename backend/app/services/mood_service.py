"""Service cho Check-in Mood và Mood Alerts."""
from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import BackgroundTasks
from supabase import Client

from app.ai.safety import detect_crisis_signals
from app.config import settings
from app.core.constants import MoodType
from app.core.exceptions import ValidationError
from app.models.mood import Mood, MoodAlert
from app.repositories.mood_repo import MoodAlertRepository, MoodRepository
from app.utils.ids import generate_uuid
from app.utils.time import now_utc

logger = logging.getLogger(__name__)

# Phân loại cảm xúc — dùng MoodType từ core.constants
POSITIVE_MOODS = {
    MoodType.LOVE.value,
    MoodType.HAPPY.value,
    MoodType.EXCITED.value,
    MoodType.CALM.value,
}
NEGATIVE_MOODS = {
    MoodType.SAD.value,
    MoodType.ANGRY.value,
    MoodType.ANXIOUS.value,
    MoodType.TIRED.value,
    MoodType.SICK.value,
}

VALID_SHARE_LEVELS = {"all", "mood_only", "private"}

MAX_REASONS = 3
MAX_NOTE_LEN = 140


def _normalize_share_level(value: str | None, is_private: bool) -> tuple[str, bool]:
    if value is not None:
        if value not in VALID_SHARE_LEVELS:
            raise ValidationError(
                f"share_level phải là một trong {sorted(VALID_SHARE_LEVELS)}"
            )
    # Legacy callers may send is_private=True while share_level defaults to all.
    # Conflicting privacy fields must never widen visibility.
    normalized = "private" if is_private else (value or "all")
    if normalized == "private":
        return "private", True
    return normalized, False


class MoodService:
    def __init__(self, db: Client) -> None:
        self.db = db
        self.mood_repo = MoodRepository(db)
        self.alert_repo = MoodAlertRepository(db)

    # ------------------------------------------------------------------
    # CRUD check-in
    # ------------------------------------------------------------------
    def create_mood(
        self,
        couple_id: str,
        user_id: str,
        mood: str,
        intensity: int,
        note: Optional[str],
        is_private: bool,
        background_tasks: BackgroundTasks = None,
        mood_score: int = 3,
        reasons: Optional[List[str]] = None,
        share_level: str = "all",
    ) -> Mood:
        # Validate sớm — DB không raise khi thiếu cột
        if mood not in {m.value for m in MoodType}:
            raise ValidationError(
                f"mood phải là một trong: {[m.value for m in MoodType]}"
            )
        if not 1 <= mood_score <= 5:
            raise ValidationError("mood_score phải nằm trong 1..5")
        if not 1 <= intensity <= 10:
            raise ValidationError("intensity phải nằm trong 1..10")
        if reasons and len(reasons) > MAX_REASONS:
            raise ValidationError(f"Chỉ được chọn tối đa {MAX_REASONS} lý do")
        if note and len(note) > MAX_NOTE_LEN:
            raise ValidationError(f"Ghi chú tối đa {MAX_NOTE_LEN} ký tự")

        share_level, is_private = _normalize_share_level(share_level, is_private)

        mood_id = f"mood_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        mood_data = {
            "id": mood_id,
            "couple_id": couple_id,
            "user_id": user_id,
            "mood": mood,
            "intensity": intensity,
            "note": note,
            "is_private": is_private,
            "mood_score": mood_score,
            "reasons": reasons or [],
            "share_level": share_level,
            "created_at": now_iso,
        }
        new_mood = self.mood_repo.create_mood(mood_data)

        # Smart Nudge chỉ tạo khi KHÔNG private
        if share_level != "private" and couple_id and background_tasks:
            # Lưu ý: KHÔNG log note ở đây (bảo vệ PII)
            background_tasks.add_task(
                self._trigger_nudge_for_partner,
                couple_id=couple_id,
                sender_id=user_id,
                mood_score=mood_score,
                reasons=reasons,
                note=note,
                share_level=share_level,
            )

        return new_mood

    def _trigger_nudge_for_partner(
        self,
        couple_id: str,
        sender_id: str,
        mood_score: int,
        reasons: Optional[List[str]],
        note: Optional[str],
        share_level: str,
    ) -> None:
        """Tìm partner và kích hoạt Smart Nudge."""
        try:
            res = (
                self.db.table("couples")
                .select("partner1_id, partner2_id")
                .eq("id", couple_id)
                .maybe_single()
                .execute()
            )
            if not res or not res.data:
                return
            couple = res.data
            partner_id = (
                couple.get("partner2_id")
                if couple.get("partner1_id") == sender_id
                else couple.get("partner1_id")
            )
            if not partner_id:
                return

            from app.repositories.smart_nudge_repo import (
                SmartNudgeRepository,
                TinyMomentRepository,
            )
            from app.services.smart_nudge_service import SmartNudgeService

            nudge_service = SmartNudgeService(
                SmartNudgeRepository(self.db),
                TinyMomentRepository(self.db),
                db_client=self.db,
            )
            nudge_service.trigger_nudge_generation(
                couple_id=couple_id,
                sender_id=sender_id,
                partner_id=partner_id,
                mood_score=mood_score,
                reasons=reasons,
                note=note,
                share_level=share_level,
            )
        except Exception as exc:
            # Chỉ log debug (không log note ở đây)
            logger.debug("trigger_nudge_for_partner skipped: %s", exc)

    def get_my_moods(self, user_id: str, limit: int = 20, offset: int = 0) -> List[Mood]:
        return self.mood_repo.get_recent_moods(user_id, limit, offset)

    def get_partner_latest_mood_and_alert(self, partner_id: str, couple_id: str):
        """Trả về mood mới nhất ĐÃ LỌC scope + alert (không bao gồm private)."""
        latest_mood = self.mood_repo.get_latest_shareable_mood(partner_id, couple_id)
        active_alert = self.alert_repo.get_active_alert_for_partner(partner_id, couple_id)
        return latest_mood, active_alert

    def delete_mood(self, mood_id: str, user_id: str) -> bool:
        return self.mood_repo.delete_mood(mood_id, user_id)

    # ------------------------------------------------------------------
    # Alert helpers (rule-based, an toàn + không log note)
    # ------------------------------------------------------------------
    def _check_and_trigger_ai_alert(
        self,
        user_id: str,
        couple_id: str,
        background_tasks: BackgroundTasks = None,
    ) -> None:
        recent_moods = self.mood_repo.get_recent_moods(user_id, limit=2)
        if not recent_moods:
            return

        latest_mood = recent_moods[0]
        # Chỉ cảnh báo dựa trên mood/intensity — KHÔNG dùng note trong prompt
        if latest_mood.share_level == "private":
            return

        latest_alert = self.alert_repo.get_latest_alert_for_user(user_id)
        if latest_alert:
            try:
                created_at_dt = datetime.fromisoformat(
                    latest_alert.created_at.replace("Z", "+00:00")
                )
                if (now_utc() - created_at_dt).total_seconds() < 4 * 3600:
                    return
            except Exception:
                pass

        if latest_mood.intensity >= 8:
            alert_type = (
                "positive"
                if latest_mood.mood.lower() in POSITIVE_MOODS
                else "negative"
            )
            self._create_pending_and_enqueue(
                recent_moods, alert_type, user_id, couple_id, background_tasks
            )
            return

        if len(recent_moods) == 2:
            mood_names = [m.mood.lower() for m in recent_moods]
            if all(m in POSITIVE_MOODS for m in mood_names):
                self._create_pending_and_enqueue(
                    recent_moods, "positive", user_id, couple_id, background_tasks
                )
            elif all(m in NEGATIVE_MOODS for m in mood_names):
                self._create_pending_and_enqueue(
                    recent_moods, "negative", user_id, couple_id, background_tasks
                )

    def _create_pending_and_enqueue(
        self,
        moods: List[Mood],
        alert_type: str,
        user_id: str,
        couple_id: str,
        background_tasks: BackgroundTasks = None,
    ) -> None:
        alert_id = f"alert_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        alert_data = {
            "id": alert_id,
            "couple_id": couple_id,
            "user_id": user_id,
            "alert_type": alert_type,
            "title": "Đang phân tích...",
            "message": "AI đang phân tích cảm xúc của người yêu bạn...",
            "advice": "...",
            "is_read": False,
            "created_at": now_iso,
        }
        self.alert_repo.create_alert(alert_data)

        if background_tasks:
            background_tasks.add_task(
                self._generate_ai_alert,
                alert_id,
                moods,
                alert_type,
                user_id,
                couple_id,
            )
        else:
            self._generate_ai_alert(alert_id, moods, alert_type, user_id, couple_id)

    def _generate_ai_alert(
        self,
        alert_id: str,
        moods: List[Mood],
        alert_type: str,
        user_id: str,
        couple_id: str,
    ) -> None:
        from app.ai.factory import get_ai_provider

        try:
            ai = get_ai_provider()
            system_prompt = (
                "Bạn là trợ lý AI tinh tế. Đọc lịch sử cảm xúc (không có ghi chú) "
                "của người dùng và đưa ra lời khuyên cho NGƯỜI YÊU của họ một cách "
                "nhẹ nhàng, thấu cảm. TUYỆT ĐỐI TRÁNH từ ngữ giật gân, làm quá vấn đề. "
                'Trả về ĐÚNG định dạng JSON: {"title": "...", "message": "...", "advice": "..."}. '
                "Không giải thích gì thêm."
            )
            # Chỉ gửi mood + intensity + share_level (KHÔNG gửi note)
            history_lines = [
                (
                    f"Lần {i+1}: Cảm xúc {m.mood} (Mức độ {m.intensity}/10, "
                    f"share_level={m.share_level})"
                )
                for i, m in enumerate(moods)
            ]
            history_text = (
                f"Loại cảnh báo: {alert_type.upper()}\n\n"
                "Lịch sử cảm xúc gần nhất:\n" + "\n".join(history_lines)
            )

            content = ai.chat_sync(system=system_prompt, user=history_text)
            data = _parse_json_object(content)
            update_data = {
                "title": data.get("title", "Có biến!"),
                "message": data.get(
                    "message", "Người yêu bạn đang có những cảm xúc mạnh mẽ."
                ),
                "advice": data.get("advice", "Hãy nhắn tin hỏi thăm ngay nhé!"),
            }
            self.alert_repo.update_alert(alert_id, update_data)
        except Exception as exc:
            logger.debug("AI alert generation failed (kept placeholder): %s", exc)

    # ------------------------------------------------------------------
    # Daily digest
    # ------------------------------------------------------------------
    def get_or_generate_daily_digest(
        self,
        user_id: str,
        partner_id: str,
        couple_id: str,
        background_tasks: BackgroundTasks = None,
    ) -> Optional[MoodAlert]:
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        digest = self.alert_repo.get_daily_digest_for_date(user_id, today_str, couple_id)
        if digest:
            if digest.title == "Đang tổng hợp...":
                return None
            return digest

        from datetime import timedelta

        yesterday_str = (
            datetime.now(timezone.utc) - timedelta(days=1)
        ).strftime("%Y-%m-%d")
        partner_moods = self.mood_repo.get_shareable_moods_by_date(
            partner_id, yesterday_str, couple_id
        )
        if not partner_moods:
            return None

        alert_id = f"alert_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        self.alert_repo.create_alert(
            {
                "id": alert_id,
                "couple_id": couple_id,
                "user_id": user_id,
                "alert_type": "daily_digest",
                "title": "Đang tổng hợp...",
                "message": "AI đang tổng hợp cảm xúc của ngày hôm qua...",
                "advice": "...",
                "is_read": False,
                "created_at": now_iso,
            }
        )
        return None

    def mark_alert_read(self, alert_id: str, user_id: str) -> bool:
        return self.alert_repo.mark_as_read(alert_id, user_id)


def _parse_json_object(text: str) -> dict:
    """Bóc tách JSON object từ chuỗi trả về của LLM (có thể bọc trong ```)."""
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return json.loads(cleaned.strip())
