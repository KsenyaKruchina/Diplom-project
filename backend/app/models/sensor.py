# app/models/sensor.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class Sensor(Base):
    __tablename__ = "sensors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    group_id = Column(Integer, ForeignKey("location_groups.id"), nullable=True)
    control_unit_id = Column(Integer, ForeignKey("control_units.id"), nullable=True)

    # Статус оборудования
    is_online = Column(Boolean, default=True)
    last_seen = Column(DateTime, default=datetime.utcnow)

    # Координаты
    pos_x = Column(Float, nullable=True, default=0.0)
    pos_y = Column(Float, nullable=True, default=0.0)

    # Пороги: Внимание
    warning_min_temp = Column(Float, nullable=True)
    warning_max_temp = Column(Float, nullable=True)
    warning_min_hum = Column(Float, nullable=True)
    warning_max_hum = Column(Float, nullable=True)

    # Пороги: Тревога
    alarm_min_temp = Column(Float, nullable=True)
    alarm_max_temp = Column(Float, nullable=True)
    alarm_min_hum = Column(Float, nullable=True)
    alarm_max_hum = Column(Float, nullable=True)

    alarm_delay_seconds = Column(Integer, default=0)

    # Связи
    group = relationship("LocationGroup", back_populates="sensors")
    control_unit = relationship("ControlUnit", back_populates="sensors")
    measurements = relationship("Measurement", back_populates="sensor", cascade="all, delete-orphan")
    alarms = relationship("AlarmEvent", back_populates="sensor", cascade="all, delete-orphan")
    monitored_items = relationship("MonitoredItem", back_populates="sensor", cascade="all, delete-orphan")

    internal_id = Column(String, unique=True, index=True, nullable=True)

class Measurement(Base):
    """История показателей"""
    __tablename__ = "measurements"
    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id"), index=True)
    temperature = Column(Float)
    humidity = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    sensor = relationship("Sensor", back_populates="measurements")

class AlarmEvent(Base):
    """Журнал тревог и комментарии к ним"""
    __tablename__ = "alarm_events"
    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id"))
    severity = Column(String) # 'warning' или 'critical'
    alarm_type = Column(String) 
    description = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    status = Column(String, default="new") # new, acknowledged, resolved
    user_comment = Column(Text, nullable=True)
    resolved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True) # Время обработки

    sensor = relationship("Sensor", back_populates="alarms")