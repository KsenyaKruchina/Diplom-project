from fastapi import HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from app.models.user import User
from app.repositories.alarm_repository import AlarmRepository
from app.services.ws_manager import manager
from app.crud import crud_audit

class AlarmService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AlarmRepository(db)

    async def get_alarms_for_user(self, user: User) -> List:
        """Логика фильтрации тревог по правам доступа пользователя"""
        is_admin = user.role == "admin" or getattr(user, 'is_superuser', False)
        
        if is_admin:
            return self.repo.list_alarms()
        
        if not user.location_id:
            return []
            
        return self.repo.list_alarms(location_id=user.location_id)

    async def process_alarm_resolution(
        self, 
        alarm_id: int, 
        status_name: str, 
        comment: str, 
        user: User,
        background_tasks: BackgroundTasks
    ):
        """Бизнес-логика обработки инцидента"""
        # 1. Проверка существования тревоги
        alarm = self.repo.get_by_id(alarm_id)
        if not alarm:
            raise HTTPException(status_code=404, detail="Событие не найдено")

        # 2. Проверка прав (Редактор ограничен своей локацией)
        is_admin = user.role == "admin" or getattr(user, 'is_superuser', False)
        if not is_admin:
            sensor = self.repo.get_sensor_by_id(alarm.sensor_id)
            if sensor and sensor.group_id != user.location_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="Эта тревога находится вне зоны вашей ответственности"
                )

        # 3. Применение изменений через репозиторий
        updated_alarm = self.repo.update_alarm(
            alarm_id=alarm_id,
            status=status_name,
            comment=comment,
            user_id=user.id
        )
        if not updated_alarm:
            raise HTTPException(status_code=400, detail="Не удалось обновить статус")

        # 4. Мгновенное уведомление WebSocket
        await manager.broadcast_alarm({
            "type": "alarm_updated",
            "alarm_id": alarm_id,
            "new_status": status_name,
            "sensor_id": updated_alarm.sensor_id
        })

        # 5. Логирование в фоновом режиме
        action_text = f"Тревога #{alarm_id} переведена в статус '{status_name}'. Комментарий: {comment or 'Нет'}"
        background_tasks.add_task(crud_audit.log_action, self.db, user.id, action_text)
        
        return updated_alarm
