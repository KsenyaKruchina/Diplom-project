# app/services/ws_manager.py
from fastapi import WebSocket
import json
import asyncio

class ConnectionManager:
    def __init__(self):
        # Список активных браузерных подключений
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_alarm(self, payload: dict):
        """Асинхронная рассылка тревоги всем клиентам"""
        message = json.dumps(payload)
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass # Если клиент закрыл вкладку, игнорируем ошибку

    def broadcast_sync(self, payload: dict):
        """Синхронная рассылка тревоги всем клиентам (для синхронных контекстов)"""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # Если цикл уже запущен, используем create_task
                asyncio.create_task(self.broadcast_alarm(payload))
            else:
                # Если цикл не запущен, используем run_until_complete
                loop.run_until_complete(self.broadcast_alarm(payload))
        except RuntimeError:
            # Если нет цикла, создаём новый
            asyncio.run(self.broadcast_alarm(payload))

# Создаем единственный экземпляр на весь проект
manager = ConnectionManager()