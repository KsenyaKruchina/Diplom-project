# app/crud/crud_mobile_gateway.py
"""
CRUD операции для мобильного шлюза и BLE датчиков.
"""
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
import secrets
import hashlib
from app.models.mobile_gateway import MobileGateway, BleSensor, BleReading


def hash_api_key(api_key: str) -> str:
    """Хешируем API ключ для безопасного хранения в БД"""
    return hashlib.sha256(api_key.encode()).hexdigest()


def generate_api_key() -> str:
    """Генерируем уникальный API ключ для мобильного шлюза"""
    return secrets.token_urlsafe(32)


# ============ МОБИЛЬНЫЙ ШЛЮЗ ============

def create_mobile_gateway(
    db: Session, 
    user_id: int, 
    device_id: str, 
    device_name: str,
    os_type: str,
    os_version: str = None,
    app_version: str = None,
    order_id: int = None
) -> MobileGateway:
    """
    Регистрируем новое мобильное приложение (новый шлюз).
    """
    api_key = generate_api_key()
    
    gateway = MobileGateway(
        user_id=user_id,
        device_id=device_id,
        device_name=device_name,
        os_type=os_type,
        os_version=os_version,
        app_version=app_version,
        order_id=order_id,
        api_key=api_key,
        api_key_hash=hash_api_key(api_key)
    )
    db.add(gateway)
    db.commit()
    db.refresh(gateway)
    return gateway


def get_mobile_gateway(db: Session, gateway_id: int) -> MobileGateway:
    """Получить мобильный шлюз по ID"""
    return db.query(MobileGateway).filter(MobileGateway.id == gateway_id).first()


def get_mobile_gateway_by_device_id(db: Session, device_id: str) -> MobileGateway:
    """Получить мобильный шлюз по ID устройства"""
    return db.query(MobileGateway).filter(MobileGateway.device_id == device_id).first()


def authenticate_mobile_gateway(
    db: Session, 
    device_id: str, 
    api_key: str
) -> MobileGateway:
    """Аутентифицировать мобильный шлюз по device_id и api_key"""
    gateway = db.query(MobileGateway).filter(
        MobileGateway.device_id == device_id,
        MobileGateway.is_active == True
    ).first()
    
    if not gateway:
        return None
    
    # Проверяем хеш ключа
    if gateway.api_key_hash != hash_api_key(api_key):
        return None
    
    return gateway


def update_mobile_gateway_status(
    db: Session, 
    gateway_id: int, 
    is_online: bool,
    latitude: str = None,
    longitude: str = None
) -> MobileGateway:
    """Обновляем статус шлюза (online/offline) и координаты"""
    gateway = get_mobile_gateway(db, gateway_id)
    if not gateway:
        return None
    
    gateway.is_online = is_online
    gateway.last_seen = datetime.utcnow()
    
    if latitude is not None and longitude is not None:
        gateway.latitude = latitude
        gateway.longitude = longitude
        gateway.last_location_update = datetime.utcnow()
    
    db.commit()
    db.refresh(gateway)
    return gateway


def get_user_gateways(db: Session, user_id: int) -> list:
    """Получить все мобильные шлюзы пользователя"""
    return db.query(MobileGateway).filter(
        MobileGateway.user_id == user_id,
        MobileGateway.is_active == True
    ).all()


# ============ BLE ДАТЧИКИ ============

def register_ble_sensor(
    db: Session,
    mobile_gateway_id: int,
    mac_address: str,
    device_name: str,
    sensor_type: str,
    manufacturer: str = None,
    model: str = None,
    sensor_id: int = None  # Опциональная привязка к системному датчику
) -> BleSensor:
    """
    Регистрируем обнаруженный BLE датчик.
    """
    # Проверяем, не зарегистрирован ли уже этот датчик
    existing = db.query(BleSensor).filter(
        BleSensor.mac_address == mac_address
    ).first()
    
    if existing:
        return existing
    
    ble_sensor = BleSensor(
        mobile_gateway_id=mobile_gateway_id,
        mac_address=mac_address,
        device_name=device_name,
        sensor_type=sensor_type,
        manufacturer=manufacturer,
        model=model,
        sensor_id=sensor_id
    )
    db.add(ble_sensor)
    db.commit()
    db.refresh(ble_sensor)
    return ble_sensor


def get_ble_sensor(db: Session, ble_sensor_id: int) -> BleSensor:
    """Получить BLE датчик по ID"""
    return db.query(BleSensor).filter(BleSensor.id == ble_sensor_id).first()


def get_ble_sensor_by_mac(db: Session, mac_address: str) -> BleSensor:
    """Получить BLE датчик по MAC адресу"""
    return db.query(BleSensor).filter(
        BleSensor.mac_address == mac_address
    ).first()


def get_gateway_ble_sensors(db: Session, gateway_id: int) -> list:
    """Получить все BLE датчики конкретного мобильного шлюза"""
    return db.query(BleSensor).filter(
        BleSensor.mobile_gateway_id == gateway_id,
        BleSensor.is_active == True
    ).all()


def update_ble_sensor_connection(
    db: Session,
    ble_sensor_id: int,
    is_connected: bool,
    rssi: int = None,
    tx_power: int = None
) -> BleSensor:
    """Обновляем статус подключения BLE датчика"""
    sensor = get_ble_sensor(db, ble_sensor_id)
    if not sensor:
        return None
    
    sensor.is_connected = is_connected
    if rssi is not None:
        sensor.rssi = rssi
    if tx_power is not None:
        sensor.tx_power = tx_power
    
    db.commit()
    db.refresh(sensor)
    return sensor


def link_ble_sensor_to_system_sensor(
    db: Session,
    ble_sensor_id: int,
    system_sensor_id: int
) -> BleSensor:
    """
    Связываем BLE датчик с системным датчиком.
    Это позволяет тривиально интегрировать BLE датчик в систему мониторинга.
    """
    sensor = get_ble_sensor(db, ble_sensor_id)
    if not sensor:
        return None
    
    sensor.sensor_id = system_sensor_id
    db.commit()
    db.refresh(sensor)
    return sensor


# ============ BLE ИЗМЕРЕНИЯ ============

def create_ble_reading(
    db: Session,
    mobile_gateway_id: int,
    ble_sensor_id: int,
    temperature: str = None,
    humidity: str = None,
    rssi: int = None,
    battery_level: int = None,
    latitude: str = None,
    longitude: str = None
) -> BleReading:
    """
    Записываем одно измерение от BLE датчика.
    Это вызывается при каждой отправке данных с мобильного приложения.
    """
    reading = BleReading(
        mobile_gateway_id=mobile_gateway_id,
        ble_sensor_id=ble_sensor_id,
        temperature=temperature,
        humidity=humidity,
        rssi=rssi,
        battery_level=battery_level,
        latitude=latitude,
        longitude=longitude
    )
    db.add(reading)
    
    # Обновляем последние данные в самом датчике
    sensor = get_ble_sensor(db, ble_sensor_id)
    if sensor:
        sensor.last_temperature = temperature
        sensor.last_humidity = humidity
        sensor.last_reading_time = datetime.utcnow()
        if sensor.first_reading_at is None:
            sensor.first_reading_at = datetime.utcnow()
    
    db.commit()
    db.refresh(reading)
    return reading


def get_ble_sensor_readings(
    db: Session,
    ble_sensor_id: int,
    limit: int = 100,
    hours: int = None
) -> list:
    """Получить измерения от BLE датчика"""
    query = db.query(BleReading).filter(
        BleReading.ble_sensor_id == ble_sensor_id
    )
    
    if hours:
        since = datetime.utcnow() - timedelta(hours=hours)
        query = query.filter(BleReading.timestamp >= since)
    
    return query.order_by(desc(BleReading.timestamp)).limit(limit).all()


def get_mobile_gateway_readings(
    db: Session,
    gateway_id: int,
    limit: int = 500,
    hours: int = 24
) -> list:
    """Получить все измерения от конкретного мобильного шлюза за последние N часов"""
    since = datetime.utcnow() - timedelta(hours=hours)
    
    return db.query(BleReading).filter(
        BleReading.mobile_gateway_id == gateway_id,
        BleReading.timestamp >= since
    ).order_by(desc(BleReading.timestamp)).limit(limit).all()
