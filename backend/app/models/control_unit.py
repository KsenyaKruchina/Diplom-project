from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.models.base import Base


class ControlUnit(Base):
    __tablename__ = "control_units"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=True)
    group_id = Column(Integer, ForeignKey("location_groups.id"), nullable=False)

    serial_number = Column(String, unique=True, index=True, nullable=False)
    dev_eui = Column(String(16), unique=True, index=True, nullable=True)
    app_key = Column(String(32), nullable=True)
    api_key_hash = Column(String(255), nullable=False)

    is_online = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    registered_at = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)

    battery_level = Column(Integer, nullable=True)
    power_status = Column(String, nullable=True)
    sim_balance = Column(Float, nullable=True)
    gsm_signal = Column(Integer, nullable=True)

    group = relationship("LocationGroup", back_populates="control_units")
    sensors = relationship("Sensor", back_populates="control_unit")
