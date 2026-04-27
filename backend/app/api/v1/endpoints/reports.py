from fastapi import APIRouter, Depends, Query, Response, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.sensor import Sensor, Measurement, AlarmEvent
from app.models.location import LocationGroup
from app.services import report_generator
from datetime import datetime, timedelta
from app.crud.crud_audit import log_action
from app.models.user import User
from typing import Optional
from enum import Enum

router = APIRouter()

# Enum для предустановленных периодов
class PeriodType(str, Enum):
    LAST_24_HOURS = "last_24_hours"
    LAST_WEEK = "last_week"
    LAST_MONTH = "last_month"
    LAST_2_MONTHS = "last_2_months"
    LAST_3_MONTHS = "last_3_months"
    LAST_6_MONTHS = "last_6_months"
    LAST_YEAR = "last_year"
    CUSTOM = "custom"

def get_date_range(period: PeriodType, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    """
    Получить диапазон дат на основе периода или пользовательских дат
    """
    end = datetime.utcnow()
    
    if period == PeriodType.LAST_24_HOURS:
        start = end - timedelta(hours=24)
    elif period == PeriodType.LAST_WEEK:
        start = end - timedelta(days=7)
    elif period == PeriodType.LAST_MONTH:
        start = end - timedelta(days=30)
    elif period == PeriodType.LAST_2_MONTHS:
        start = end - timedelta(days=60)
    elif period == PeriodType.LAST_3_MONTHS:
        start = end - timedelta(days=90)
    elif period == PeriodType.LAST_6_MONTHS:
        start = end - timedelta(days=180)
    elif period == PeriodType.LAST_YEAR:
        start = end - timedelta(days=365)
    elif period == PeriodType.CUSTOM:
        if not start_date or not end_date:
            raise ValueError("Для периода 'custom' требуются параметры start_date и end_date")
        start = start_date
        end = end_date
    else:
        start = end - timedelta(days=30)
    
    return start, end

@router.get("/download-period/{sensor_id}")
def download_report_by_period(
    sensor_id: int,
    period: PeriodType = Query(PeriodType.LAST_MONTH, description="Предустановленный период"),
    start_date: Optional[str] = Query(None, description="Начальная дата (YYYY-MM-DD), требуется для периода 'custom'"),
    end_date: Optional[str] = Query(None, description="Конечная дата (YYYY-MM-DD), требуется для периода 'custom'"),
    format: str = Query("xlsx", pattern="^(xlsx|pdf|csv)$"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    
    # Проверяем, что датчик существует
    sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Датчик не найден")
    
    # Парсим даты если указаны
    parsed_start_date = None
    parsed_end_date = None
    
    if period == PeriodType.CUSTOM:
        if not start_date or not end_date:
            raise HTTPException(
                status_code=400, 
                detail="Для периода 'custom' требуются параметры start_date и end_date в формате YYYY-MM-DD"
            )
        
        try:
            parsed_start_date = datetime.strptime(start_date, "%Y-%m-%d")
            parsed_end_date = datetime.strptime(end_date, "%Y-%m-%d")
            # Устанавливаем время на конец дня для end_date
            parsed_end_date = parsed_end_date.replace(hour=23, minute=59, second=59)
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail="Неверный формат даты. Используйте формат YYYY-MM-DD (например, 2026-04-16)"
            )
        
        # Проверяем корректность диапазона
        if parsed_start_date > parsed_end_date:
            raise HTTPException(
                status_code=400, 
                detail="start_date не может быть позже end_date"
            )
    
    # Получаем диапазон дат
    try:
        start_time, end_time = get_date_range(period, parsed_start_date, parsed_end_date)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Получаем измерения за период
    measurements = db.query(Measurement).filter(
        Measurement.sensor_id == sensor_id,
        Measurement.timestamp >= start_time,
        Measurement.timestamp <= end_time
    ).order_by(Measurement.timestamp.asc()).all()
    
    # Получаем тревоги за период
    raw_alarms = db.query(AlarmEvent).filter(
        AlarmEvent.sensor_id == sensor_id,
        AlarmEvent.timestamp >= start_time,
        AlarmEvent.timestamp <= end_time
    ).order_by(AlarmEvent.timestamp.asc()).all()
    
    # Преобразуем тревоги в формат для отчета
    incidents = []
    for alarm in raw_alarms:
        severity = getattr(alarm, "severity", None)
        alarm_type = getattr(alarm, "alarm_type", None)
        user_comment = getattr(alarm, "user_comment", None)
        
        severity_prefix = f"[{str(severity).upper()}] " if severity else ""
        event_title = f"{severity_prefix}{str(alarm_type) if alarm_type else 'Тревога'}"
        
        incidents.append({
            "title": event_title,
            "timestamp": alarm.timestamp,
            "is_completed": alarm.status == "resolved",
            "comment": str(user_comment) if user_comment else "-"
        })
    
    sensor_info = {"id": sensor_id, "name": getattr(sensor, "name", "Неизвестно")}
    
    # Определяем название периода для лога
    if period == PeriodType.CUSTOM:
        period_name = f"с {start_date} по {end_date}"
    else:
        period_names = {
            PeriodType.LAST_24_HOURS: "последние 24 часа",
            PeriodType.LAST_WEEK: "последние 7 дней",
            PeriodType.LAST_MONTH: "последний месяц",
            PeriodType.LAST_2_MONTHS: "последние 2 месяца",
            PeriodType.LAST_3_MONTHS: "последние 3 месяца",
            PeriodType.LAST_6_MONTHS: "последние 6 месяцев",
            PeriodType.LAST_YEAR: "последний год"
        }
        period_name = period_names.get(period, "неизвестный период")
    
    # Генерируем отчет
    if format == "xlsx":
        file_data = report_generator.generate_excel_report(sensor_info, measurements, incidents=incidents)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = f"report_{sensor_id}_{start_time.strftime('%Y-%m-%d')}_{end_time.strftime('%Y-%m-%d')}.xlsx"
    elif format == "csv":
        file_data = report_generator.generate_csv_report(sensor_info, measurements, incidents=incidents)
        media_type = "text/csv"
        filename = f"report_{sensor_id}_{start_time.strftime('%Y-%m-%d')}_{end_time.strftime('%Y-%m-%d')}.csv"
    else:
        file_data = report_generator.generate_pdf_report(sensor_info, measurements, incidents=incidents)
        media_type = "application/pdf"
        filename = f"report_{sensor_id}_{start_time.strftime('%Y-%m-%d')}_{end_time.strftime('%Y-%m-%d')}.pdf"
    
    # Логируем действие
    log_action(
        db=db,
        user_id=getattr(current_user, "id"),
        action=f"Скачал отчет ({format.upper()}) для датчика '{sensor.name}' (ID: {sensor_id}) за период: {period_name}"
    )
    
    return Response(
        content=file_data,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/download-period-location/{location_id}")
def download_location_report_by_period(
    location_id: int,
    period: PeriodType = Query(PeriodType.LAST_MONTH, description="Предустановленный период"),
    start_date: Optional[str] = Query(None, description="Начальная дата (YYYY-MM-DD), требуется для периода 'custom'"),
    end_date: Optional[str] = Query(None, description="Конечная дата (YYYY-MM-DD), требуется для периода 'custom'"),
    format: str = Query("xlsx", pattern="^(xlsx|pdf|csv)$"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    
    # Проверяем, что локация существует
    location = db.query(LocationGroup).filter(LocationGroup.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Локация не найдена")
    
    # Парсим даты если указаны
    parsed_start_date = None
    parsed_end_date = None
    
    if period == PeriodType.CUSTOM:
        if not start_date or not end_date:
            raise HTTPException(
                status_code=400, 
                detail="Для периода 'custom' требуются параметры start_date и end_date в формате YYYY-MM-DD"
            )
        
        try:
            parsed_start_date = datetime.strptime(start_date, "%Y-%m-%d")
            parsed_end_date = datetime.strptime(end_date, "%Y-%m-%d")
            parsed_end_date = parsed_end_date.replace(hour=23, minute=59, second=59)
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail="Неверный формат даты. Используйте формат YYYY-MM-DD (например, 2026-04-16)"
            )
        
        if parsed_start_date > parsed_end_date:
            raise HTTPException(
                status_code=400, 
                detail="start_date не может быть позже end_date"
            )
    
    # Получаем диапазон дат
    try:
        start_time, end_time = get_date_range(period, parsed_start_date, parsed_end_date)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Получаем все датчики в локации
    sensors = db.query(Sensor).filter(Sensor.group_id == location_id).all()
    
    if not sensors:
        raise HTTPException(
            status_code=400,
            detail="В локации нет датчиков"
        )
    
    # Собираем данные по всем датчикам
    all_measurements = []
    all_incidents = []
    sensors_info = []
    
    for sensor in sensors:
        # Добавляем информацию о датчике
        sensors_info.append({
            "id": sensor.id,
            "name": sensor.name,
            "group_id": sensor.group_id,
            "is_online": sensor.is_online,
            "battery_level": sensor.battery_level
        })
        
        # Получаем измерения за период
        measurements = db.query(Measurement).filter(
            Measurement.sensor_id == sensor.id,
            Measurement.timestamp >= start_time,
            Measurement.timestamp <= end_time
        ).order_by(Measurement.timestamp.asc()).all()
        
        # Добавляем измерения с информацией о датчике
        for m in measurements:
            all_measurements.append({
                "sensor_id": sensor.id,
                "sensor_name": sensor.name,
                "temperature": m.temperature,
                "humidity": m.humidity,
                "timestamp": m.timestamp
            })
        
        # Получаем тревоги за период
        raw_alarms = db.query(AlarmEvent).filter(
            AlarmEvent.sensor_id == sensor.id,
            AlarmEvent.timestamp >= start_time,
            AlarmEvent.timestamp <= end_time
        ).order_by(AlarmEvent.timestamp.asc()).all()
        
        # Преобразуем тревоги в формат для отчета
        for alarm in raw_alarms:
            severity = getattr(alarm, "severity", None)
            alarm_type = getattr(alarm, "alarm_type", None)
            user_comment = getattr(alarm, "user_comment", None)
            resolved_by = getattr(alarm, "resolved_by_id", None)
            resolved_at = getattr(alarm, "resolved_at", None)
            
            severity_prefix = f"[{str(severity).upper()}] " if severity else ""
            event_title = f"{severity_prefix}{str(alarm_type) if alarm_type else 'Тревога'} ({sensor.name})"
            
            all_incidents.append({
                "title": event_title,
                "sensor_name": sensor.name,
                "sensor_id": sensor.id,
                "timestamp": alarm.timestamp,
                "is_completed": alarm.status == "resolved",
                "status": alarm.status,
                "comment": str(user_comment) if user_comment else "-",
                "resolved_by_id": resolved_by,
                "resolved_at": resolved_at
            })
    
    location_info = {
        "id": location_id,
        "name": location.name,
        "sensors_count": len(sensors)
    }
    
    # Определяем название периода для лога
    if period == PeriodType.CUSTOM:
        period_name = f"с {start_date} по {end_date}"
    else:
        period_names = {
            PeriodType.LAST_24_HOURS: "последние 24 часа",
            PeriodType.LAST_WEEK: "последние 7 дней",
            PeriodType.LAST_MONTH: "последний месяц",
            PeriodType.LAST_2_MONTHS: "последние 2 месяца",
            PeriodType.LAST_3_MONTHS: "последние 3 месяца",
            PeriodType.LAST_6_MONTHS: "последние 6 месяцев",
            PeriodType.LAST_YEAR: "последний год"
        }
        period_name = period_names.get(period, "неизвестный период")
    
    # Генерируем отчет
    if format == "xlsx":
        file_data = report_generator.generate_excel_report(
            location_info, 
            all_measurements, 
            incidents=all_incidents,
            is_location_report=True
        )
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = f"location_{location_id}_{location.name}_{start_time.strftime('%Y-%m-%d')}_{end_time.strftime('%Y-%m-%d')}.xlsx"
    elif format == "csv":
        file_data = report_generator.generate_csv_report(
            location_info, 
            all_measurements, 
            incidents=all_incidents
        )
        media_type = "text/csv"
        filename = f"location_{location_id}_{location.name}_{start_time.strftime('%Y-%m-%d')}_{end_time.strftime('%Y-%m-%d')}.csv"
    else:
        file_data = report_generator.generate_pdf_report(
            location_info, 
            all_measurements, 
            incidents=all_incidents,
            is_location_report=True
        )
        media_type = "application/pdf"
        filename = f"location_{location_id}_{location.name}_{start_time.strftime('%Y-%m-%d')}_{end_time.strftime('%Y-%m-%d')}.pdf"
    
    # Логируем действие
    log_action(
        db=db,
        user_id=getattr(current_user, "id"),
        action=f"Скачал отчет ({format.upper()}) для локации '{location.name}' (ID: {location_id}) с {len(sensors)} датчиками за период: {period_name}"
    )
    
    return Response(
        content=file_data,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )