import logging
from twilio.rest import Client
from app.core.config import settings

logger = logging.getLogger(__name__)

def send_sms(to_phone: str, message: str) -> bool:
    """
    Отправка SMS сообщения через Twilio
    
    Args:
        to_phone: Номер телефона получателя (в формате +1234567890)
        message: Текст сообщения
    
    Returns:
        True если отправлено успешно, False в противном случае
    """
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        logger.warning("Twilio credentials not configured")
        return False
    
    if not settings.TWILIO_PHONE_FROM:
        logger.warning("Twilio FROM phone number not configured")
        return False
    
    try:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
        message_obj = client.messages.create(
            from_=settings.TWILIO_PHONE_FROM,
            to=to_phone,
            body=message
        )
        
        logger.info(f"SMS sent successfully to {to_phone}. SID: {message_obj.sid}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send SMS to {to_phone}: {str(e)}")
        return False

def send_sms_alert(
    to_phone: str,
    sensor_name: str = None,
    alarm_type: str = None,
    severity: str = "warning"
) -> bool:
    """
    Отправка отформатированного SMS алерта
    
    Args:
        to_phone: Номер телефона получателя
        sensor_name: Название датчика
        alarm_type: Тип тревоги (temperature, humidity и т.д.)
        severity: Уровень серьезности (warning, critical)
    
    Returns:
        True если отправлено успешно
    """
    # Формируем компактное сообщение для SMS (лимит на символы)
    severity_prefix = "⚠️ WARNING" if severity == "warning" else "🚨 CRITICAL"
    
    message = f"{severity_prefix}\n"
    if sensor_name:
        message += f"Sensor: {sensor_name}\n"
    if alarm_type:
        message += f"Type: {alarm_type}"
    
    # SMS обычно имеет лимит на символы, поэтому сокращаем
    if len(message) > 160:
        message = message[:157] + "..."
    
    return send_sms(to_phone, message)

def send_sms_broadcast(
    phone_numbers: list,
    message: str
) -> dict:
    """
    Отправка одного сообщения нескольким получателям
    
    Args:
        phone_numbers: Список номеров телефонов
        message: Текст сообщения
    
    Returns:
        Словарь с результатами {"succeeded": int, "failed": int}
    """
    results = {"succeeded": 0, "failed": 0}
    
    for phone in phone_numbers:
        if send_sms(phone, message):
            results["succeeded"] += 1
        else:
            results["failed"] += 1
    
    logger.info(f"SMS broadcast completed: {results['succeeded']} sent, {results['failed']} failed")
    return results
