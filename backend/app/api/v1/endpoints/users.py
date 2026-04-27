# app/api/v1/endpoints/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.crud import crud_user, crud_audit
from typing import List
from app.schemas.user import AuditLogResponse

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_current_user(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Получить информацию о текущем авторизованном пользователе (включая роль)"""
    return current_user

@router.get("/", response_model=List[UserResponse])
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Получить список всех зарегистрированных пользователей с их ролями"""
    # Только администраторы могут запрашивать полный список пользователей
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Только администраторы могут просматривать список пользователей"
        )
    return crud_user.get_all_users(db, skip=skip, limit=limit)

@router.get("/active", response_model=List[UserResponse])
def get_active_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Получить список всех активных пользователей"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Только администраторы могут просматривать список пользователей"
        )
    return crud_user.get_active_users(db, skip=skip, limit=limit)

@router.get("/by-role/{role}", response_model=List[UserResponse])
def get_users_by_role(
    role: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Получить список пользователей по роли (admin, editor, viewer)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Только администраторы могут просматривать список пользователей"
        )
    
    valid_roles = ["admin", "editor", "viewer"]
    if role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Неверная роль. Допустимые значения: {', '.join(valid_roles)}"
        )
    
    return crud_user.get_users_by_role(db, role=role, skip=skip, limit=limit)

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Получить информацию о конкретном пользователе"""
    # Пользователь может просматривать информацию только о себе, админ может о всех
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Вы не можете просматривать информацию о других пользователях"
        )
    
    user = crud_user.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Пользователь не найден"
        )
    return user

# ============ ИЗМЕНЕНИЕ ДАННЫХ ============

@router.post("/register", response_model=UserResponse)
def register_user(
    user_in: UserCreate, 
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Регистрация нового пользователя.
    - Admin (Temperature KZ) создает Editor (Клиент) или Viewer.
    - Editor (Клиент) может создавать только Viewer для своей локации.
    """
    # Логика иерархии
    if current_user.role == "admin":
        # Обычный админ не может создавать других админов (только суперюзер)
        if user_in.role == "admin" and not getattr(current_user, 'is_superuser', False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Только SuperAdmin может создавать аккаунты администраторов"
            )
    
    elif current_user.role == "editor":
        # Editor может создавать только вьюверов
        if user_in.role != "viewer":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Вы можете создавать только аккаунты наблюдателей (viewer)"
            )
        # Принудительно ставим ту же локацию, что и у редактора
        user_in.location_id = current_user.location_id
        
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только главный администратор (SuperAdmin) может назначать роль Admin"
        )

    user = crud_user.get_user_by_username(db, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=400,
            detail="Пользователь с таким логином уже существует"
        )
    return crud_user.create_user(db=db, user_in=user_in)

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def read_audit_logs(
    skip: int = 0, 
    limit: int = 50, 
    db: Session = Depends(deps.get_db),
    # Обязательно требуем авторизацию, чтобы логи мог читать только вошедший пользователь
    current_user: User = Depends(deps.get_current_user) 
):
    """
    Получить журнал действий (Audit Trail).
    В идеале здесь стоит добавить проверку: if current_user.role != "admin": raise HTTPException(...)
    """
    logs = crud_audit.get_logs(db, skip=skip, limit=limit)
    return logs