# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime
from app.models.base import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String, default="viewer") # roles: admin, editor, viewer
    location_id = Column(Integer, ForeignKey("location_groups.id"), nullable=True)
    is_active = Column(Boolean, default=True)

class AuditLog(Base):
    """Журнал действий пользователей по ТЗ"""
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String) # Описание изменения настроек
    timestamp = Column(DateTime, default=datetime.utcnow)