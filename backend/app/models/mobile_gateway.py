from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.models.base import Base


class MobileGateway(Base):
    __tablename__ = "mobile_gateways"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    device_id = Column(String, unique=True, index=True, nullable=False)
    device_name = Column(String, nullable=False)
    os_type = Column(String, nullable=False)
    os_version = Column(String, nullable=True)
    app_version = Column(String, nullable=True)
    order_id = Column(Integer, nullable=True)

    api_key = Column(String, nullable=True)
    api_key_hash = Column(String(255), nullable=False)

    is_active = Column(Boolean, default=True)
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, default=datetime.utcnow)
    latitude = Column(String, nullable=True)
    longitude = Column(String, nullable=True)
    last_location_update = Column(DateTime, nullable=True)

    ble_sensors = relationship("BleSensor", back_populates="mobile_gateway", cascade="all, delete-orphan")


class BleSensor(Base):
    __tablename__ = "ble_sensors"

    id = Column(Integer, primary_key=True, index=True)
    mobile_gateway_id = Column(Integer, ForeignKey("mobile_gateways.id"), nullable=False)
    sensor_id = Column(Integer, ForeignKey("sensors.id"), nullable=True)

    mac_address = Column(String, unique=True, index=True, nullable=False)
    device_name = Column(String, nullable=False)
    sensor_type = Column(String, nullable=False)
    manufacturer = Column(String, nullable=True)
    model = Column(String, nullable=True)

    is_active = Column(Boolean, default=True)
    is_connected = Column(Boolean, default=False)
    rssi = Column(Integer, nullable=True)
    tx_power = Column(Integer, nullable=True)

    last_temperature = Column(String, nullable=True)
    last_humidity = Column(String, nullable=True)
    first_reading_at = Column(DateTime, nullable=True)
    last_reading_time = Column(DateTime, nullable=True)

    mobile_gateway = relationship("MobileGateway", back_populates="ble_sensors")
    readings = relationship("BleReading", back_populates="ble_sensor", cascade="all, delete-orphan")


class BleReading(Base):
    __tablename__ = "ble_readings"

    id = Column(Integer, primary_key=True, index=True)
    mobile_gateway_id = Column(Integer, ForeignKey("mobile_gateways.id"), nullable=False)
    ble_sensor_id = Column(Integer, ForeignKey("ble_sensors.id"), nullable=False)

    temperature = Column(String, nullable=True)
    humidity = Column(String, nullable=True)
    rssi = Column(Integer, nullable=True)
    battery_level = Column(Integer, nullable=True)
    latitude = Column(String, nullable=True)
    longitude = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    ble_sensor = relationship("BleSensor", back_populates="readings")
