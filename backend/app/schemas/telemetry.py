from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MeasurementCreate(BaseModel):
    sensor_id: int
    temperature: float
    humidity: float
    # Технические данные шлюза
    power_status: Optional[str] = "battery"
    battery_level: Optional[int] = None
    sim_balance: Optional[float] = None
    gsm_signal: Optional[int] = None

class MeasurementResponse(BaseModel):
    """Ответ с одним измерением"""
    id: int
    sensor_id: int
    temperature: float
    humidity: float
    timestamp: datetime

    class Config:
        from_attributes = True

class MeasurementsHistoryResponse(BaseModel):
    """Ответ с историей измерений"""
    sensor_id: int
    sensor_name: str
    measurements: List[MeasurementResponse]
    latest: Optional[MeasurementResponse] = None

class AlarmEventResponse(BaseModel):
    id: int
    sensor_id: int
    severity: str
    alarm_type: str
    description: str
    timestamp: datetime
    status: str
    user_comment: Optional[str] = None
    resolved_by_id: Optional[int] = None
    resolved_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True