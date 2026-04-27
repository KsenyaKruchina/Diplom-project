# app/schemas/user.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str = Field(default="viewer") # По умолчанию только просмотр
    location_id: Optional[int] = None # Для привязки к локации/объекту
    email: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    email: Optional[str] = None

    class Config:
        from_attributes = True

class AuditLogBase(BaseModel):
    action: str

class AuditLogCreate(AuditLogBase):
    user_id: int

class AuditLogResponse(AuditLogBase):
    id: int
    user_id: int
    timestamp: datetime

    class Config:
        from_attributes = True # Для Pydantic v1 (если v2, то from_attributes = True)