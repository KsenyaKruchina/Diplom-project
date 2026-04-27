from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models
from app.api import deps
from app.crud import crud_audit
from app.crud import crud_control_unit
from app.schemas.control_unit import (
    ControlUnitCreate,
    ControlUnitHeartbeat,
    ControlUnitProvisionResponse,
    ControlUnitResponse,
    ControlUnitTelemetryIn,
    ControlUnitTelemetryResult,
    ControlUnitUpdate,
)
from app.services.ws_manager import manager

router = APIRouter()


@router.post("/register", response_model=ControlUnitProvisionResponse)
def register_control_unit(
    payload: ControlUnitCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.check_role(["admin"])),
):
    try:
        unit, token = crud_control_unit.create_control_unit(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    crud_audit.create_audit_log(
        db=db,
        user_id=current_user.id,
        action=f"Зарегистрирован ЦБУ {unit.serial_number} в локации {unit.group_id}",
    )
    return {"unit": unit, "ingestion_token": token}


@router.get("/", response_model=List[ControlUnitResponse])
def read_control_units(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    if current_user.role == "admin":
        return crud_control_unit.get_control_units(db, skip=skip, limit=limit)
    if not current_user.location_id:
        return []
    return (
        db.query(models.ControlUnit)
        .filter(models.ControlUnit.group_id == current_user.location_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{control_unit_id}", response_model=ControlUnitResponse)
def get_control_unit(
    control_unit_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    unit = crud_control_unit.get_control_unit(db, control_unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="ЦБУ не найден")
    if current_user.role != "admin" and current_user.location_id != unit.group_id:
        raise HTTPException(status_code=403, detail="Нет доступа к этому ЦБУ")
    return unit


@router.patch("/{control_unit_id}", response_model=ControlUnitResponse)
def update_control_unit(
    control_unit_id: int,
    payload: ControlUnitUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.check_role(["admin"])),
):
    unit = crud_control_unit.get_control_unit(db, control_unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="ЦБУ не найден")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(unit, field, value)
    db.commit()
    db.refresh(unit)

    crud_audit.create_audit_log(
        db=db,
        user_id=current_user.id,
        action=f"Обновлён ЦБУ {unit.serial_number} (ID={unit.id})",
    )
    return unit


@router.post("/heartbeat", response_model=ControlUnitResponse)
def control_unit_heartbeat(
    payload: ControlUnitHeartbeat,
    db: Session = Depends(deps.get_db),
):
    unit = crud_control_unit.authenticate_unit(
        db=db, serial_number=payload.serial_number, token=payload.token
    )
    if not unit:
        raise HTTPException(status_code=401, detail="Неверный serial_number или token")

    crud_control_unit.update_control_unit_seen(
        db=db,
        unit=unit,
        battery_level=payload.battery_level,
        power_status=payload.power_status,
        sim_balance=payload.sim_balance,
        gsm_signal=payload.gsm_signal,
    )
    db.commit()
    db.refresh(unit)
    return unit


@router.post("/ingest", response_model=ControlUnitTelemetryResult)
def ingest_control_unit_telemetry(
    payload: ControlUnitTelemetryIn,
    db: Session = Depends(deps.get_db),
):
    unit = crud_control_unit.authenticate_unit(
        db=db, serial_number=payload.serial_number, token=payload.token
    )
    if not unit:
        raise HTTPException(status_code=401, detail="Неверный serial_number или token")
    if not payload.packets:
        raise HTTPException(status_code=400, detail="Пустой список packets")

    crud_control_unit.update_control_unit_seen(db=db, unit=unit)
    result = crud_control_unit.ingest_packets(db=db, unit=unit, packets=payload.packets)

    if result["alarms_created"] > 0:
        manager.broadcast_sync(
            {
                "type": "control_unit_alarms",
                "control_unit_id": unit.id,
                "serial_number": unit.serial_number,
                "alarms_created": result["alarms_created"],
            }
        )

    return {
        "control_unit_id": unit.id,
        "packets_received": len(payload.packets),
        "packets_saved": result["packets_saved"],
        "sensors_touched": result["sensors_touched"],
        "alarms_created": result["alarms_created"],
    }


@router.delete("/{control_unit_id}")
def delete_control_unit(
    control_unit_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.check_role(["admin"])),
):
    unit = crud_control_unit.get_control_unit(db, control_unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="ЦБУ не найден")

    linked_sensors = db.query(models.Sensor).filter(models.Sensor.control_unit_id == control_unit_id).count()
    if linked_sensors > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Нельзя удалить ЦБУ: привязано датчиков {linked_sensors}. Сначала отвяжите/удалите датчики.",
        )

    serial_number = unit.serial_number
    db.delete(unit)
    db.commit()

    crud_audit.create_audit_log(
        db=db,
        user_id=current_user.id,
        action=f"Удалён ЦБУ {serial_number} (ID={control_unit_id})",
    )
    return {"status": "deleted", "control_unit_id": control_unit_id}
