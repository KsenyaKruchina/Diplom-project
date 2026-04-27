# app/crud/crud_alarm.py
from sqlalchemy.orm import Session
from datetime import datetime
from app.models.sensor import AlarmEvent

def get_alarm(db: Session, alarm_id: int):
    return db.query(AlarmEvent).filter(AlarmEvent.id == alarm_id).first()

def update_alarm_status(
    db: Session, 
    alarm_id: int, 
    status: str,
    user_comment: str,
    user_id: int,
):
    # Обновляем данные тревоги
# 1. Ищем тревогу в БД по ID
    alarm_obj = get_alarm(db, alarm_id)
    if not alarm_obj:
        return None
        
    # 2. Обновляем статус
    alarm_obj.status = status
    
    # 3. Обновляем комментарий, если он есть
    if user_comment is not None:
        alarm_obj.user_comment = user_comment
    
    # 4. Записываем, кто и когда подтвердил тревогу
    alarm_obj.resolved_by_id = user_id
    alarm_obj.resolved_at = datetime.utcnow()

    # 5. Сохраняем изменения
    db.commit()
    db.refresh(alarm_obj)
    
    return alarm_obj