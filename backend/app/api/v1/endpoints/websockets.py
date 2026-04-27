# app/api/v1/endpoints/websockets.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.ws_manager import manager

router = APIRouter()

@router.websocket("/ws/alarms")
async def websocket_endpoint(websocket: WebSocket):
    """Канал для трансляции тревог в реальном времени (без перезагрузки страницы)"""
    await manager.connect(websocket)
    try:
        while True:
            # Держим соединение открытым (ждем пингов от клиента)
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)