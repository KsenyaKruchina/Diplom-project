# app/models/location.py
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

class LocationGroup(Base):
    __tablename__ = "location_groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    parent_id = Column(Integer, ForeignKey("location_groups.id"), nullable=True)

    image_url = Column(String, nullable=True)

    children = relationship("LocationGroup")
    sensors = relationship("Sensor", back_populates="group")
    control_units = relationship("ControlUnit", back_populates="group")