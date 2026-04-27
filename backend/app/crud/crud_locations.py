from sqlalchemy.orm import Session
from app.models.location import LocationGroup
from app.schemas.location import LocationGroupCreate

def create(db: Session, *, obj_in: LocationGroupCreate):
    # Используем имена полей из вашей схемы LocationGroupCreate (name, parent_id)
    db_obj = LocationGroup(
        name=obj_in.name, 
        parent_id=obj_in.parent_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_multi(db: Session, skip: int = 0, limit: int = 100):
    return db.query(LocationGroup).offset(skip).limit(limit).all()

def get(db: Session, id: int):
    return db.query(LocationGroup).filter(LocationGroup.id == id).first()