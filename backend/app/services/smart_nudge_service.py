"""Smart Nudge — chuyển trạng thái của partner thành một việc nhỏ cụ thể."""
from __future__ import annotations

import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from app.ai.factory import get_ai_provider
from app.ai.nudge_templates import _parse_json_object, get_template_nudge
from app.ai.safety import (
    CRISIS_HELPLINES,
    detect_crisis_signals,
    get_safety_intervention_nudge,
)
from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.smart_nudge import SmartNudge, TinyMoment
from app.repositories.smart_nudge_repo import (
    SmartNudgeRepository,
    TinyMomentRepository,
)
from app.utils.ids import generate_uuid

logger = logging.getLogger(__name__)

# Theo "Smart Nudge – tài liệu tính năng" mục 6.5
VALID_ACTION_TYPES = {"text", "voice", "photo", "call", "other"}
VALID_TONES = {"gentle", "playful", "supportive", "celebratory"}
MAX_OBSERVATION_LEN = 120
MAX_DRAFT_LEN = 280
MAX_REASON_LEN = 100

# Theo "Smart Nudge – tài liệu tính năng" mục 5: 3 nudges/ngày, cooldown 4h
DAILY_QUOTA = 3
COOLDOWN_HOURS = 4
SNOOZE_HOURS = 2
EXPIRY_HOURS = 24
MAX_SNOOZE_COUNT = 1  # Snooze tối đa 1 lần (Plan mục 4)

# Giới hạn độ dài Nudge SLA cho 1 lần gọi AI
AI_SLA_SECONDS = 6.0


class SmartNudgeService:
    """Điều phối toàn bộ pipeline Smart Nudge."""

    def __init__(
        self,
        nudge_repo: SmartNudgeRepository,
        tiny_repo: TinyMomentRepository,
        db_client: Any = None,
    ) -> None:
        self.nudge_repo = nudge_repo
        self.tiny_repo = tiny_repo
        self.db = db_client

    # ------------------------------------------------------------------
    # Main pipeline
    # ------------------------------------------------------------------
    def trigger_nudge_generation(
        self,
        couple_id: str,
        sender_id: str,
        partner_id: str,
        mood_score: int,
        reasons: list[str] | None,
        note: str | None,
        share_level: str = "all",
    ) -> SmartNudge | None:
        # 1. Privacy
        if share_level == "private":
            return None

        # Hide private context before moderation, generation AND template fallback.
        if share_level == "mood_only":
            note = None
            reasons = None

        # 2. Quota: tối đa 3 nudges/ngày cho receiver
        now = datetime.now(timezone.utc)
        today_prefix = now.strftime("%Y-%m-%d")
        count_today = self.nudge_repo.count_nudges_today(
            couple_id=couple_id,
            receiver_id=partner_id,
            date_prefix=today_prefix,
        )
        if count_today >= DAILY_QUOTA:
            return None

        # 3. Cooldown: chỉ áp dụng khi nudge gần nhất status='new'
        latest = self.nudge_repo.get_latest_nudge(
            couple_id=couple_id, receiver_id=partner_id
        )
        if latest and latest.created_at and latest.status == "new":
            try:
                created_dt = datetime.fromisoformat(
                    latest.created_at.replace("Z", "+00:00")
                )
                if now - created_dt < timedelta(hours=COOLDOWN_HOURS):
                    return None
            except ValueError:
                pass

        # 4. Partner name
        partner_name = self._fetch_partner_name(partner_id)

        start_time = time.time()
        is_crisis = detect_crisis_signals(note)
        source = "ai_agent"
        helplines: list[dict] | None = None

        if is_crisis:
            content = get_safety_intervention_nudge(partner_name, "Bạn")
            content["is_crisis"] = True
            helplines = list(CRISIS_HELPLINES)
            source = "safety_intervention"
        else:
            content = self._generate_with_provider(
                mood_score=mood_score,
                reasons=reasons,
                note=note,
                share_level=share_level,
                partner_name=partner_name,
            )
            if content is None:
                content = get_template_nudge(mood_score, reasons, partner_name)
                source = "template"

        # 5. Validate + chuẩn hóa
        content = _sanitize_nudge_content(content)

        latency_ms = int((time.time() - start_time) * 1000)
        nudge_id = generate_uuid()
        now_iso = now.isoformat()
        expires_at = (now + timedelta(hours=EXPIRY_HOURS)).isoformat()

        nudge = self.nudge_repo.create(
            id=nudge_id,
            couple_id=couple_id,
            receiver_id=partner_id,
            partner_id=sender_id,
            status="new",
            observation=content["observation"],
            action_type=content["action_type"],
            draft=content["draft"],
            reason=content["reason"],
            tone=content["tone"],
            source=source,
            latency_ms=latency_ms,
            expires_at=expires_at,
            created_at=now_iso,
            is_crisis=bool(is_crisis),
            helplines=helplines,
            version=1,
            snooze_count=0,
        )

        # 6. Realtime tới receiver
        self._safe_send_to_user(partner_id, "nudge.new", nudge.to_dict())
        return nudge

    # ------------------------------------------------------------------
    # AI generation
    # ------------------------------------------------------------------
    def _generate_with_provider(
        self,
        mood_score: int,
        reasons: list[str] | None,
        note: str | None,
        share_level: str,
        partner_name: str,
    ) -> dict[str, str] | None:
        try:
            ai = get_ai_provider()
            reasons_str = ", ".join(reasons) if reasons else "Không nêu rõ"
            note_str = (
                note if (note and share_level == "all") else "(Đối phương chọn ẩn ghi chú)"
            )

            system_prompt = (
                "Bạn là Smart Nudge AI — hệ thống gợi ý chăm sóc tình cảm tinh tế.\n"
                "Nhiệm vụ: Phân tích tâm trạng đối phương để tạo gợi ý hành động và "
                "tin nhắn mẫu cho NGƯỜI YÊU của họ.\n"
                "Quy tắc:\n"
                "- Thấu hiểu, tự nhiên, không sáo rỗng.\n"
                "- Hành động thiết thực, làm được trong <2 phút.\n"
                "- Nếu có ghi chú thì nhắc đúng nội dung; không bịa chi tiết.\n"
                "- Chọn action_type: text, voice, photo, call hoặc other.\n"
                "- Tone: gentle, playful, supportive hoặc celebratory.\n"
                f"- observation ≤ {MAX_OBSERVATION_LEN} ký tự; draft ≤ {MAX_DRAFT_LEN}; "
                f"reason ≤ {MAX_REASON_LEN}.\n"
                "- TUYỆT ĐỐI không chẩn đoán y khoa/tâm lý, không hứa hẹn.\n"
                "- CHỈ trả JSON thuần với đúng các trường yêu cầu."
            )

            user_message = (
                f"Thông tin check-in của {partner_name}:\n"
                f"- Tâm trạng (1-5): {mood_score}/5\n"
                f"- Lý do: {reasons_str}\n"
                f"- Ghi chú: {note_str}\n\n"
                "Hãy phân tích và trả về JSON: "
                '{"observation":"...","action_type":"...","draft":"...","reason":"...","tone":"..."}'
            )

            import concurrent.futures

            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
                future = ex.submit(
                    ai.chat_sync,
                    system=system_prompt,
                    user=user_message,
                    json_mode=True,
                )
                raw = future.result(timeout=AI_SLA_SECONDS)

            data = _parse_json_object(raw)
            if not isinstance(data, dict):
                return None
            return {
                "observation": data.get("observation", ""),
                "action_type": data.get("action_type", "text"),
                "draft": data.get("draft", ""),
                "reason": data.get("reason", ""),
                "tone": data.get("tone", "supportive"),
            }
        except Exception:
            return None

    # ------------------------------------------------------------------
    # Query / mutation cho receiver
    # ------------------------------------------------------------------
    def get_active_nudge(
        self, couple_id: str, user_id: str
    ) -> SmartNudge | None:
        """Lấy Smart Nudge đang hiệu lực cho user."""
        nudge = self.nudge_repo.get_active_nudge(
            couple_id=couple_id, receiver_id=user_id
        )
        if nudge is None:
            return None

        # Kiểm tra snooze
        if nudge.snoozed_until:
            try:
                snooze_dt = datetime.fromisoformat(
                    nudge.snoozed_until.replace("Z", "+00:00")
                )
                if datetime.now(timezone.utc) < snooze_dt:
                    return None
            except ValueError:
                pass

        # Hết hạn → mark expired
        if nudge.expires_at:
            try:
                exp_dt = datetime.fromisoformat(
                    nudge.expires_at.replace("Z", "+00:00")
                )
                if datetime.now(timezone.utc) >= exp_dt:
                    self.nudge_repo.update(nudge.id, status="expired")
                    return None
            except ValueError:
                pass

        return nudge

    def handle_nudge_action(
        self,
        nudge_id: str,
        user_id: str,
        action: str,
    ) -> SmartNudge:
        """User xử lý nudge: completed / snoozed / dismissed.

        Authorization: chỉ chủ sở hữu (receiver) mới được thao tác.
        """
        nudge = self.nudge_repo.get(nudge_id)
        if nudge is None:
            raise NotFoundError("Nudge không tồn tại")
        if nudge.receiver_id != user_id:
            raise ForbiddenError("Bạn không có quyền thao tác nudge này")

        now = datetime.now(timezone.utc)
        updates: dict[str, Any] = {"status": action}

        if action == "snoozed":
            # Plan mục 4: snooze chỉ 1 lần
            if nudge.snooze_count >= MAX_SNOOZE_COUNT:
                raise ForbiddenError(
                    f"Bạn đã snooze nudge này tối đa {MAX_SNOOZE_COUNT} lần"
                )
            updates["snoozed_until"] = (now + timedelta(hours=SNOOZE_HOURS)).isoformat()
            updates["status"] = "new"
            updates["snooze_count"] = nudge.snooze_count + 1

        updated = self.nudge_repo.update(nudge.id, **updates)
        self._safe_send_to_user(user_id, "nudge.updated", updated.to_dict())
        return updated

    def rate_nudge(
        self,
        nudge_id: str,
        user_id: str,
        rating: str,
        feedback_reason: str | None = None,
    ) -> bool:
        """Ghi nhận 👍/👎 cho nudge; chỉ chủ sở hữu mới rate được."""
        if self.db is None:
            return False

        nudge = self.nudge_repo.get(nudge_id)
        if nudge is None or nudge.receiver_id != user_id:
            raise ForbiddenError("Bạn không có quyền đánh giá nudge này")

        try:
            self.db.table("smart_nudge_ratings").insert(
                {
                    "id": generate_uuid(),
                    "nudge_id": nudge_id,
                    "user_id": user_id,
                    "rating": rating,
                    "feedback_reason": feedback_reason,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            ).execute()
            return True
        except Exception:
            return False

    # ------------------------------------------------------------------
    # Tiny Moments
    # ------------------------------------------------------------------
    def send_tiny_moment(
        self,
        couple_id: str,
        sender_id: str,
        moment_type: str,
        content: str | None = None,
        nudge_id: str | None = None,
    ) -> TinyMoment:
        moment = self.tiny_repo.create(
            id=generate_uuid(),
            couple_id=couple_id,
            sender_id=sender_id,
            moment_type=moment_type,
            content=content,
            nudge_id=nudge_id,
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        try:
            from app.services.websocket_service import ws_manager

            ws_manager.sync_broadcast_to_couple(
                couple_id,
                "tiny_moment.new",
                moment.to_dict(),
                exclude_user_id=sender_id,
            )
        except Exception:
            pass
        return moment

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _fetch_partner_name(self, user_id: str) -> str:
        if self.db is None:
            return "Người thương"
        try:
            res = (
                self.db.table("users")
                .select("full_name,nickname")
                .eq("id", user_id)
                .maybe_single()
                .execute()
            )
            if res and res.data:
                nick = res.data.get("nickname")
                if nick:
                    return nick
                name = res.data.get("full_name") or "Người thương"
                return name.split(" ")[0]
        except Exception:
            pass
        return "Người thương"

    def _safe_send_to_user(self, user_id: str, event: str, payload: dict) -> None:
        try:
            from app.services.websocket_service import ws_manager

            ws_manager.sync_send_to_user(user_id, event, payload)
        except Exception:
            pass


def _sanitize_nudge_content(content: dict) -> dict:
    out = dict(content)
    action = str(out.get("action_type", "text")).lower()
    if action not in VALID_ACTION_TYPES:
        action = "text"
    out["action_type"] = action
    tone = str(out.get("tone", "supportive")).lower()
    if tone not in VALID_TONES:
        tone = "supportive"
    out["tone"] = tone
    out["observation"] = str(out.get("observation", ""))[:MAX_OBSERVATION_LEN]
    out["draft"] = str(out.get("draft", ""))[:MAX_DRAFT_LEN]
    out["reason"] = str(out.get("reason", ""))[:MAX_REASON_LEN]
    return out
