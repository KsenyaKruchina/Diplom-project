from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class MonitoredItem(Base):
    __tablename__ = "monitored_items"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id"), nullable=False)
    drug_name = Column(String(255), nullable=False)
    description = Column(String, nullable=True)
    
    temp_min = Column(Float, nullable=False)
    temp_max = Column(Float, nullable=False)
    hum_max = Column(Float, nullable=True)
    
    assigned_at = Column(DateTime, default=datetime.utcnow)
    assigned_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    sensor = relationship("Sensor", back_populates="monitored_items")