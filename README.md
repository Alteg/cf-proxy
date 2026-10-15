# CF Proxy

Легковесный асинхронный HTTP/HTTPS reverse-proxy на базе Python, **FastAPI** и **HTTPX**.

## Возможности

- Проксирование любых HTTP-методов (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`).
- Потоковая передача данных (streaming request & response).
- Фильтрация hop-by-hop HTTP-заголовков.
- Простой эндпоинт проверки статуса: `/health`.
- Настройка целевого URL через переменную окружения `TARGET_BASE_URL`.

## Быстрый старт

### 1. Установка зависимостей

```bash
# Создание виртуального окружения
python -m venv .venv

# Активация (Windows)
.venv\Scripts\activate
# Активация (Linux/macOS)
source .venv/bin/activate

# Установка пакетов
pip install -r requirements.txt
```

### 2. Настройка

Скопируйте пример файла конфигурации или установите переменную окружения:

```bash
copy .env.example .env
```

По умолчанию в качестве примера задан `TARGET_BASE_URL=https://httpbin.org`.

### 3. Запуск сервера

```bash
# Через uvicorn CLI
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Или напрямую через Python
python main.py
```

### 4. Проверка работы

- Статус: [http://localhost:8000/health](http://localhost:8000/health)
- Проксирование: [http://localhost:8000/get](http://localhost:8000/get) (перенаправит на `https://httpbin.org/get`)
- Документация Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
