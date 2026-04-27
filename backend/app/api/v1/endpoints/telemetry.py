from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request, Query
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from app.api import deps
from app.schemas.telemetry import (
    MeasurementCreate, 
    MeasurementResponse,
    MeasurementsHistoryResponse
)
from app.crud import crud_telemetry, crud_sensor
from app.models.sensor import Sensor, Measurement
from app.services.alarm_manager import process_telemetry_alarms
from app.services.ws_manager import manager

router = APIRouter()

# ============ ПОЛУЧЕНИЕ ИСТОРИЧЕСКИХ ДАННЫХ ============

@router.get("/{sensor_id}/history", response_model=MeasurementsHistoryResponse)
def get_sensor_history(
    sensor_id: int,
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
):
    """Получить последние N измерений датчика (по умолчанию 100)"""
    sensor = crud_sensor.get_sensor(db, sensor_id=sensor_id)
    if not sensor:
        raise HTTPException(status_code=404, detail="Датчик не найден")
    
    measurements = crud_telemetry.get_latest_measurements(db, sensor_id=sensor_id, limit=limit)
    latest = crud_telemetry.get_latest_measurement(db, sensor_id=sensor_id)
    
    return {
        "sensor_id": sensor.id,
        "sensor_name": sensor.name,
        "measurements": measurements,
        "latest": latest
    }

@router.get("/{sensor_id}/last-24h", response_model=MeasurementsHistoryResponse)
def get_sensor_last_24h(
    sensor_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
):
    """Получить измерения за последние 24 часа"""
    sensor = crud_sensor.get_sensor(db, sensor_id=sensor_id)
    if not sensor:
        raise HTTPException(status_code=404, detail="Датчик не найден")
    
    measurements = crud_telemetry.get_measurements_last_24h(db, sensor_id=sensor_id)
    latest = crud_telemetry.get_latest_measurement(db, sensor_id=sensor_id)
    
    return {
        "sensor_id": sensor.id,
        "sensor_name": sensor.name,
        "measurements": measurements,
        "latest": latest
    }

@router.get("/{sensor_id}/latest", response_model=MeasurementResponse)
def get_sensor_latest(
    sensor_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
):
    """Получить последнее измерение датчика"""
    sensor = crud_sensor.get_sensor(db, sensor_id=sensor_id)
    if not sensor:
        raise HTTPException(status_code=404, detail="Датчик не найден")
    
    measurement = crud_telemetry.get_latest_measurement(db, sensor_id=sensor_id)
    if not measurement:
        raise HTTPException(status_code=404, detail="Нет данных для этого датчика")
    
    return measurement
