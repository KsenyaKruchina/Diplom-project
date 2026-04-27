# app/core/config.py
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Система мониторинга (Цифровой двойник)"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./digital_twin.db")

    @property
    def SQLALCHEMY_DATABASE_URL(self) -> str:
        return self.DATABASE_URL

    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey")
    ALGORITHM: str = "HS256"

    # ============ Email Configuration ============
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "465"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")
    
    # ============ Telegram Configuration ============
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "")
    
    # ============ SMS Configuration (Twilio) ============
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_FROM: str = os.getenv("TWILIO_PHONE_FROM", "")
    
    # ============ Web Push Notifications ============
    VAPID_PRIVATE_KEY: str = os.getenv("VAPID_PRIVATE_KEY", "")
    VAPID_PUBLIC_KEY: str = os.getenv("VAPID_PUBLIC_KEY", "")
    VAPID_CLAIMS_EMAIL: str = os.getenv("VAPID_CLAIMS_EMAIL", "admin@example.com")
    
    # ============ File Storage ============
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "/app/uploads")
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "10"))

    class Config:
        case_sensitive = True

settings = Settings()