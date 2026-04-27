# app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api import deps
from app.core import security
from app.models.user import User
from app.schemas.user import Token

router = APIRouter()

@router.post("/login", response_model=Token)
def login(db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    """Вход в систему и получение JWT токена"""
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
        )
    
    access_token = security.create_access_token(subject=user.username, role=user.role)
    return {"access_token": access_token, "token_type": "bearer"}