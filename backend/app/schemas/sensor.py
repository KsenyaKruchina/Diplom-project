from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SensorCreate(BaseModel):
    name: str
    group_id: Optional[int] = None
    control_unit_id: Optional[int] = None
    internal_id: Optional[str] = None

    pos_x: Optional[float] = None
    pos_y: Optional[float] = None

    # Границы "Внимание"
    warning_min_temp: Optional[float] = None
    warning_max_temp: Optional[float] = None
    warning_min_hum: Optional[float] = None
    warning_max_hum: Optional[float] = None

    # Границы "Тревога"
    alarm_min_temp: Optional[float] = None
    alarm_max_temp: Optional[float] = None
    alarm_min_hum: Optional[float] = None
    alarm_max_hum: Optional[float] = None

    alarm_delay_seconds: int = 0

# НОВОЕ: Схема для обновления координат или настроек датчика
class SensorUpdate(BaseModel):
    name: Optional[str] = None
    group_id: Optional[int] = None
    control_unit_id: Optional[int] = None
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None
    warning_min_temp: Optional[float] = None
    warning_max_temp: Optional[float] = None
    warning_min_hum: Optional[float] = None
    warning_max_hum: Optional[float] = None
    alarm_min_temp: Optional[float] = None
    alarm_max_temp: Optional[float] = None
    alarm_min_hum: Optional[float] = None
    alarm_max_hum: Optional[float] = None
    alarm_delay_seconds: Optional[int] = None

class SensorResponse(SensorCreate):
    id: int
    pos_x: float = 0.0
    pos_y: float = 0.0
    is_online: bool
    last_seen: datetime

    class Config:
        from_attributes = True
