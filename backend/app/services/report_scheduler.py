from datetime import datetime, timedelta
from app.db.session import SessionLocal
from app.models.user import User
from app.models.sensor import Sensor, Measurement, AlarmEvent
from app.services.email_sender import send_email_with_attachments
from app.services.report_generator import generate_pdf_report, generate_excel_report

def scheduled_daily_report():
    """Фоновая задача: сбор данных, генерация PDF и Excel и их рассылка"""
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        start_date = now - timedelta(days=1)
        
        # Получаем все активные датчики
        sensors = db.query(Sensor).all()
        
        # Находим пользователей для рассылки (например, админов)
        users = db.query(User).filter(
            User.email.isnot(None),
            User.role == "admin"
        ).all()

        if not users:
            print("Нет пользователей с email для рассылки отчетов.")
            return

        for sensor in sensors:
            # 1. Формируем данные о датчике (как ожидает генератор)
            sensor_data = {
                "name": sensor.name,
                "group_id": sensor.group_id
            }
            
            # 2. Получаем измерения за сутки
            measurements = db.query(Measurement).filter(
                Measurement.sensor_id == sensor.id,
                Measurement.timestamp >= start_date
            ).order_by(Measurement.timestamp.asc()).all()
            
            # 3. Получаем инциденты и форматируем их под требования PDF-генератора
            raw_alarms = db.query(AlarmEvent).filter(
                AlarmEvent.sensor_id == sensor.id,
                AlarmEvent.timestamp >= start_date
            ).all()
            
            incidents = [{
                'timestamp': alarm.timestamp,
                'title': alarm.description or "Тревога",
                'is_completed': alarm.status == "resolved",
                'comment': alarm.user_comment or "-"
            } for alarm in raw_alarms]
            
            # 4. Генерируем отчеты
            try:
                pdf_output = generate_pdf_report(sensor_data, measurements, incidents)
                excel_output = generate_excel_report(sensor_data, measurements, incidents)
                
                # Извлекаем байты (защита на случай, если генератор возвращает BytesIO)
                pdf_bytes = pdf_output if isinstance(pdf_output, bytes) else pdf_output.getvalue()
                excel_bytes = excel_output if isinstance(excel_output, bytes) else excel_output.getvalue()
                
                # 5. Упаковываем файлы
                date_str = start_date.strftime('%Y_%m_%d')
                safe_name = sensor.name.replace(" ", "_")
                files_to_send = [
                    {"filename": f"Report_{safe_name}_{date_str}.pdf", "bytes": pdf_bytes},
                    {"filename": f"Data_{safe_name}_{date_str}.xlsx", "bytes": excel_bytes}
                ]
                
                # 6. Делаем рассылку по админам
                for user in users:
                    send_email_with_attachments(
                        to_email=user.email,
                        subject=f"Ежедневный отчет: {sensor.name} ({start_date.strftime('%d.%m.%Y')})",
                        body=f"Здравствуйте, {user.username}!\n\nВо вложении находятся PDF-отчет и Excel-выгрузка по датчику «{sensor.name}» за последние 24 часа.",
                        attachments=files_to_send
                    )
                print(f"Отчеты для '{sensor.name}' успешно отправлены.")
                
            except Exception as e:
                print(f"Ошибка при генерации отчета для датчика {sensor.name}: {e}")

    except Exception as e:
        print(f"Глобальная ошибка в планировщике отчетов: {e}")
    finally:
        db.close()