# app/models/base.py
import re
from datetime import datetime
from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, declared_attr

class Base(DeclarativeBase):
    """
    Базовый декларативный класс для всех моделей проекта.
    Использует возможности SQLAlchemy 2.0 (Mapped, mapped_column).
    """
    
    @declared_attr.directive
    def __tablename__(cls) -> str:
        """
        Автоматическая генерация имени таблицы во множественном числе.
        Пример: User -> users, SensorData -> sensor_datas.
        """
        # Преобразуем CamelCase в snake_case и добавляем 's' на конце
        name = re.sub(r'(?<!^)(?=[A-Z])', '_', cls.__name__).lower()
        return f"{name}s"

class CommonMixin:
    """
    Миксин для добавления стандартных полей во все модели.
    Включает в себя ID (Primary Key) и дату создания.
    """
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, index=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Дата и время создания записи"
    )


