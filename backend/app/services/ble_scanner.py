"""
ВНИМАНИЕ: Этот сервис не предназначен для запуска на Vercel.
Vercel (Serverless) не имеет доступа к Bluetooth-адаптеру.
Данный код предназначен для запуска на локальном шлюзе (Raspberry Pi / PC).
"""
import asyncio
import requests
from bleak import BleakScanner

API_URL = "https://v2-iota-eosin.vercel.app/api/v1/telemetry/receive"

async def local_gateway_run():
    """
    Пример логики для внешнего шлюза.
    Сканирует BLE и делает POST запрос на Vercel.
    """
    def detection_callback(device, ad_data):
        # Логика фильтрации ваших датчиков
        if device.name and ("BT06" in device.name or "1625" in device.name):
            # Здесь парсим байты (зависит от модели датчика)
            # Пример:
            # temp = parse_temp(ad_data) 
            # payload = {"mac": device.address, "temp": temp, "hum": hum}
            # requests.post(API_URL, json=payload)
            pass

    scanner = BleakScanner(detection_callback)
    await scanner.start()
    while True:
        await asyncio.sleep(1)