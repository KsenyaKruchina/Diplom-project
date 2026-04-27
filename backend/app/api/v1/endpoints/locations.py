import os
import uuid
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app import models
from app.api import deps
from app.core.config import settings
from app.schemas.location import LocationGroupCreate, LocationGroupResponse

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/", response_model=LocationGroupResponse)
async def create_location(
    *,
    db: Session = Depends(deps.get_db),
    name: str = Form(...),
    parent_id: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: models.User = Depends(deps.get_current_active_superuser)
):
    """
    Создание новой локации с загрузкой плана (кнопка в Swagger).
    Файл сохраняется локально в папку uploads.
    """
    db_obj = models.LocationGroup(
        name=name, 
        parent_id=parent_id
    )

    # Если пользователь выбрал файл через кнопку
    if file:
        if file.content_type not in ["image/jpeg", "image/png", "image/svg+xml"]:
            raise HTTPException(status_code=400, detail="Разрешены только изображения (JPG, PNG, SVG)")
        
        try:
            # Генерация уникального имени файла
            file_extension = Path(file.filename).suffix
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = UPLOAD_DIR / unique_filename
            
            # Сохранение файла на диск
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            db_obj.image_url = f"/uploads/{unique_filename}"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ошибка сохранения файла: {str(e)}")

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.post("/{group_id}/upload-plan", response_model=LocationGroupResponse)
async def upload_location_plan(
    group_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser)
):
    """Загрузка изображения-плана для конкретной локации"""
    # 1. Проверяем формат файла
    if file.content_type not in ["image/jpeg", "image/png", "image/svg+xml"]:
        raise HTTPException(status_code=400, detail="Разрешены только форматы JPG, PNG и SVG")
    
    # 2. Ищем локацию в базе
    db_obj = db.query(models.LocationGroup).filter(models.LocationGroup.id == group_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Локация не найдена")

    # 3. Сохраняем файл локально
    try:
        file_extension = Path(file.filename).suffix
        unique_filename = f"plan_{group_id}_{uuid.uuid4().hex[:8]}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        db_obj.image_url = f"/uploads/{unique_filename}"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка сохранения файла: {str(e)}")
    
    db.commit()
    db.refresh(db_obj)
    
    return db_obj

@router.get("/", response_model=List[LocationGroupResponse])
def read_locations(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser)
):
    """Получение списка локаций"""
    # Здесь логика остается прежней, но схема LocationGroupResponse 
    # теперь автоматически вернет и поле image_url
    if current_user.role != "admin" and not current_user.is_superuser:
        if current_user.location_id:
            return db.query(models.LocationGroup).filter(
                models.LocationGroup.id == current_user.location_id
            ).all()
        return []
    return db.query(models.LocationGroup).all()


@router.delete("/{group_id}")
def delete_location(
    group_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
):
    location = db.query(models.LocationGroup).filter(models.LocationGroup.id == group_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Локация не найдена")

    child_count = db.query(models.LocationGroup).filter(models.LocationGroup.parent_id == group_id).count()
    sensors_count = db.query(models.Sensor).filter(models.Sensor.group_id == group_id).count()
    units_count = db.query(models.ControlUnit).filter(models.ControlUnit.group_id == group_id).count()
    users_count = db.query(models.User).filter(models.User.location_id == group_id).count()

    if child_count or sensors_count or units_count or users_count:
        raise HTTPException(
            status_code=400,
            detail=(
                "Нельзя удалить локацию: есть связанные объекты "
                f"(children={child_count}, sensors={sensors_count}, control_units={units_count}, users={users_count})"
            ),
        )

    db.delete(location)
    db.commit()
    return {"status": "deleted", "location_id": group_id}