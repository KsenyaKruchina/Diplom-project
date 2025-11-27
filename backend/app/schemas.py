from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class SensorDataBase(BaseModel):
    temperature: float
    humidity: float

class SensorDataCreate(SensorDataBase):
    pass

class SensorData(SensorDataBase):
    id: int
    timestamp: datetime
    
    class Config:
        orm_mode = True

class UserBase(BaseModel):
    name: str
    role: str
    status: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    last_login: datetime
    
    class Config:
        orm_mode = True

class NotificationBase(BaseModel):
    title: str
    message: str

class NotificationCreate(NotificationBase):
    pass

class Notification(NotificationBase):
    id: int
    completed: bool
    created_at: datetime
    
    class Config:
        orm_mode = True

class UserActivityBase(BaseModel):
    user_name: str
    action: str

class UserActivityCreate(UserActivityBase):
    pass

class UserActivity(UserActivityBase):
    id: int
    timestamp: datetime
    
    class Config:
        orm_mode = True

class DashboardStats(BaseModel):
    current_temperature: float
    current_humidity: float
    temperature_change: float
    humidity_change: float
    avg_temperature: float
    avg_humidity: float