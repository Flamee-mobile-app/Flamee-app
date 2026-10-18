"""WebSocket ConnectionManager cho realtime events.

Thread-safety:
- Các method public (send_to_user, broadcast_to_couple) là async.
- Từ BackgroundTask (chạy trong thread pool), dùng sync_send_to_user /
  sync_broadcast_to_couple. Các hàm sync này gọi
  asyncio.run_coroutine_threadsafe(coro, loop) nếu có event loop đang chạy;
  nếu đang ở chính event loop thì dùng loop.create_task.
"""
from __future__ import annotations

import asyncio
import json
import logging
import threading
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Quản lý kết nối WS trong process."""

    def __init__(self) -> None:
        self._user_connections: dict[str, set[WebSocket]] = {}
        self._couple_users: dict[str, set[str]] = {}
        self._lock = threading.RLock()
        self._loop: asyncio.AbstractEventLoop | None = None
        # Một thread-local flag để tránh re-entrancy
        self._dispatch_depth: int = 0

    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """Lưu loop hiện tại để từ thread khác schedule an toàn."""
        self._loop = loop

    async def connect(
        self,
        websocket: WebSocket,
        user_id: str,
        couple_id: str | None = None,
    ) -> None:
        await websocket.accept()
        with self._lock:
            self._user_connections.setdefault(user_id, set()).add(websocket)
            if couple_id:
                self._couple_users.setdefault(couple_id, set()).add(user_id)
        # Bind loop nếu là lần đầu
        if self._loop is None:
            try:
                self._loop = asyncio.get_running_loop()
            except RuntimeError:
                pass

    def disconnect(
        self,
        websocket: WebSocket,
        user_id: str,
        couple_id: str | None = None,
    ) -> None:
        with self._lock:
            conns = self._user_connections.get(user_id)
            if conns is not None:
                conns.discard(websocket)
                if not conns:
                    self._user_connections.pop(user_id, None)
            if couple_id:
                users = self._couple_users.get(couple_id)
                if users is not None and not conns:
                    users.discard(user_id)
                    if not users:
                        self._couple_users.pop(couple_id, None)

    # ------------------------------------------------------------------
    # Send (async — gọi từ event loop)
    # ------------------------------------------------------------------
    async def send_to_user(
        self, user_id: str, event: str, data: Any
    ) -> None:
        payload = json.dumps(
            {"event": event, "data": data}, ensure_ascii=False
        )
        with self._lock:
            conns = list(self._user_connections.get(user_id, set()))
        for ws in conns:
            try:
                await ws.send_text(payload)
            except Exception as exc:
                logger.warning("WS send_to_user failed: %s", exc)
                self.disconnect(ws, user_id)

    async def broadcast_to_couple(
        self,
        couple_id: str,
        event: str,
        data: Any,
        exclude_user_id: str | None = None,
    ) -> None:
        with self._lock:
            uids = list(self._couple_users.get(couple_id, set()))
        for uid in uids:
            if uid == exclude_user_id:
                continue
            await self.send_to_user(uid, event, data)

    # ------------------------------------------------------------------
    # Sync wrappers (gọi từ BackgroundTask — thread pool)
    # ------------------------------------------------------------------
    def sync_send_to_user(
        self, user_id: str, event: str, data: Any
    ) -> None:
        _schedule_async(self.send_to_user(user_id, event, data), self._loop)

    def sync_broadcast_to_couple(
        self,
        couple_id: str,
        event: str,
        data: Any,
        exclude_user_id: str | None = None,
    ) -> None:
        _schedule_async(
            self.broadcast_to_couple(couple_id, event, data, exclude_user_id),
            self._loop,
        )


def _schedule_async(coro: Any, loop: asyncio.AbstractEventLoop | None) -> None:
    """Đẩy coroutine vào event loop an toàn từ thread khác.

    - Nếu đang ở event loop (gọi trong async context) → loop.create_task.
    - Nếu từ thread khác có loop bound → asyncio.run_coroutine_threadsafe.
    - Nếu không có loop → đóng coroutine + log + drop.
    """
    # Tình huống 1: đang ở trong event loop → create_task
    try:
        running_loop = asyncio.get_running_loop()
        running_loop.create_task(coro)
        return
    except RuntimeError:
        pass

    # Tình huống 2: từ thread khác, có loop bound
    target_loop = loop
    if target_loop is None:
        try:
            target_loop = asyncio.get_event_loop()
        except RuntimeError:
            logger.debug("WS schedule: no event loop, dropping message")
            try:
                coro.close()
            except Exception:
                pass
            return
    if target_loop.is_closed():
        logger.debug("WS schedule: loop is closed, dropping message")
        try:
            coro.close()
        except Exception:
            pass
        return
    try:
        asyncio.run_coroutine_threadsafe(coro, target_loop)
    except Exception as exc:
        logger.warning("WS schedule failed: %s", exc)
        try:
            coro.close()
        except Exception:
            pass


ws_manager = ConnectionManager()
