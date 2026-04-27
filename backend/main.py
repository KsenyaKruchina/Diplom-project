from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.responses import JSONResponse
import logging
from alembic.config import Config
from alembic import command
from fastapi.staticfiles import StaticFiles # Добавляем импорт для статики
from app.core.config import settings
from apscheduler.schedulers.background import BackgroundScheduler
from app.db.session import SessionLocal
from app.services.alarm_manager import check_system_alarms
import os # Добавляем для работы с папками
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.shceduler import start_scheduler, stop_scheduler

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
# Импортируем нашу базу данных и все модели
from app.db.session import engine
from app.models.base import Base
from app.api import deps
from app.api.v1.api import api_router

# Примечание: Alembic теперь управляет миграциями БД
# Base.metadata.create_all() больше не требуется - используйте alembic upgrade head

# Инициализируем приложение
app = FastAPI(title=settings.PROJECT_NAME)

app.add_event_handler("startup", start_scheduler)
app.add_event_handler("shutdown", stop_scheduler)

# --- Раздача статических файлов ---
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -----------------------------------------

scheduler = BackgroundScheduler()

app.include_router(api_router, prefix="/api/v1")

# ============ ОБРАБОТЧИК ОШИБОК БД ============
@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    """
    Обработчик для ошибок целостности БД (ForeignKey, Unique constraints и т.д.)
    Выводит понятную ошибку вместо падения сервера
    """
    error_detail = str(exc.orig)
    
    # Парсим типичные ошибки
    if "foreign key constraint" in error_detail.lower():
        # ForeignKeyViolation - ссылка на несуществующую запись
        if "location_groups" in error_detail:
            return JSONResponse(
                status_code=400,
                content={
                    "detail": "❌ Ошибка: локация с указанным ID не существует. Сначала создайте локацию через /api/v1/locations/",
                    "error_type": "ForeignKeyViolation"
                }
            )
        elif "sensors" in error_detail:
            return JSONResponse(
                status_code=400,
                content={
                    "detail": "❌ Ошибка: датчик с указанным ID не существует",
                    "error_type": "ForeignKeyViolation"
                }
            )
        else:
            return JSONResponse(
                status_code=400,
                content={
                    "detail": "❌ Ошибка: похоже вы ссылаетесь на несуществующую запись. Проверьте ID всех связанных объектов (локации, датчики и т.д.)",
                    "error_type": "ForeignKeyViolation"
                }
            )
    
    elif "not-null constraint" in error_detail.lower():
        return JSONResponse(
            status_code=400,
            content={
                "detail": f"❌ Ошибка: пропущено обязательное поле. {error_detail}",
                "error_type": "NotNullViolation"
            }
        )
    
    elif "unique constraint" in error_detail.lower():
        # Unique constraint violation
        return JSONResponse(
            status_code=409,
            content={
                "detail": "❌ Ошибка: запись с таким значением уже существует",
                "error_type": "UniqueConstraintViolation"
            }
        )
    
    # Default message for other IntegrityErrors
    return JSONResponse(
        status_code=400,
        content={
            "detail": f"❌ Ошибка целостности данных: {error_detail[:100]}",
            "error_type": "IntegrityError"
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Глобальный перехватчик всех необработанных ошибок.
    Логирует ошибку в консоль и возвращает 500 с деталями.
    """
    logging.error(f"Глобальная ошибка: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Внутренняя ошибка сервера. Проверьте логи консоли.",
            "error_msg": str(exc),
            "path": request.url.path
        }
    )
# =============================================

def run_alembic_migrations():
    """Runs Alembic migrations programmatically."""
    # Определяем абсолютный путь к alembic.ini
    base_dir = os.path.dirname(os.path.abspath(__file__))
    ini_path = os.path.join(base_dir, "alembic.ini")
    
    if not os.path.exists(ini_path):
        logging.error(f"Alembic config not found at {ini_path}")
        return

    alembic_cfg = Config(ini_path)
    
    # Ensure alembic.ini is correctly configured to pick up the DATABASE_URL from settings
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
        
    alembic_cfg.set_main_option("sqlalchemy.url", db_url)
    command.upgrade(alembic_cfg, "head")
    logging.info("Alembic migrations applied successfully.")


@app.get("/")
def health_check():
    """
    Проверка здоровья системы:
    - Проверка подключения к БД (PostgreSQL)
    - Проверка наличия таблиц (миграций)
    """
    services = {}
    
    # Проверка подключения к базе
    try:
        with engine.connect() as connection:
            result = connection.execute(text(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users');"
            ))
            tables_exist = result.scalar()
            if tables_exist:
                services["database"] = "connected"
            else:
                services["database"] = "connected_but_no_tables"
    except Exception as e:
        services["database"] = f"error: {str(e)}"
    
    # Проверка локального хранилища
    try:
        upload_dir_exists = os.path.exists(UPLOAD_DIR) and os.path.isdir(UPLOAD_DIR)
        services["uploads_directory"] = "ok" if upload_dir_exists else "not_found"
    except Exception as e:
        services["uploads_directory"] = f"error: {str(e)}"

    # Определяем общий статус
    status = "ok"
    if "error" in services["database"]:
        status = "error"
    elif services["database"] == "connected_but_no_tables":
        status = "migration_required"

    return {
        "status": status,
        "message": f"Сервер '{settings.PROJECT_NAME}' запущен и готов к работе. Статус: {status}",
        "services": services,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/v1/cron/watchdog")
async def cron_watchdog_trigger(db: Session = Depends(deps.get_db)):
    """
    Эндпоинт для проверки датчиков и Control Units.
    Может использоваться для периодического вызова через внешний Cron.
    """
    try:
        check_system_alarms(db)
    except Exception as e: # type: ignore
        logging.error(f"Ошибка в cron_watchdog_trigger: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ошибка при выполнении Watchdog: {e}")
    return {"status": "checked", "timestamp": datetime.utcnow()}

def watchdog_job():
    """Фоновая задача: проверяет датчики на потерю связи и разряд батареи"""
    db = SessionLocal()
    try:
        check_system_alarms(db)
    finally: # type: ignore
        db.close()

@app.on_event("startup")
def start_scheduler():
    """Запуск фонового планировщика при старте приложения"""
    scheduler.add_job(watchdog_job, 'interval', minutes=1)
    scheduler.start()
    logging.info("Планировщик фоновых задач (Watchdog) успешно запущен!")

@app.on_event("shutdown")
def stop_scheduler():
    """Остановка фонового планировщика при завершении приложения"""
    scheduler.shutdown()

# ээээээ