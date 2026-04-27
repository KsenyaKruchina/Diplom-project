# app/services/alarm_manager.py
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.models.sensor import Sensor, AlarmEvent
from app.models.control_unit import ControlUnit
from app.crud.crud_telemetry import create_alarm
from app.services.threshold_cache import get_cached_thresholds, check_alert_cooldown, set_alert_cooldown
import logging

logger = logging.getLogger(__name__)

def check_thresholds(value: float, warn_min, warn_max, alarm_min, alarm_max, hysteresis=0.5):
    """Определяет уровень превышения: None, 'warning' или 'critical'"""
    # Гистерезис предотвращает 'дребезг' при колебаниях температуры на границе
    if alarm_min is not None and value < (alarm_min - hysteresis): 
        return "critical", f"Ниже критического минимума ({alarm_min})"
    if alarm_max is not None and value > (alarm_max + hysteresis): 
        return "critical", f"Выше критического максимума ({alarm_max})"
    if warn_min is not None and value < (warn_min - hysteresis): 
        return "warning", f"Ниже порога внимания ({warn_min})"
    if warn_max is not None and value > (warn_max + hysteresis): 
        return "warning", f"Выше порога внимания ({warn_max})"
    
    return None, ""

def process_telemetry_alarms(db: Session, sensor: Sensor, temperature: float, humidity: float):
    """Анализирует метрики и создает события, предотвращая дубликаты (спам)"""
    alarms_triggered = []

    # 1. ПОЛУЧЕНИЕ ПОРОГОВ (REDIS FAST PATH)
    smart_limits = get_cached_thresholds(sensor.id)
    if smart_limits:
        # Используем пороги, установленные ИИ для препарата
        a_min_t = smart_limits.get("temp_min")
        a_max_t = smart_limits.get("temp_max")
        a_max_h = smart_limits.get("hum_max")
        # Для умных порогов игнорируем уровни warning, фокусируемся на критических
        w_min_t, w_max_t, w_min_h, a_min_h, w_max_h = None, None, None, None, None
    else:
        # Fallback на ручные настройки из БД
        w_min_t, w_max_t = sensor.warning_min_temp, sensor.warning_max_temp
        a_min_t, a_max_t = sensor.alarm_min_temp, sensor.alarm_max_temp
        w_min_h, w_max_h = sensor.warning_min_hum, sensor.warning_max_hum
        a_min_h, a_max_h = sensor.alarm_min_hum, sensor.alarm_max_hum

    # ==========================================
    # 1. Проверяем температуру
    # ==========================================
    temp_severity, temp_msg = check_thresholds(temperature, w_min_t, w_max_t, a_min_t, a_max_t)
    
    if temp_severity:
        # Smart Debounce через Redis (15 мин тишины после алерта)
        if not check_alert_cooldown(sensor.id, "temperature", temp_severity):
            logger.warning(f"Sensor {sensor.id}: Temperature {temp_severity} alert triggered: {temperature}°C. {temp_msg}")
            new_alarm = create_alarm(
                db=db, 
                sensor_id=sensor.id, 
                severity=temp_severity, 
                alarm_type="temperature", 
                description=f"Температура: {temperature}°C. {temp_msg}"
            )
            # Устанавливаем кулдаун после создания тревоги
            set_alert_cooldown(sensor.id, "temperature", temp_severity)
            alarms_triggered.append(new_alarm)

    # ==========================================
    # 2. Проверяем влажность
    # ==========================================
    hum_severity, hum_msg = check_thresholds(humidity, w_min_h, w_max_h, a_min_h, a_max_h)

    if hum_severity:
        if not check_alert_cooldown(sensor.id, "humidity", hum_severity):
            logger.warning(f"Sensor {sensor.id}: Humidity {hum_severity} alert triggered: {humidity}%. {hum_msg}")
            new_alarm = create_alarm(
                db=db, 
                sensor_id=sensor.id, 
                severity=hum_severity, 
                alarm_type="humidity", 
                description=f"Влажность: {humidity}%. {hum_msg}"
            )
            # Устанавливаем кулдаун после создания тревоги
            set_alert_cooldown(sensor.id, "humidity", hum_severity)
            alarms_triggered.append(new_alarm)

    return alarms_triggered

# --- НОВЫЙ БЛОК: СИСТЕМНЫЕ ТРЕВОГИ ПО ТЗ ---

def check_system_alarms(db: Session, timeout_minutes: int = 15, battery_threshold: int = 10):
    """
    Проверяет все датчики на предмет потери связи и низкого заряда батареи.
    Вызывается фоновым планировщиком (Watchdog).
    """
    now = datetime.utcnow()
    timeout_limit = now - timedelta(minutes=timeout_minutes)
    
    # 0. Проверка работоспособности самих центральных блоков (Хабов)
    control_units = db.query(ControlUnit).filter(ControlUnit.is_active == True).all()
    for unit in control_units:
        if unit.last_seen and unit.last_seen < timeout_limit:
            # Если блок был онлайн, но теперь его last_seen устарел
            if unit.is_online:
                unit.is_online = False
                logger.warning(f"Control Unit {unit.id} (S/N: {unit.serial_number}) went offline. Last seen: {unit.last_seen}")
                
                from app.crud import crud_audit
                try:
                    crud_audit.create_audit_log(
                        db=db,
                        user_id=None, # Системное событие
                        action=f"КРИТИЧНО: Потеряна связь с центральным блоком {unit.name} (S/N: {unit.serial_number})"
                    )
                except Exception as e:
                    logger.error(f"Failed to log audit for CU offline: {e}")
        elif not unit.is_online and unit.last_seen > timeout_limit:
            # Если блок был оффлайн, но теперь прислал сигнал (восстановил связь)
            unit.is_online = True # Вернуть в онлайн, если last_seen обновился
    sensors = db.query(Sensor).all()
    
    for sensor in sensors:
        # 1. Проверка потери связи
        # Если датчик молчит дольше 15 минут, но всё еще числится как "онлайн"
        if sensor.last_seen and sensor.last_seen < timeout_limit:
            if getattr(sensor, 'is_online', True):
                sensor.is_online = False
                logger.warning(f"Sensor {sensor.id} ({sensor.name}) went offline. Last seen: {sensor.last_seen}")
                
                _create_unique_system_alarm(
                    db, 
                    sensor_id=sensor.id, 
                    message=f"Потеряна связь с датчиком. Последний сигнал: {sensor.last_seen.strftime('%Y-%m-%d %H:%M:%S')}",
                    alarm_type="connection_lost"
                )
        elif not sensor.is_online and sensor.last_seen > timeout_limit:
            # Если датчик был оффлайн, но теперь прислал сигнал (восстановил связь)
            sensor.is_online = True # Вернуть в онлайн
                
        # 2. Проверка уровня заряда
        if getattr(sensor, 'battery_level', None) is not None and sensor.battery_level <= battery_threshold:
            logger.warning(f"Sensor {sensor.id} ({sensor.name}) has low battery: {sensor.battery_level}%")
            _create_unique_system_alarm(
                db, 
                sensor_id=sensor.id, 
                message=f"Критически низкий заряд батареи: {sensor.battery_level}%",
                alarm_type="low_battery"
            )
    db.commit() # Коммитим все изменения один раз в конце

def _create_unique_system_alarm(db: Session, sensor_id: int, message: str, alarm_type: str):
    """Создает системную тревогу, только если такой же активной еще нет (защита от спама)"""
    # Ищем, нет ли уже нерешенной проблемы такого же типа у этого датчика
    existing_alarm = db.query(AlarmEvent).filter(
        AlarmEvent.sensor_id == sensor_id,
        AlarmEvent.status.in_(["new", "active", "acknowledged"]), # Ищем незакрытые
        AlarmEvent.description.like(f"%{message[:15]}%") # Проверяем по началу текста
    ).first()
    
    logger.debug(f"Checking for existing alarm of type '{alarm_type}' for sensor {sensor_id}. Found: {existing_alarm is not None}")
    if not existing_alarm:
        create_alarm(
            db=db, 
            sensor_id=sensor_id, 
            severity="critical", 
            alarm_type=alarm_type, 
            description=message
        )