from sqlalchemy.orm import Session
from app.models.user import AuditLog

def log_action(db: Session, user_id: int, action: str):
    """
    Записывает действие пользователя в Журнал (Audit Trail)
    """
    audit_entry = AuditLog(
        user_id=user_id,
        action=action
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry

# Alias для удобства
def create_audit_log(db: Session, user_id: int, action: str):
    """Альтернативное имя для log_action"""
    return log_action(db, user_id, action)

def get_logs(db: Session, skip: int = 0, limit: int = 50):
    """
    Получает последние логи (для отображения в админке)
    """
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()