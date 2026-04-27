# app/core/security.py
import hashlib
from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

# Роли в системе
class UserRoles:
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"

# Настройка шифрования: используем bcrypt через passlib
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """
    Хешируем пароль через SHA-256 перед отправкой в bcrypt.
    Это превращает пароль любой длины в 64 символа, обходя лимит bcrypt в 72 байта.
    """
    pre_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return pwd_context.hash(pre_hash)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка соответствия пароля хешу"""
    pre_hash = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
    return pwd_context.verify(pre_hash, hashed_password)

def create_access_token(subject: Union[str, Any], role: str = None) -> str:
    """Создание JWT токена с информацией о роли пользователя"""
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject), "role": role or "viewer"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

class UserRoles:
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"