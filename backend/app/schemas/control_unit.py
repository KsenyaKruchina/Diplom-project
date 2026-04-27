from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ControlUnitCreate(BaseModel):
    name: Optional[str] = None
    group_id: int
    serial_number: str = Field(min_length=3, max_length=128)
    dev_eui: Optional[str] = Field(default=None, max_length=16)
    app_key: Optional[str] = Field(default=None, max_length=64)


class ControlUnitUpdate(BaseModel):
    name: Optional[str] = None
    group_id: Optional[int] = None
    is_active: Optional[bool] = None


class ControlUnitHeartbeat(BaseModel):
    serial_number: str
    token: str
    battery_level: Optional[int] = Field(default=None, ge=0, le=100)
    power_status: Optional[str] = None
    sim_balance: Optional[float] = None
    gsm_signal: Optional[int] = Field(default=None, ge=0, le=100)


class SensorPacket(BaseModel):
    sensor_internal_id: Optional[str] = None
    sensor_name: Optional[str] = None
    temperature: float
    humidity: float
    timestamp: Optional[datetime] = None
    battery_level: Optional[int] = Field(default=None, ge=0, le=100)
    source: str = Field(default="lorawan")


class ControlUnitTelemetryIn(BaseModel):
    serial_number: str
    token: str
    packets: List[SensorPacket]


class ControlUnitResponse(BaseModel):
    id: int
    name: Optional[str]
    group_id: int
    serial_number: str
    dev_eui: Optional[str]
    is_online: bool
    is_active: bool
    last_seen: datetime
    registered_at: datetime
    battery_level: Optional[int] = None
    power_status: Optional[str] = None
    sim_balance: Optional[float] = None
    gsm_signal: Optional[int] = None

    class Config:
        from_attributes = True


class ControlUnitProvisionResponse(BaseModel):
    unit: ControlUnitResponse
    ingestion_token: str


class ControlUnitTelemetryResult(BaseModel):
    control_unit_id: int
    packets_received: int
    packets_saved: int
    sensors_touched: int
    alarms_created: int
