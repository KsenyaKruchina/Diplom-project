from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas, crud
from app.api import deps
from app.schemas.sensor import SensorCreate, SensorResponse, SensorUpdate
from app.services.ai_service import get_drug_thresholds
from app.services.threshold_cache import cache_thresholds
from app.crud import crud_sensor, crud_audit

router = APIRouter()
@router.post("/{sensor_id}/set-medication", response_model=SensorResponse)
def set_sensor_medication(
    sensor_id: int,
    drug_name: str,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.check_role(["admin", "editor"]))
):
    """
    Умная настройка порогов: ИИ определяет условия хранения препарата.
    """
    sensor = crud_sensor.get_sensor(db, sensor_id)
    if not sensor:
        raise HTTPException(status_code=404, detail="Датчик не найден")

    # 1. AI Chain
    ai_data = get_drug_thresholds(drug_name)
    if not ai_data:
        raise HTTPException(status_code=503, detail="ИИ-сервис временно недоступен. Попробуйте позже.")

    # 2. Update DB & Log medication history
    sensor.alarm_min_temp = ai_data.temp_min
    sensor.alarm_max_temp = ai_data.temp_max
    sensor.alarm_max_hum = ai_data.hum_max
    
    new_item = models.MonitoredItem(
        sensor_id=sensor.id,
        drug_name=drug_name,
        description=ai_data.logic_explanation,
        temp_min=ai_data.temp_min,
        temp_max=ai_data.temp_max,
        hum_max=ai_data.hum_max,
        assigned_by_id=current_user.id
    )
    db.add(new_item)

    # 3. Update Redis Cache (Fast Path)
    cache_thresholds(sensor_id, {
        "temp_min": ai_data.temp_min,
        "temp_max": ai_data.temp_max,
        "hum_max": ai_data.hum_max,
        "drug": drug_name
    })

    db.commit()
    
    crud_audit.create_audit_log(
        db=db,
        user_id=current_user.id,
        action=f"Установлен препарат '{drug_name}' для датчика {sensor.name}. Пороги: {ai_data.temp_min}-{ai_data.temp_max}°C. {ai_data.logic_explanation}"
    )
    
    return sensor

@router.post("/create_sensor", response_model=SensorResponse)
def create_sensor(
    sensor_in: SensorCreate,
    db: Session = Depends(deps.get_db),
    # Только сотрудники temperature kz (админы) устанавливают и регистрируют датчики
    current_user = Depends(deps.check_role(["admin"]))
):
    """
    Создать новый датчик.

    Датчик может быть привязан к:
    - Центральному блоку управления (control_unit_id)
    - Или напрямую к локации (group_id)

    ⚠️ Требуется: перед созданием датчика должны существовать локация (location_group) и/или центральный блок управления с указанными ID
    """

    # Проверяем что локация существует (если указан group_id)
    if sensor_in.group_id:
        location = db.query(models.LocationGroup).filter(
            models.LocationGroup.id == sensor_in.group_id
        ).first()

        if not location:
            raise HTTPException(
                status_code=400,
                detail=f"❌ Локация с ID={sensor_in.group_id} не найдена. Сначала создайте локацию (location_group) через /api/v1/locations/, а затем добавляйте датчик."
            )

    # Проверяем что центральный блок управления существует (если указан control_unit_id)
    if sensor_in.control_unit_id:
        control_unit = db.query(models.ControlUnit).filter(
            models.ControlUnit.id == sensor_in.control_unit_id
        ).first()

        if not control_unit:
            raise HTTPException(
                status_code=400,
                detail=f"❌ Центральный блок управления с ID={sensor_in.control_unit_id} не найден. Сначала создайте центральный блок управления через /api/v1/control-units/, а затем добавляйте датчик."
            )

    return crud_sensor.create_sensor(db=db, sensor_in=sensor_in)

@router.patch("/{sensor_id}/position", response_model=SensorResponse)
def update_sensor_position(
    sensor_id: int,
    position: SensorUpdate,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.check_role(["admin", "editor"]))
):
    """Обновление координат датчика на плане (pos_x, pos_y)"""
    db_obj = db.query(models.Sensor).filter(models.Sensor.id == sensor_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Датчик не найден")

    # Editor может двигать датчики только в своей локации
    if current_user.role == "editor" and db_obj.group_id != current_user.location_id:
        raise HTTPException(status_code=403, detail="Нет доступа к датчикам другой локации")
    
    # Обновляем только те поля, которые переданы (x и y)
    if position.pos_x is not None:
        db_obj.pos_x = position.pos_x
    if position.pos_y is not None:
        db_obj.pos_y = position.pos_y
        
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.patch("/{sensor_id}/thresholds", response_model=SensorResponse)
def update_sensor_thresholds(
    sensor_id: int,
    thresholds: SensorUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.check_role(["admin", "editor"]))
):
    """
    Обновление пороков датчика (температура, влажность, задержка тревоги).
    
    Поддерживаемые поля:
    - warning_min_temp, warning_max_temp (пороги внимания температуры)
    - warning_min_hum, warning_max_hum (пороги внимания влажности)
    - alarm_min_temp, alarm_max_temp (пороги тревоги температуры)
    - alarm_min_hum, alarm_max_hum (пороги тревоги влажности)
    - alarm_delay_seconds (задержка перед срабатыванием тревоги)
    
    Пример запроса:
    PATCH /api/v1/sensors/5/thresholds
    {
        "alarm_min_temp": 10.0,
        "alarm_max_temp": 30.0,
        "alarm_delay_seconds": 300
    }
    """
    sensor = crud_sensor.get_sensor(db, sensor_id)
    if not sensor:
        raise HTTPException(status_code=404, detail="Датчик не найден")
    
    # Сохраняем старые значения для логирования
    changes = []
    
    # Обновляем пороги
    threshold_fields = [
        "warning_min_temp", "warning_max_temp",
        "warning_min_hum", "warning_max_hum",
        "alarm_min_temp", "alarm_max_temp",
        "alarm_min_hum", "alarm_max_hum",
        "alarm_delay_seconds"
    ]
    
    update_data = thresholds.model_dump(exclude_unset=True)
    
    for field in threshold_fields:
        if field in update_data and update_data[field] is not None:
            old_value = getattr(sensor, field)
            new_value = update_data[field]
            if old_value != new_value:
                changes.append(f"{field}: {old_value} → {new_value}")
                setattr(sensor, field, new_value)
    
    if not changes:
        # Если ничего не менялось, просто возвращаем датчик
        return sensor
    
    db.commit()
    db.refresh(sensor)

    # ВАЖНО: Синхронизируем Redis при ручном изменении
    cache_thresholds(sensor_id, {
        "temp_min": sensor.alarm_min_temp,
        "temp_max": sensor.alarm_max_temp,
        "hum_max": sensor.alarm_max_hum,
        "manual_update": True
    })

    # Логируем действие в audit log
    action_description = f"Обновлены пороги датчика '{sensor.name}' (ID={sensor_id}): {'; '.join(changes)}"
    try:
        crud_audit.create_audit_log(
            db=db,
            user_id=current_user.id,
            action=action_description
        )
    except Exception as e:
        # Если не получилось залогировать, не прерываем запрос
        pass
    
    return sensor

@router.patch("/{sensor_id}", response_model=SensorResponse)
def update_sensor(
    sensor_id: int,
    sensor_update: SensorUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.check_role(["admin", "editor"]))
):
    """
    Универсальное обновление датчика (любые поля).
    
    Можно обновлять:
    - name, group_id, pos_x, pos_y (параметры датчика)
    - Все пороги (warning_*, alarm_*)
    - alarm_delay_seconds (задержка тревоги)
    """
    sensor = crud_sensor.get_sensor(db, sensor_id)
    if not sensor:
        raise HTTPException(status_code=404, detail="Датчик не найден")
    
    # Сохраняем старые значения для логирования
    changes = []
    
    update_data = sensor_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if value is not None:
            old_value = getattr(sensor, field)
            if old_value != value:
                changes.append(f"{field}: {old_value} → {value}")
                setattr(sensor, field, value)
    
    if not changes:
        return sensor
    
    db.commit()
    db.refresh(sensor)
    
    # Логируем действие
    action_description = f"Обновлён датчик '{sensor.name}' (ID={sensor_id}): {'; '.join(changes)}"
    try:
        crud_audit.create_audit_log(
            db=db,
            user_id=current_user.id,
            action=action_description
        )
    except:
        pass
    
    return sensor

@router.get("/{sensor_id}", response_model=SensorResponse)
def get_sensor(
    sensor_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """Получить информацию о датчике по ID"""
    sensor = crud_sensor.get_sensor(db, sensor_id)
    if not sensor:
        raise HTTPException(status_code=404, detail="Датчик не найден")
    
    # Проверка прав доступа (админ видит всех, остальные - только свою локацию)
    if current_user.role != "admin" and sensor.group_id != current_user.location_id:
        raise HTTPException(status_code=403, detail="У вас нет доступа к этому датчику")
    
    return sensor

@router.get("/", response_model=List[SensorResponse])
def read_sensors(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """Получить список датчиков"""
    if current_user.role != "admin":
        if not current_user.location_id:
            return []
            
        return db.query(models.Sensor).filter(
            models.Sensor.group_id == current_user.location_id
        ).all()
        
    return crud_sensor.get_all_sensors(db)


@router.delete("/{sensor_id}")
def delete_sensor(
    sensor_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.check_role(["admin"])),
):
    sensor = crud_sensor.get_sensor(db, sensor_id)
    if not sensor:
        raise HTTPException(status_code=404, detail="Датчик не найден")

    sensor_name = sensor.name
    db.delete(sensor)
    db.commit()

    crud_audit.create_audit_log(
        db=db,
        user_id=current_user.id,
        action=f"Удалён датчик '{sensor_name}' (ID={sensor_id})",
    )
    return {"status": "deleted", "sensor_id": sensor_id}