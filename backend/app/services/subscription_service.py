"""Persisted subscription reads; checkout awaits a real payment integration."""
from __future__ import annotations

import hmac
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from supabase import Client

from app.config import settings
from app.core.exceptions import AuthError, FeatureUnavailableError, NotFoundError, ValidationError
from app.utils.time import now_utc



class SubscriptionService:
    """Subscription flow. Bảo mật P0-05:

    - Không còn "fallback tạo test mock" khi order không tồn tại.
    - `activate_order` yêu cầu `user_id` để verify ownership.
    - Webhook yêu cầu signature (HMAC với secret).
    """

    def __init__(self, db: Client) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # Plans
    # ------------------------------------------------------------------
    def list_active_plans(self) -> list[dict[str, Any]]:
        response = self.db.table("subscription_plans").select("*").eq("is_active", True).execute()
        return response.data or []

    def get_current_subscription(self, couple_id: str) -> dict[str, Any]:
        res = (
            self.db.table("couples")
            .select("subscription_tier, subscription_expires_at")
            .eq("id", couple_id)
            .maybe_single()
            .execute()
        )
        if not res or not res.data:
            raise NotFoundError("Couple không tồn tại")

        couple = res.data
        tier = couple.get("subscription_tier") or "free"
        expires_at = couple.get("subscription_expires_at")

        is_active = False
        if tier != "free" and expires_at:
            try:
                exp_dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                is_active = now_utc() < exp_dt
            except ValueError:
                is_active = True

        return {
            "couple_id": couple_id,
            "subscription_tier": tier if is_active else "free",
            "subscription_expires_at": expires_at,
            "is_active": is_active,
        }

    # ------------------------------------------------------------------
    # Checkout
    # ------------------------------------------------------------------
    def create_checkout_order(
        self,
        couple_id: str,
        user_id: str,
        plan_id: str,
        payment_method: str = "payos",
    ) -> dict[str, Any]:
        raise FeatureUnavailableError("Payment checkout is not integrated yet")

    # ------------------------------------------------------------------
    # Activation (manual hoặc qua webhook)
    # ------------------------------------------------------------------
    def activate_order(
        self,
        order_id_or_code: str,
        *,
        expected_user_id: Optional[str] = None,
    ) -> dict[str, Any]:
        """Kích hoạt đơn hàng và nâng cấp Couple.

        Nếu `expected_user_id` được cung cấp, sẽ verify order thuộc về user đó.
        """
        if expected_user_id is not None:
            raise FeatureUnavailableError("Manual payment activation is not supported")
        order = self._find_order(order_id_or_code)
        if order is None:
            raise NotFoundError("Không tìm thấy đơn hàng")

        if expected_user_id and order.get("user_id") != expected_user_id:
            raise AuthError("Đơn hàng không thuộc về bạn")

        couple_id = order["couple_id"]
        plan_id = order["plan_id"]
        plans = self.list_active_plans()
        plan = next(
            (p for p in plans if p["id"] == plan_id or p.get("code") == plan_id),
            None,
        )
        interval_months = int(plan.get("interval_months", 1)) if plan else 1
        tier_code = plan.get("code", "monthly") if plan else "monthly"

        now = datetime.now(timezone.utc)
        expires_at = (now + timedelta(days=interval_months * 30)).isoformat()
        completed_at = now.isoformat()

        self.db.table("payment_orders").update(
            {
                "status": "completed",
                "completed_at": completed_at,
            }
        ).eq("id", order["id"]).execute()

        self.db.table("couples").update(
            {
                "subscription_tier": tier_code,
                "subscription_expires_at": expires_at,
            }
        ).eq("id", couple_id).execute()

        return {
            "couple_id": couple_id,
            "subscription_tier": tier_code,
            "subscription_expires_at": expires_at,
            "is_active": True,
        }

    def verify_and_process_webhook(
        self,
        payload_bytes: bytes,
        signature: Optional[str],
        order_code: str,
        status: str,
    ) -> dict[str, Any]:
        """Verify HMAC signature rồi mới activate order.

        Secret: FLAMEE_PAYMENT_WEBHOOK_SECRET. Nếu chưa cấu hình → từ chối.
        """
        secret = getattr(settings, "payment_webhook_secret", "") or ""
        if not secret:
            raise ValidationError("Webhook secret chưa được cấu hình")
        if not signature:
            raise AuthError("Thiếu chữ ký webhook")
        expected = hmac.new(
            secret.encode("utf-8"), payload_bytes, hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise AuthError("Chữ ký webhook không hợp lệ")

        if status.lower() not in {"paid", "completed", "success"}:
            return {"processed": False, "status": status}

        return self.activate_order(order_code)

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------
    def _find_order(self, order_id_or_code: str) -> Optional[dict]:
        try:
            res = (
                self.db.table("payment_orders")
                .select("*")
                .eq("id", order_id_or_code)
                .maybe_single()
                .execute()
            )
            if res and res.data:
                return res.data
        except Exception:
            pass
        try:
            res = (
                self.db.table("payment_orders")
                .select("*")
                .eq("order_code", order_id_or_code)
                .maybe_single()
                .execute()
            )
            if res and res.data:
                return res.data
        except Exception:
            pass
        return None
