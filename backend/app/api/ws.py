"""WebSocket endpoint."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.core.exceptions import AuthError
from app.core.security import decode_token
from app.services.websocket_service import ws_manager

logger = logging.getLogger(__name__)
router = APIRouter(tags=["websocket"])


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
):
    """Xác thực qua JWT, tra cứu couple_id hiện tại từ DB.

    Không tin `couple_id` claim trong token — luôn đọc từ DB để đảm bảo
    user vẫn còn thuộc couple đó.
    """
    try:
        claims = decode_token(token)
    except AuthError:
        await websocket.close(code=4001)
        return
    user_id = claims.get("sub")
    if not user_id:
        await websocket.close(code=4001)
        return

    # Lấy couple_id hiện tại từ DB
    from app.database import get_supabase

    couple_id: str | None = None
    try:
        client = get_supabase()
        from app.api.deps import _check_session_active
        _check_session_active(client, claims.get("jti"), user_id)
        resp = (
            client.table("users")
            .select("couple_id")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        if not resp or not resp.data:
            await websocket.close(code=4001)
            return
        couple_id = resp.data.get("couple_id")
    except Exception as exc:
        logger.warning("WS couple lookup failed: %s", exc)
        await websocket.close(code=4001)
        return

    await ws_manager.connect(websocket, user_id, couple_id)
    # Bind loop hiện tại để từ thread khác (BackgroundTask) có thể schedule
    import asyncio

    try:
        ws_manager.bind_loop(asyncio.get_running_loop())
    except RuntimeError:
        pass
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.warning("WS loop error: %s", exc)
    finally:
        ws_manager.disconnect(websocket, user_id, couple_id)
