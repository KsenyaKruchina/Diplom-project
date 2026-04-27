# app/schemas/sensor.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlarmUpdate(BaseModel):
    status: str 
    user_comment: Optional[str] = None 

class AlarmResponse(BaseModel):
    id: int
    sensor_id: int
    message: str
    status: str
    user_comment: Optional[str]
    resolved_by_id: Optional[int]
    timestamp: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True