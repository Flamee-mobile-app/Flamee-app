"""Subscription endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from supabase import Client

from app.api.deps import get_current_user, get_db
from app.api.response import ok
from app.core.exceptions import AuthError, NotFoundError, ValidationError
from app.services.subscription_service import SubscriptionService

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


class CheckoutRequest(BaseModel):
    plan_id: str
    payment_method: str = "payos"


class ActivateRequest(BaseModel):
    order_id: str


class WebhookPayload(BaseModel):
    order_code: str
    status: str
    signature: str | None = None


@router.get("/plans")
def get_plans(db: Client = Depends(get_db)):
    plans = SubscriptionService(db).list_active_plans()
    return ok(plans)


@router.get("/current")
def get_current_subscription(
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    couple_id = current.get("couple_id")
    if not couple_id:
        return ok(
            {
                "couple_id": None,
                "subscription_tier": "free",
                "subscription_expires_at": None,
                "is_active": False,
            }
        )
    sub = SubscriptionService(db).get_current_subscription(couple_id)
    return ok(sub)


@router.post("/checkout", status_code=status.HTTP_201_CREATED)
def checkout(
    payload: CheckoutRequest,
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    couple_id = current.get("couple_id")
    if not couple_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn cần ghép đôi trước khi mua gói Premium.",
        )
    order = SubscriptionService(db).create_checkout_order(
        couple_id=couple_id,
        user_id=current["id"],
        plan_id=payload.plan_id,
        payment_method=payload.payment_method,
    )
    return ok(order)


@router.post("/activate")
def activate_subscription(
    payload: ActivateRequest,
    current: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """User kích hoạt thủ công (sau khi chuyển khoản). Service sẽ verify ownership."""
    try:
        result = SubscriptionService(db).activate_order(
            payload.order_id, expected_user_id=current["id"]
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=exc.message)
    except AuthError as exc:
        raise HTTPException(status_code=403, detail=exc.message)
    return ok(result)


@router.post("/webhook")
async def payment_webhook(
    request: Request,
    payload: WebhookPayload,
    db: Client = Depends(get_db),
):
    """Webhook nhận IPN từ cổng thanh toán.

    Bảo mật P0-05: PHẢI verify HMAC signature (x-header 'X-Signature' hoặc
    trong body). Không verify = từ chối, không tạo subscription giả.
    """
    # Ưu tiên header 'X-Signature' nếu có
    signature = request.headers.get("X-Signature") or payload.signature
    raw_body = await request.body()

    try:
        if str(payload.status).lower() in {"paid", "completed", "success"}:
            result = SubscriptionService(db).verify_and_process_webhook(
                payload_bytes=raw_body,
                signature=signature,
                order_code=payload.order_code,
                status=payload.status,
            )
            return ok({"processed": True, "result": result})
        return ok({"processed": False, "status": payload.status})
    except (AuthError, ValidationError, NotFoundError) as exc:
        raise HTTPException(status_code=400, detail=exc.message)