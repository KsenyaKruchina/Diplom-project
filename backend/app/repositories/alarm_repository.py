from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from app.models.sensor import AlarmEvent, Sensor

class AlarmRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, alarm_id: int) -> Optional[AlarmEvent]:
        return self.db.query(AlarmEvent).filter(AlarmEvent.id == alarm_id).first()

    def get_sensor_by_id(self, sensor_id: int) -> Optional[Sensor]:
        return self.db.query(Sensor).filter(Sensor.id == sensor_id).first()

    def list_alarms(self, location_id: Optional[int] = None) -> List[AlarmEvent]:
        query = self.db.query(AlarmEvent).join(Sensor, AlarmEvent.sensor_id == Sensor.id)
        
        if location_id:
            query = query.filter(Sensor.group_id == location_id)
            
        return query.order_by(desc(AlarmEvent.timestamp)).all()

    def update_alarm(
        self, 
        alarm_id: int, 
        status: str, 
        comment: Optional[str], 
        user_id: int
    ) -> Optional[AlarmEvent]:
        # Используем существующий CRUD для сохранения совместимости с текущей базой
        from app.crud import crud_alarm
        return crud_alarm.update_alarm_status(
            self.db, 
            alarm_id=alarm_id, 
            status=status, 
            comment=comment, 
            user_id=user_id
        )
