import redis
import json
import os
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Инициализация Redis
# Используем getattr и os.getenv для предотвращения AttributeError, 
# если переменная не определена в классе Settings, и обеспечения fallback-значения.
redis_url = getattr(settings, "REDIS_URL", os.getenv("REDIS_URL", "redis://localhost:6379"))

try:
    redis_client = redis.from_url(redis_url, decode_responses=True)
except Exception as e: # type: ignore
    logger.error(f"Ошибка подключения к Redis: {e}")
    redis_client = None

def cache_thresholds(sensor_id: int, thresholds: dict):
    """Сохраняет пороги в Redis для мгновенного доступа телеметрией"""
    if not redis_client:
        return False
    key = f"thresholds:sensor:{sensor_id}"
    try:
        redis_client.set(key, json.dumps(thresholds), ex=settings.REDIS_TTL_SECONDS) # 24h TTL
    except Exception:
        return False

def get_cached_thresholds(sensor_id: int):
    """Получает пороги из кэша. Если нет — Fast Path пропускается"""
    if not redis_client:
        return None
    key = f"thresholds:sensor:{sensor_id}"
    try:
        data = redis_client.get(key)
        return json.loads(data) if data else None
    except Exception:
        return None

def check_alert_cooldown(sensor_id: int, alert_type: str, severity: str) -> bool:
    """
    Debounce Logic: Проверяет, отправляли ли мы алерт по этому сенсору недавно.
    Кулдаун зависит от severity: для critical может быть короче.
    """
    if not redis_client:
        return False # Если Redis нет, шлем алерты всегда (безопасный режим)
    
    # Разные кулдауны для разных типов тревог
    cooldown_seconds = settings.ALERT_COOLDOWN_WARNING_SECONDS if severity == "warning" else settings.ALERT_COOLDOWN_CRITICAL_SECONDS
    
    key = f"cooldown:{sensor_id}:{alert_type}:{severity}"
    try:
        if redis_client.exists(key):
            logger.debug(f"Alert for sensor {sensor_id}, type {alert_type}, severity {severity} is on cooldown.")
            return True
        return False
    except Exception:
        return False

def set_alert_cooldown(sensor_id: int, alert_type: str, severity: str):
    cooldown_seconds = settings.ALERT_COOLDOWN_WARNING_SECONDS if severity == "warning" else settings.ALERT_COOLDOWN_CRITICAL_SECONDS
    key = f"cooldown:{sensor_id}:{alert_type}:{severity}"
    if redis_client:
        redis_client.set(key, "active", ex=cooldown_seconds)
        logger.debug(f"Set cooldown for sensor {sensor_id}, type {alert_type}, severity {severity} for {cooldown_seconds} seconds.")