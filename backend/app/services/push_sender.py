from pywebpush import webpush, WebPushException
import json
from app.core.config import settings

def send_web_push(subscription_info: dict, payload: dict):
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={'sub': settings.VAPID_CLAIMS_EMAIL}
        )
    except WebPushException:
        pass