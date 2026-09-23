"""Lightweight in-memory WebSocket connection manager.

Channels: operator:{id}, machine:{id}, safety-alerts.
Designed so a Redis/pub-sub backend could be swapped in later without
changing the public interface (connect/disconnect/broadcast).
"""
from __future__ import annotations

import asyncio
import json
from collections import defaultdict

from fastapi import WebSocket

from app.core.logging import get_logger

logger = get_logger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, channel: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[channel].add(websocket)
        logger.info("WebSocket connected on channel=%s (total=%d)", channel, len(self._connections[channel]))

    async def disconnect(self, channel: str, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections[channel].discard(websocket)
        logger.info("WebSocket disconnected on channel=%s", channel)

    async def broadcast(self, channel: str, payload: dict) -> None:
        message = json.dumps(payload, default=str)
        dead: list[WebSocket] = []
        for ws in list(self._connections.get(channel, set())):
            try:
                await ws.send_text(message)
            except Exception:  # noqa: BLE001
                dead.append(ws)
        if dead:
            async with self._lock:
                for ws in dead:
                    self._connections[channel].discard(ws)

    async def broadcast_many(self, channels: list[str], payload: dict) -> None:
        for channel in channels:
            await self.broadcast(channel, payload)


manager = ConnectionManager()
