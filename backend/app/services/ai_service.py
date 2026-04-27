import instructor
import google.generativeai as genai
from app.core.config import settings
from pydantic import BaseModel, Field, field_validator
from typing import Optional
import logging

class DrugStorageConditions(BaseModel):
    temp_min: float = Field(..., description="Минимальная температура хранения в градусах Цельсия")
    temp_max: float = Field(..., description="Максимальная температура хранения в градусах Цельсия")
    hum_max: Optional[float] = Field(None, description="Максимально допустимая влажность в %")
    logic_explanation: str = Field(..., description="Краткое обоснование выбора условий на основе справочников")

    @field_validator("temp_max")
    @classmethod
    def validate_range(cls, v, info):
        if "temp_min" in info.data and v <= info.data["temp_min"]:
            raise ValueError("Максимальная температура должна быть выше минимальной")
        if v > 50 or v < -80:
            raise ValueError("Температурный диапазон выходит за рамки реалистичных условий хранения лекарств")
        return v

# Инициализация Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

def get_drug_thresholds(drug_name: str) -> Optional[DrugStorageConditions]:
    """
    Запрашивает условия хранения препарата у LLM.
    Circuit Breaker: При ошибке API возвращает None (fallback на ручные пороги).
    """
    if not settings.GEMINI_API_KEY:
        logging.error("GEMINI_API_KEY не установлен в настройках.")
        return None

    prompt = f"Определи официальные условия хранения препарата: {drug_name}. Верни только JSON."
    
    try:
        # Ленивая инициализация клиента внутри функции
        client = instructor.from_gemini(
            client=genai.GenerativeModel(
                model_name="gemini-1.5-flash",
            ),
        )

        # Реализация Structured Outputs
        return client.chat.completions.create(
            response_model=DrugStorageConditions,
            messages=[
                {"role": "system", "content": "Ты — фармацевтический эксперт. Твоя задача — предоставлять точные условия хранения лекарств согласно фармакопее."},
                {"role": "user", "content": prompt}
            ],
            timeout=10.0
        )
    except Exception as e:
        logging.error(f"AI Service Error (Circuit Breaker Triggered): {e}")
        return None