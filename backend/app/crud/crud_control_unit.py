import hashlib
import secrets
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.control_unit import ControlUnit
from app.models.location import LocationGroup
from app.models.sensor import Measurement, Sensor
from app.schemas.control_unit import ControlUnitCreate, SensorPacket
from app.services.alarm_manager import process_telemetry_alarms


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_ingestion_token() -> str:
    return secrets.token_urlsafe(32)


def get_control_unit(db: Session, control_unit_id: int) -> Optional[ControlUnit]:
    return db.query(ControlUnit).filter(ControlUnit.id == control_unit_id).first()


def get_control_unit_by_serial(db: Session, serial_number: str) -> Optional[ControlUnit]:
    return db.query(ControlUnit).filter(ControlUnit.serial_number == serial_number).first()


def get_control_units(db: Session, skip: int = 0, limit: int = 100) -> list[ControlUnit]:
    return db.query(ControlUnit).offset(skip).limit(limit).all()


def create_control_unit(db: Session, payload: ControlUnitCreate) -> tuple[ControlUnit, str]:
    location = db.query(LocationGroup).filter(LocationGroup.id == payload.group_id).first()
    if not location:
        raise ValueError(f"Локация с ID={payload.group_id} не найдена")

    existing = get_control_unit_by_serial(db, payload.serial_number)
    if existing:
        raise ValueError("ЦБУ с таким serial_number уже существует")

    token = generate_ingestion_token()
    unit = ControlUnit(
        name=payload.name or f"Control Unit {payload.serial_number}",
        group_id=payload.group_id,
        serial_number=payload.serial_number,
        dev_eui=payload.dev_eui,
        app_key=payload.app_key,
        api_key_hash=_hash_token(token),
        is_online=False,
        is_active=True,
        registered_at=datetime.utcnow(),
        last_seen=datetime.utcnow(),
    )
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return unit, token


def update_control_unit_seen(
    db: Session,
    unit: ControlUnit,
    battery_level: Optional[int] = None,
    power_status: Optional[str] = None,
    sim_balance: Optional[float] = None,
    gsm_signal: Optional[int] = None,
) -> ControlUnit:
    unit.is_online = True
    unit.last_seen = datetime.utcnow()
    if battery_level is not None:
        unit.battery_level = battery_level
    if power_status is not None:
        unit.power_status = power_status
    if sim_balance is not None:
        unit.sim_balance = sim_balance
    if gsm_signal is not None:
        unit.gsm_signal = gsm_signal
    db.flush()
    return unit


def authenticate_unit(db: Session, serial_number: str, token: str) -> Optional[ControlUnit]:
    unit = get_control_unit_by_serial(db, serial_number)
    if not unit or not unit.is_active:
        return None
    if unit.api_key_hash != _hash_token(token):
        return None
    return unit


def _resolve_sensor(db: Session, unit: ControlUnit, packet: SensorPacket) -> Sensor:
    sensor: Optional[Sensor] = None
    if packet.sensor_internal_id:
        sensor = db.query(Sensor).filter(Sensor.internal_id == packet.sensor_internal_id).first()

    if sensor is None and packet.sensor_name:
        sensor = (
            db.query(Sensor)
            .filter(Sensor.control_unit_id == unit.id, Sensor.name == packet.sensor_name)
            .first()
        )

    if sensor is None:
        sensor = Sensor(
            name=packet.sensor_name or packet.sensor_internal_id or f"sensor_{unit.id}",
            internal_id=packet.sensor_internal_id,
            group_id=unit.group_id,
            control_unit_id=unit.id,
            is_online=True,
            last_seen=datetime.utcnow(),
        )
        try:
            with db.begin_nested():
                db.add(sensor)
                db.flush()
        except IntegrityError:
            # Частый кейс в проде: internal_id уже существует из прошлого импорта.
            # Повторно находим сенсор и продолжаем как update вместо падения запроса.
            if packet.sensor_internal_id:
                sensor = db.query(Sensor).filter(Sensor.internal_id == packet.sensor_internal_id).first()
            if sensor is None and packet.sensor_name:
                sensor = (
                    db.query(Sensor)
                    .filter(Sensor.control_unit_id == unit.id, Sensor.name == packet.sensor_name)
                    .first()
                )
            if sensor is None:
                raise
            sensor.control_unit_id = unit.id
            sensor.group_id = unit.group_id
            sensor.is_online = True
            sensor.last_seen = datetime.utcnow()
    else:
        sensor.control_unit_id = unit.id
        sensor.group_id = unit.group_id
        sensor.is_online = True
        sensor.last_seen = datetime.utcnow()
    return sensor


def ingest_packets(db: Session, unit: ControlUnit, packets: list[SensorPacket]) -> dict:
    saved_count = 0
    sensors_touched: set[int] = set()
    alarms_created = 0

    for packet in packets:
        sensor = _resolve_sensor(db, unit, packet)
        sensors_touched.add(sensor.id)

        measurement = Measurement(
            sensor_id=sensor.id,
            temperature=packet.temperature,
            humidity=packet.humidity,
            timestamp=packet.timestamp or datetime.utcnow(),
        )
        db.add(measurement)
        saved_count += 1

        alarms = process_telemetry_alarms(
            db=db,
            sensor=sensor,
            temperature=packet.temperature,
            humidity=packet.humidity,
        )
        alarms_created += len(alarms)

    db.commit()
    return {
        "packets_saved": saved_count,
        "sensors_touched": len(sensors_touched),
        "alarms_created": alarms_created,
    }
