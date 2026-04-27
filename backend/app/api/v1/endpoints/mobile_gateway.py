from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.api import deps
from app.crud import crud_mobile_gateway
from app.models.mobile_gateway import BleReading, BleSensor
from app.models.sensor import Measurement, Sensor
from app.schemas.mobile_gateway import (
    MobileGatewayIngestIn,
    MobileGatewayIngestOut,
    MobileGatewayRegisterIn,
    MobileGatewayRegisterOut,
)
from app.services.alarm_manager import process_telemetry_alarms

router = APIRouter()


@router.post("/register", response_model=MobileGatewayRegisterOut)
def register_mobile_gateway(
    payload: MobileGatewayRegisterIn,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    existing = crud_mobile_gateway.get_mobile_gateway_by_device_id(db, payload.device_id)
    if existing:
        if existing.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Данное устройство уже зарегистрировано")
        raise HTTPException(status_code=409, detail="Данное устройство уже зарегистрировано")

    gateway = crud_mobile_gateway.create_mobile_gateway(
        db=db,
        user_id=current_user.id,
        device_id=payload.device_id,
        device_name=payload.device_name,
        os_type=payload.os_type,
        os_version=payload.os_version,
        app_version=payload.app_version,
        order_id=payload.order_id,
    )
    return {
        "gateway_id": gateway.id,
        "device_id": gateway.device_id,
        "api_key": gateway.api_key,
    }


@router.post("/ingest", response_model=MobileGatewayIngestOut)
def ingest_mobile_gateway_data(
    payload: MobileGatewayIngestIn,
    db: Session = Depends(deps.get_db),
):
    gateway = crud_mobile_gateway.authenticate_mobile_gateway(
        db=db, device_id=payload.device_id, api_key=payload.api_key
    )
    if not gateway:
        raise HTTPException(status_code=401, detail="Неверный device_id/api_key")
    if not payload.packets:
        raise HTTPException(status_code=400, detail="Пустой список packets")

    gateway.is_online = True
    gateway.last_seen = datetime.utcnow()
    first_packet = payload.packets[0]
    if first_packet.latitude is not None and first_packet.longitude is not None:
        gateway.latitude = first_packet.latitude
        gateway.longitude = first_packet.longitude
        gateway.last_location_update = datetime.utcnow()

    packets_saved = 0
    ble_seen: set[int] = set()
    system_measurements_saved = 0
    alarms_created = 0
    skipped_system_links = 0

    for packet in payload.packets:
        requested_system_sensor = None
        if packet.system_sensor_id is not None:
            requested_system_sensor = (
                db.query(Sensor).filter(Sensor.id == packet.system_sensor_id).first()
            )
            if requested_system_sensor is None:
                skipped_system_links += 1

        ble_sensor = db.query(BleSensor).filter(BleSensor.mac_address == packet.mac_address).first()
        if not ble_sensor:
            ble_sensor = BleSensor(
                mobile_gateway_id=gateway.id,
                mac_address=packet.mac_address,
                device_name=packet.device_name,
                sensor_type=packet.sensor_type,
                manufacturer=packet.manufacturer,
                model=packet.model,
                sensor_id=requested_system_sensor.id if requested_system_sensor else None,
                is_active=True,
                is_connected=True,
            )
            db.add(ble_sensor)
            db.flush()
        else:
            ble_sensor.mobile_gateway_id = gateway.id
            ble_sensor.is_connected = True
            if requested_system_sensor is not None:
                ble_sensor.sensor_id = requested_system_sensor.id
            if packet.device_name:
                ble_sensor.device_name = packet.device_name
            if packet.rssi is not None:
                ble_sensor.rssi = packet.rssi

        ble_seen.add(ble_sensor.id)

        db.add(
            BleReading(
                mobile_gateway_id=gateway.id,
                ble_sensor_id=ble_sensor.id,
                temperature=str(packet.temperature) if packet.temperature is not None else None,
                humidity=str(packet.humidity) if packet.humidity is not None else None,
                rssi=packet.rssi,
                battery_level=packet.battery_level,
                latitude=packet.latitude,
                longitude=packet.longitude,
                timestamp=packet.timestamp or datetime.utcnow(),
            )
        )
        packets_saved += 1

        if packet.temperature is not None:
            ble_sensor.last_temperature = str(packet.temperature)
        if packet.humidity is not None:
            ble_sensor.last_humidity = str(packet.humidity)
        ble_sensor.last_reading_time = datetime.utcnow()
        if ble_sensor.first_reading_at is None:
            ble_sensor.first_reading_at = datetime.utcnow()

        if (
            ble_sensor.sensor_id
            and packet.temperature is not None
            and packet.humidity is not None
        ):
            system_sensor = db.query(Sensor).filter(Sensor.id == ble_sensor.sensor_id).first()
            if system_sensor:
                system_sensor.is_online = True
                system_sensor.last_seen = datetime.utcnow()
                db.add(
                    Measurement(
                        sensor_id=system_sensor.id,
                        temperature=packet.temperature,
                        humidity=packet.humidity,
                        timestamp=packet.timestamp or datetime.utcnow(),
                    )
                )
                system_measurements_saved += 1
                alarms = process_telemetry_alarms(
                    db=db,
                    sensor=system_sensor,
                    temperature=packet.temperature,
                    humidity=packet.humidity,
                )
                alarms_created += len(alarms)

    db.commit()
    return {
        "gateway_id": gateway.id,
        "packets_received": len(payload.packets),
        "packets_saved": packets_saved,
        "ble_sensors_seen": len(ble_seen),
        "system_measurements_saved": system_measurements_saved,
        "alarms_created": alarms_created,
        "skipped_system_links": skipped_system_links,
    }
