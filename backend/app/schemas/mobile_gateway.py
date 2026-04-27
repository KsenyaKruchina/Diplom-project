from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class MobileGatewayRegisterIn(BaseModel):
    device_id: str
    device_name: str
    os_type: str
    os_version: Optional[str] = None
    app_version: Optional[str] = None
    order_id: Optional[int] = None


class MobileGatewayRegisterOut(BaseModel):
    gateway_id: int
    device_id: str
    api_key: str


class BlePacketIn(BaseModel):
    mac_address: str
    device_name: str
    sensor_type: str = "bt06"
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    rssi: Optional[int] = None
    battery_level: Optional[int] = Field(default=None, ge=0, le=100)
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    timestamp: Optional[datetime] = None
    system_sensor_id: Optional[int] = None


class MobileGatewayIngestIn(BaseModel):
    device_id: str
    api_key: str
    packets: List[BlePacketIn]


class MobileGatewayIngestOut(BaseModel):
    gateway_id: int
    packets_received: int
    packets_saved: int
    ble_sensors_seen: int
    system_measurements_saved: int
    alarms_created: int
    skipped_system_links: int = 0
