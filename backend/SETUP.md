# 🛠️ SETUP - Инструкция по установке для разработчиков

Пошаговое руководство по настройке проекта на вашей машине.

## 📋 Требования

### Обязательно:
- **Git** - система контроля версий
- **Docker Desktop** - для контейнеризации ([скачать](https://www.docker.com/products/docker-desktop))
- **Docker Compose** - обычно идёт с Docker Desktop

### Опционально (для локальной разработки без Docker):
- **Python 3.12+** - интерпретатор
- **PostgreSQL 15+** - БД (если не используется SQLite)
- **IDE** - VS Code / PyCharm

## 🚀 Установка с Docker (рекомендуется)

### Шаг 1: Клонирование репозитория

```bash
git clone <your-repository-url>
cd v2-main/V2
```

### Шаг 2: Запуск Docker Compose

```bash
# Запустить все сервисы в фоне
docker-compose up -d

# Или с логами в консоль (для отладки)
docker-compose up
```

**Что происходит:**
1. Скачивается образ PostgreSQL
2. Скачивается образ Nginx
3. Собирается Docker образ приложения
4. Создаются и запускаются все контейнеры
5. Автоматически применяются миграции БД (Alembic)

### Шаг 3: Проверка

```bash
# Проверить статус контейнеров
docker-compose ps

# Должны быть 3 контейнера в статусе "Up"
# iot_backend, iot_postgres, iot_nginx

# Проверить доступность API
curl http://localhost:8000/

# Должен вернуть:
# {"status":"ok","message":"Сервер '...' успешно запущен!"}
```

### Шаг 4: Откройте в браузере

- **Swagger UI документация:** http://localhost:8000/docs
- **ReDoc документация:** http://localhost:8000/redoc
- **Прямой доступ к API:** http://localhost:8000/api/v1/

## 💻 Локальная установка (без Docker)

### Шаг 1: Установка Python

```bash
# macOS (с Homebrew)
brew install python@3.12

# Windows - скачайте с https://www.python.org/downloads/
# Linux (Ubuntu/Debian)
sudo apt-get install python3.12 python3.12-venv python3.12-dev
```

### Шаг 2: Создание виртуального окружения

```bash
# Перейти в папку проекта
cd v2-main/V2

# Создать venv
python3.12 -m venv venv

# Активировать (macOS/Linux)
source venv/bin/activate

# Активировать (Windows)
venv\Scripts\activate
```

### Шаг 3: Установка зависимостей

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Шаг 4: Настройка .env файла

```bash
# Создайте файл .env в корне проекта
touch .env  # macOS/Linux
# или создайте вручную на Windows

# Добавьте эти строки:
cat > .env << EOF
DATABASE_URL=sqlite:///./digital_twin.db
SECRET_KEY=dev-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
PROJECT_NAME=Система мониторинга (Цифровой двойник)
EOF
```

### Шаг 5: Запуск приложения

```bash
# Убедитесь, что venv активирован
which python  # должен показать путь в venv

# Запустить сервер
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Откройте http://localhost:8000/docs в браузере
```

## 📧 Настройка переменных окружения

### Docker (docker-compose.yml)

```yaml
environment:
  - DATABASE_URL=postgresql://monitor_user:monitor_password@db:5432/monitoring_db
  - SECRET_KEY=your-super-secret-key-here
```

### Локально (.env файл)

```env
# База данных
DATABASE_URL=sqlite:///./digital_twin.db
# или для PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Security
SECRET_KEY=my-super-secret-key-min-32-chars-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Project
PROJECT_NAME=Система мониторинга (Цифровой двойник)
DEBUG=True
```

> ⚠️ **ВАЖНО:** Никогда не коммитьте `.env` файл с реальными секретами! Используйте `.env.example`:

```bash
# Создайте .env.example для примера
cp .env .env.example
# Отредактируйте .env.example, удалив настоящие значения
git add .env.example
git commit -m "Add .env.example template"
```

## 🗄️ Работа с Alembic (Миграции БД)

### Если вы знаете, что будете менять структуру БД:

```bash
# 1. Измените модель в app/models/
vim app/models/sensor.py

# 2. Создайте миграцию
# С Docker:
docker exec iot_backend alembic revision --autogenerate -m "add_new_column"

# Локально:
alembic revision --autogenerate -m "add_new_column"

# 3. Примените миграцию
# С Docker:
docker exec iot_backend alembic upgrade head

# Локально:
alembic upgrade head

# 4. Проверьте историю
# С Docker:
docker exec iot_backend alembic history

# Локально:
alembic history
```

## 🧪 Тестирование

### Проверка здоровья API

```bash
# Health check
curl http://157.90.127.202:8000/

# Swagger документация
curl http://157.90.127.202:8000/docs

# Конкретный эндпоинт (без авторизации)
curl http://157.90.127.202:8000/api/v1/sensors/
```

### Логирование ошибок

```bash
# Смотреть логи Docker
docker-compose logs -f iot_backend

# Смотреть логи PostgreSQL
docker-compose logs -f iot_postgres

# Очистить логи
docker-compose logs --tail 0
```

## 🔄 Обновление кода

```bash
#停止приложения
docker-compose down

# Получить новые изменения
git pull origin main

# Пересоздать контейнеры с новым кодом
docker-compose up -d --build

# Применить новые миграции (если они есть)
docker exec iot_backend alembic upgrade head
```

## 🧹 Очистка

### Очистить все контейнеры и данные

```bash
# Остановить и удалить всё
docker-compose down -v

# Удалить образы
docker image rm v2_web postgres:15-alpine nginx:alpine
```

### Удалить только БД (сохранить приложение)

```bash
docker-compose down -v
docker-compose up -d
```

## 🐛 Типичные проблемы

### "Port 8000 is already in use"

```bash
# Найдите процесс на порту 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Остановите процесс или используйте другой порт
uvicorn main:app --port 8001
```

### "Cannot connect to Docker daemon"

```bash
# Убедитесь, что Docker Desktop запущен
# Перезагрузите Docker Desktop
# Или перезагрузитесь

# Проверьте статус
docker ps
```

### "ModuleNotFoundError: No module named 'app'"

```bash
# Убедитесь, что находитесь в папке V2
pwd  # должна быть .../v2-main/V2

# Активируйте venv
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Переустановите зависимости
pip install -r requirements.txt
```

### "FAILED: Target database is not up to date"

```bash
# Это значит, что Alembic и БД не синхронизированы
# С Docker:
docker exec iot_backend alembic stamp head
docker exec iot_backend alembic upgrade head

# Локально:
alembic stamp head
alembic upgrade head
```

## 📚 Дополнительные ресурсы

- **API Документация:** [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **README проекта:** [README.md](README.md)
- **FastAPI документация:** https://fastapi.tiangolo.com/
- **Alembic документация:** https://alembic.sqlalchemy.org/
- **Docker dokumentácie:** https://docs.docker.com/

## 📞 Помощь

Если у вас возникли проблемы:

1. Проверьте логи: `docker-compose logs -f`
2. Прочитайте [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
3. Откройте issue на GitHub
4. Спросите в Slack/Discord

---

**Последнее обновление:** 7 апреля 2026
