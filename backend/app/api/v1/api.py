from fastapi import APIRouter
from app.api.v1.endpoints import (
    alarms,
    auth,
    sensors,
    telemetry,
    websockets,
    reports,
    users,
    locations,
    control_units,
    mobile_gateway,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Авторизация"])
api_router.include_router(sensors.router, prefix="/sensors", tags=["Оборудование"])
api_router.include_router(control_units.router, prefix="/control-units", tags=["ControlUnit"])
api_router.include_router(alarms.router, prefix="/alarms", tags=["Журнал тревог и Инциденты"])
api_router.include_router(telemetry.router, prefix="/telemetry", tags=["Телеметрия"])
api_router.include_router(websockets.router, tags=["Live Уведомления"])
api_router.include_router(reports.router, prefix="/reports", tags=["Отчеты"])
api_router.include_router(users.router, prefix="/users", tags=["Пользователи"])
api_router.include_router(locations.router, prefix="/locations", tags=["locations"])
api_router.include_router(mobile_gateway.router, prefix="/mobile-gateway", tags=["MobileGateway"])