from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app import models
from app.api import deps
from app.crud import crud_alarm, crud_audit
from app.models.sensor import AlarmEvent, Sensor
from app.schemas.telemetry import AlarmEventResponse
from app.services.ws_manager import manager


router = APIRouter()

class AlarmUpdate(BaseModel):
    status: str 
    user_comment: Optional[str] = None

@router.get("/", response_model=List[AlarmEventResponse])
def read_alarms(
    db: Session = Depends(deps.get_db), 
    current_user: models.User = Depends(deps.get_current_user)
):
    """Получить список всех тревожных событий с учетом локации пользователя"""
    # Соединяем таблицу тревог с таблицей датчиков, чтобы узнать локацию
    query = db.query(AlarmEvent).join(Sensor, AlarmEvent.sensor_id == Sensor.id)
    
    # Фильтрация по локации: зрители и редакторы видят тревоги только своей зоны
    if current_user.role != "admin" and not getattr(current_user, 'is_superuser', False):
        if current_user.location_id:
            query = query.filter(Sensor.group_id == current_user.location_id)
        else:
            return [] # Если у пользователя нет привязки, он не видит чужие тревоги
            
    return query.order_by(AlarmEvent.timestamp.desc()).all()

@router.patch("/{alarm_id}", response_model=AlarmEventResponse)
async def process_alarm(
    alarm_id: int, 
    obj_in: AlarmUpdate, 
    db: Session = Depends(deps.get_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    # Теперь и viewer может обрабатывать тревоги
    current_user: models.User = Depends(deps.check_role(["admin", "editor", "viewer"]))
):
    """Взять тревогу в работу или закрыть инцидент с комментарием"""
    # 1. Проверяем, существует ли тревога
    alarm = db.query(AlarmEvent).filter(AlarmEvent.id == alarm_id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Событие не найдено")

    # 2. Проверка безопасности: имеет ли редактор доступ к этому цеху/складу?
    if current_user.role != "admin" and not getattr(current_user, 'is_superuser', False):
        sensor = db.query(Sensor).filter(Sensor.id == alarm.sensor_id).first()
        if sensor and sensor.group_id != current_user.location_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Эта тревога находится вне зоны вашей ответственности"
            )

    # 3. Обновление статуса
    updated_alarm = crud_alarm.update_alarm_status(
        db, 
        alarm_id=alarm_id, 
        status=obj_in.status, 
        user_comment=obj_in.user_comment, 
        user_id=current_user.id
    )
    if not updated_alarm:
        raise HTTPException(status_code=400, detail="Не удалось обновить статус")
    
    # 4. Мгновенное уведомление через WebSocket
    # Отправляем сигнал ДО тяжелых операций логирования, чтобы UI обновился мгновенно
    await manager.broadcast_alarm({
        "type": "alarm_updated",
        "alarm_id": alarm_id,
        "new_status": obj_in.status,
        "sensor_id": updated_alarm.sensor_id,
        "user_comment": updated_alarm.user_comment,
        "resolved_at": updated_alarm.resolved_at.isoformat() if updated_alarm.resolved_at else None
    })

    # 5. Запись в Audit Trail в фоновом режиме (GMP compliance)
    action_text = f"Тревога #{alarm_id} переведена в статус '{obj_in.status}'. Комментарий: {obj_in.user_comment or 'Нет'}"
    if hasattr(crud_audit, 'log_action'):
        background_tasks.add_task(crud_audit.log_action, db, current_user.id, action_text)
    else:
        # Если функции нет, можно добавить задачу напрямую через сессию
        def log_bg(session, u_id, text):
            # Важно: в фоне сессия может закрыться, поэтому лучше использовать crud
            pass
        background_tasks.add_task(crud_audit.create_audit_log, db, current_user.id, action_text)

    return updated_alarm