# app/services/heartbeat_monitor.py
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.control_unit import ControlUnit

OFFLINE_THRESHOLD_MINUTES = 10  # Если нет heartbeat дольше — ставим offline

def mark_stale_units_offline(db: Session) -> int:
    """
    Вызывается планировщиком каждые 5 минут.
    Помечает как offline все ЦБУ у которых last_seen устарел.
    """
    threshold = datetime.utcnow() - timedelta(minutes=OFFLINE_THRESHOLD_MINUTES)
    
    updated = db.query(ControlUnit).filter(
        ControlUnit.is_online == True,
        ControlUnit.last_seen < threshold
    ).update({"is_online": False}, synchronize_session=False)
    
    db.commit()
    return updated