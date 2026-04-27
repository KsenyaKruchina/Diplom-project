# app/crud/crud_user.py
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

def create_user(db: Session, user_in: UserCreate) -> User:
    """Создание нового пользователя с безопасным хранением пароля"""
    # Если location_id = 0, устанавливаем None (для nullable поля)
    location_id = user_in.location_id if user_in.location_id and user_in.location_id > 0 else None
    
    db_user = User(
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        location_id=location_id,
        is_active=True,
        email=user_in.email
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_all_users(db: Session, skip: int = 0, limit: int = 100):
    """Получить список всех пользователей"""
    return db.query(User).offset(skip).limit(limit).all()

def get_user_by_id(db: Session, user_id: int):
    """Получить пользователя по ID"""
    return db.query(User).filter(User.id == user_id).first()

def get_users_by_role(db: Session, role: str, skip: int = 0, limit: int = 100):
    """Получить пользователей по роли (admin, editor, viewer)"""
    return db.query(User).filter(User.role == role).offset(skip).limit(limit).all()

def get_active_users(db: Session, skip: int = 0, limit: int = 100):
    """Получить всех активных пользователей"""
    return db.query(User).filter(User.is_active == True).offset(skip).limit(limit).all()