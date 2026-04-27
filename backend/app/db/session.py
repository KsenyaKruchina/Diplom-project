# app/db/session.py
import os
from sqlalchemy.orm import declarative_base
from sqlalchemy import create_engine, pool
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Пытаемся взять URL из переменной окружения Vercel (DATABASE_URL) или из настроек
database_url = os.getenv("DATABASE_URL") or settings.DATABASE_URL

# Neon часто выдает postgres://, SQLAlchemy требует postgresql://
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    database_url,
    # check_same_thread нужен только для SQLite
    connect_args={"check_same_thread": False} if "sqlite" in database_url else {},
    # В Serverless (Vercel) лучше использовать NullPool, чтобы не висели лишние коннекты к Neon
    poolclass=pool.NullPool if "sqlite" not in database_url else None
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()