from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.sensor import Measurement, AlarmEvent
from app.schemas.telemetry import MeasurementCreate
from datetime import datetime, timedelta

def create_measurement(db: Session, measurement_in: MeasurementCreate):
    """Запись новых показаний температуры и влажности"""
    db_measurement = Measurement(
        sensor_id=measurement_in.sensor_id,
        temperature=measurement_in.temperature,
        humidity=measurement_in.humidity
    )
    db.add(db_measurement)
    db.commit()
    db.refresh(db_measurement)
    return db_measurement

def get_latest_measurements(db: Session, sensor_id: int, limit: int = 100):
    """Получить последние N измерений датчика (по умолчанию последние 100)"""
    measurements = db.query(Measurement).filter(
        Measurement.sensor_id == sensor_id
    ).order_by(desc(Measurement.timestamp)).limit(limit).all()
    return list(reversed(measurements))  # Обратный порядок (от старых к новым)

def get_measurements_last_24h(db: Session, sensor_id: int):
    """Получить все измерения за последние 24 часа"""
    since = datetime.utcnow() - timedelta(hours=24)
    measurements = db.query(Measurement).filter(
        Measurement.sensor_id == sensor_id,
        Measurement.timestamp >= since
    ).order_by(Measurement.timestamp.asc()).all()
    return measurements

def get_latest_measurement(db: Session, sensor_id: int):
    """Получить последнее измерение датчика"""
    measurement = db.query(Measurement).filter(
        Measurement.sensor_id == sensor_id
    ).order_by(desc(Measurement.timestamp)).first()
    return measurement

def create_alarm(db: Session, sensor_id: int, severity: str, alarm_type: str, description: str):
    """Регистрация тревожного события"""
    alarm = AlarmEvent(
        sensor_id=sensor_id,
        severity=severity,
        alarm_type=alarm_type,
        description=description
    )
    db.add(alarm)
    db.commit()
    db.refresh(alarm)
    return alarm
