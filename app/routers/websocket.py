"""WebSocket endpoints for real-time telemetry/state/alert streaming.

Uses the in-memory ConnectionManager (app.services.websocket_manager). No
Redis/Kafka required for the hackathon scope; the manager interface is kept
narrow (connect/disconnect/broadcast) so a pub-sub backend could be added
later without touching these handlers.
"""
from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.websocket_manager import manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/operator/{operator_id}")
async def ws_operator(websocket: WebSocket, operator_id: str):
    channel = f"operator:{operator_id}"
    await manager.connect(channel, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(channel, websocket)


@router.websocket("/ws/machine/{machine_id}")
async def ws_machine(websocket: WebSocket, machine_id: str):
    channel = f"machine:{machine_id}"
    await manager.connect(channel, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(channel, websocket)


@router.websocket("/ws/safety-alerts")
async def ws_safety_alerts(websocket: WebSocket):
    channel = "safety-alerts"
    await manager.connect(channel, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(channel, websocket)
