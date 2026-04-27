# app/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from app.db.session import SessionLocal
from app.services.heartbeat_monitor import mark_stale_units_offline

scheduler = BackgroundScheduler()

def check_offline_units():
    db = SessionLocal()
    try:
        count = mark_stale_units_offline(db)
        if count > 0:
            print(f"[Scheduler] Помечено offline: {count} ЦБУ")
    finally:
        db.close()

def start_scheduler():
    scheduler.add_job(
        check_offline_units,
        trigger="interval",
        minutes=5,
        id="heartbeat_monitor",
        replace_existing=True
    )
    scheduler.start()
    print("[Scheduler] Heartbeat-монитор запущен")

def stop_scheduler():
    scheduler.shutdown()