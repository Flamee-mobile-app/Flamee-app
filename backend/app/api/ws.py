"""Authenticated realtime invalidation. Bearer stays out of URLs and logs."""
from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from supabase import Client

from app.api.deps import _check_session_active, get_db
from app.core.security import decode_token
from app.services.websocket_service import ws_manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, db: Client = Depends(get_db)):
    await websocket.accept()
    user_id = None
    couple_id = None
    try:
        raw = await asyncio.wait_for(websocket.receive_text(), timeout=10)
        if len(raw) > 32768:
            await websocket.close(code=4001)
            return
        auth = json.loads(raw)
        if not isinstance(auth, dict) or auth.get("type") != "auth" or not isinstance(auth.get("access_token"), str):
            await websocket.close(code=4001)
            return
        token = auth["access_token"]

        def identity():
            claims = decode_token(token)
            owner = claims.get("sub")
            if not owner:
                return None
            _check_session_active(db, claims.get("jti"), owner)
            user = db.table("users").select("id,couple_id").eq("id", owner).maybe_single().execute()
            if not user or not user.data:
                return None
            pair = user.data.get("couple_id")
            if pair:
                couple = db.table("couples").select("*").eq("id", pair).maybe_single().execute()
                if not couple or not couple.data or couple.data.get("status") != "active" or owner not in (couple.data.get("partner1_id"), couple.data.get("partner2_id")):
                    return None
                members = db.table("users").select("id").in_("id", [couple.data['partner1_id'], couple.data['partner2_id']]).eq("couple_id", pair).execute()
                if len(members.data or []) != 2:
                    return None
            return (owner, pair)

        initial = await asyncio.to_thread(identity)
        if not initial:
            await websocket.close(code=4001)
            return
        user_id, couple_id = initial

        async def validate():
            try:
                return await asyncio.to_thread(identity) == initial
            except Exception:
                return False

        await ws_manager.connect(websocket, user_id, couple_id, validate=validate, accepted=True)
        ws_manager.bind_loop(asyncio.get_running_loop())
        await websocket.send_json({"event": "ready", "data": {}})
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=5)
            except asyncio.TimeoutError:
                data = None
            if not await validate():
                await websocket.close(code=4001)
                return
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    except Exception:
        # Auth/provider failures are deliberately sanitized; no tokens or payloads.
        try:
            await websocket.close(code=4001)
        except Exception:
            pass
    finally:
        if user_id:
            ws_manager.disconnect(websocket, user_id, couple_id)
