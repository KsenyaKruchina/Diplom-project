FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

RUN pip install uvicorn[standard]

COPY . .

EXPOSE 8000

# Скрипт для примененения миграций и запуска приложения
RUN chmod +x ./entrypoint.sh || true

ENTRYPOINT ["sh", "-c", "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000"]