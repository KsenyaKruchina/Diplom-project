from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.api import deps
from app.models.user import PushSubscription

router = APIRouter()

class SubscriptionKeys(BaseModel):
    p256dh: str
    auth: str

class SubscriptionCreate(BaseModel):
    endpoint: str
    keys: SubscriptionKeys

@router.post('/subscribe')
def subscribe_device(sub_data: SubscriptionCreate, db: Session = Depends(deps.get_db)):
    existing = db.query(PushSubscription).filter(PushSubscription.endpoint == sub_data.endpoint).first()
    if not existing:
        new_sub = PushSubscription(
            endpoint=sub_data.endpoint,
            p256dh=sub_data.keys.p256dh,
            auth=sub_data.keys.auth
        )
        db.add(new_sub)
        db.commit()
    return {'status': 'success'}