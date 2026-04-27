# app/services/heartbeat.py
import asyncio
from datetime import datetime, timedelta
from app.db.session import SessionLocal
from app.models.sensor import Sensor
from app.crud.crud_telemetry import create_alarm

async def check_offline_sensors():
    """Фоновая задача: ищет датчики, которые молчат дольше 10 минут"""
    while True:
        await asyncio.sleep(60) # Пауза 60 секунд
        
        db = SessionLocal()
        try:
            # Отнимаем 10 минут от текущего времени
            cutoff_time = datetime.utcnow() - timedelta(minutes=10)
            
            # Находим датчики, которые числятся "онлайн", но данные присылали давно
            offline_sensors = db.query(Sensor).filter(
                Sensor.last_seen < cutoff_time,
                Sensor.is_online == True
            ).all()

            for sensor in offline_sensors:
                # Меняем статус
                sensor.is_online = False
                
                # Генерируем критическую тревогу
                create_alarm(
                    db=db, 
                    sensor_id=sensor.id, 
                    severity="critical",
                    alarm_type="connection_lost", 
                    description=f"Потеря связи с датчиком '{sensor.name}'!"
                )
                
                # TODO: На Этапе 5 добавим здесь отправку пуша на телефон
                
            if offline_sensors:
                db.commit()
        except Exception as e:
            print(f"Ошибка в heartbeat: {e}")
        finally:
            db.close()