# app/api/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.user import User
from app.schemas.user import TokenData
from fastapi import Depends, HTTPException, status, Request
from app.core.security import UserRoles

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    """Проверка токена и получение текущего пользователя"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str | None = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

def check_role(roles: list[str]):
    """Зависимость для проверки роли (админ/редактор/зритель)"""
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Недостаточно прав для выполнения действия"
            )
        return current_user
    return role_checker

def check_permissions(request: Request, current_user: User = Depends(get_current_user)):
    """
    Проверка прав доступа на основе метода запроса и роли пользователя.
    """
    if current_user.role == UserRoles.VIEWER:
        if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="У вас недостаточно прав для выполнения этого действия (только просмотр)."
            )
    return current_user

def get_user_scope(current_user: User = Depends(get_current_user)):
    """
    Возвращает фильтр для БД на основе локации пользователя.
    Если админ - Scope пустой (видит всё).
    Если привязан к локации - возвращает ID локации.
    """
    if current_user.role == UserRoles.ADMIN or current_user.is_superuser:
        return None  # Видит все объекты
    
    return current_user.location_id

def get_current_active_superuser(current_user: User = Depends(get_current_user)) -> User:
    """
    Проверка, является ли текущий пользователь администратором.
    """
    if current_user.role != UserRoles.ADMIN and not getattr(current_user, 'is_superuser', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Данное действие доступно только администратору."
        )
    return current_user