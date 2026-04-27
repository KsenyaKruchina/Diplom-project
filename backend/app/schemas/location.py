from pydantic import BaseModel
from typing import Optional

class LocationGroupBase(BaseModel):
    name: str
    parent_id: Optional[int] = None
    # Добавляем поле для URL или пути к изображению плана
    image_url: Optional[str] = None

class LocationGroupCreate(LocationGroupBase):
    pass

class LocationGroupUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[int] = None
    image_url: Optional[str] = None

class LocationGroupResponse(LocationGroupBase):
    id: int

    class Config:
        from_attributes = True