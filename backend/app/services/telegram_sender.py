import asyncio
import logging
from telegram import Bot
from telegram.error import TelegramError
from app.core.config import settings

logger = logging.getLogger(__name__)

async def send_telegram_message(chat_id: str, message: str) -> bool:
    """
    Отправка уведомления через Telegram Bot API
    
    Args:
        chat_id: ID чата/канала Telegram
        message: Текст сообщения
    
    Returns:
        True если отправлено успешно, False в противном случае
    """
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.warning("Telegram Bot Token not configured")
        return False
    
    try:
        bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
        await bot.send_message(chat_id=chat_id, text=message)
        logger.info(f"Telegram message sent to {chat_id}")
        return True
    except TelegramError as e:
        logger.error(f"Telegram error: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error sending Telegram message: {str(e)}")
        return False

def send_telegram_message_sync(chat_id: str, message: str) -> bool:
    """
    Синхронная версия отправки Telegram сообщения
    Используется для фоновых задач
    """
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.warning("Telegram Bot Token not configured")
        return False
    
    try:
        # Создаём новый event loop если его нет
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        return loop.run_until_complete(send_telegram_message(chat_id, message))
    except Exception as e:
        logger.error(f"Error in sync Telegram sender: {str(e)}")
        return False

async def send_telegram_alert(
    message: str,
    sensor_name: str = None,
    severity: str = "warning",
    include_timestamp: bool = True
) -> bool:
    """
    Отправка отформатированного алерта через Telegram
    
    Args:
        message: Основное сообщение
        sensor_name: Название датчика (опционально)
        severity: Уровень серьезности (warning, critical)
        include_timestamp: Включить timestamp в сообщение
    
    Returns:
        True если отправлено успешно
    """
    if not settings.TELEGRAM_CHAT_ID:
        logger.warning("Telegram Chat ID not configured")
        return False
    
    # Формируем красивое сообщение
    emoji = "⚠️" if severity == "warning" else "🚨"
    
    formatted_message = f"{emoji} **АЛЕРТ**\n"
    if sensor_name:
        formatted_message += f"Датчик: {sensor_name}\n"
    formatted_message += f"Уровень: {severity.upper()}\n"
    formatted_message += f"Сообщение: {message}"
    
    if include_timestamp:
        from datetime import datetime
        formatted_message += f"\n\nВремя: {datetime.utcnow().isoformat()}"
    
    return await send_telegram_message(settings.TELEGRAM_CHAT_ID, formatted_message)
