from sqlalchemy.orm import Session
from app.models.sensor import Sensor
from app.models.location import LocationGroup
from app.models.control_unit import ControlUnit
from app.schemas.sensor import SensorCreate, SensorUpdate
from datetime import datetime

def get_sensor(db: Session, sensor_id: int):
    """Получить один датчик по ID"""
    return db.query(Sensor).filter(Sensor.id == sensor_id).first()

def get_all_sensors(db: Session, skip: int = 0, limit: int = 100):
    """Получить список всех датчиков"""
    return db.query(Sensor).offset(skip).limit(limit).all()

def create_sensor(db: Session, sensor_in: SensorCreate):
    """Создать новый датчик"""

    # Валидация: проверяем что локация существует (если указан group_id)
    if sensor_in.group_id:
        location = db.query(LocationGroup).filter(
            LocationGroup.id == sensor_in.group_id
        ).first()

        if not location:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=400,
                detail=f"❌ Локация с ID={sensor_in.group_id} не найдена. Сначала создайте локацию (location_group) через /api/v1/locations/, а затем добавляйте датчик."
            )

    # Валидация: проверяем что центральный блок управления существует (если указан control_unit_id)
    if sensor_in.control_unit_id:
        control_unit = db.query(ControlUnit).filter(
            ControlUnit.id == sensor_in.control_unit_id
        ).first()

        if not control_unit:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=400,
                detail=f"❌ Центральный блок управления с ID={sensor_in.control_unit_id} не найден."
            )

    db_sensor = Sensor(**sensor_in.model_dump())
    db.add(db_sensor)
    db.commit()
    db.refresh(db_sensor)
    return db_sensor

def update_sensor(db: Session, sensor_id: int, sensor_update: SensorUpdate):
    """
    Обновить датчик (любые поля).
    Используется для обновления пороков, позиций и других параметров.
    """
    sensor = get_sensor(db, sensor_id)
    if not sensor:
        return None

    # Обновляем только переданные поля
    update_data = sensor_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sensor, field, value)

    db.commit()
    db.refresh(sensor)
    return sensor

def update_sensor_thresholds(
    db: Session,
    sensor_id: int,
    warning_min_temp: float = None,
    warning_max_temp: float = None,
    warning_min_hum: float = None,
    warning_max_hum: float = None,
    alarm_min_temp: float = None,
    alarm_max_temp: float = None,
    alarm_min_hum: float = None,
    alarm_max_hum: float = None,
    alarm_delay_seconds: int = None
):
    """Обновить пороги датчика"""
    sensor = get_sensor(db, sensor_id)
    if not sensor:
        return None

    if warning_min_temp is not None:
        sensor.warning_min_temp = warning_min_temp
    if warning_max_temp is not None:
        sensor.warning_max_temp = warning_max_temp
    if warning_min_hum is not None:
        sensor.warning_min_hum = warning_min_hum
    if warning_max_hum is not None:
        sensor.warning_max_hum = warning_max_hum
    if alarm_min_temp is not None:
        sensor.alarm_min_temp = alarm_min_temp
    if alarm_max_temp is not None:
        sensor.alarm_max_temp = alarm_max_temp
    if alarm_min_hum is not None:
        sensor.alarm_min_hum = alarm_min_hum
    if alarm_max_hum is not None:
        sensor.alarm_max_hum = alarm_max_hum
    if alarm_delay_seconds is not None:
        sensor.alarm_delay_seconds = alarm_delay_seconds

    db.commit()
    db.refresh(sensor)
    return sensor

def update_sensor_status(
    db: Session,
    sensor_id: int,
    is_online: bool,
    battery_level: int = None,
    power_status: str = None,
    sim_balance: float = None,
    gsm_signal: int = None
):
    """Обновление технических параметров (Heartbeat)"""
    sensor = get_sensor(db, sensor_id)
    if not sensor:
        return None

    sensor.is_online = is_online
    sensor.last_seen = datetime.utcnow()
    if battery_level is not None: sensor.battery_level = battery_level
    if power_status is not None: sensor.power_status = power_status
    if sim_balance is not None: sensor.sim_balance = sim_balance
    if gsm_signal is not None: sensor.gsm_signal = gsm_signal

    db.commit()
    db.refresh(sensor)
    return sensor
