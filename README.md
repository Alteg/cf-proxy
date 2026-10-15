# CF Proxy

Прокси-сервис с поддержкой двух вариантов запуска:
1. **Cloudflare Worker** (JavaScript, `src/index.js`, деплой через Wrangler / Cloudflare Dashboard).
2. **Локальный Python-сервер** (FastAPI + HTTPX, `main.py`).

---

## 1. Cloudflare Worker (Основной режим)

Конфигурация описана в `wrangler.toml`, точка входа — `src/index.js`.

### Возможности Worker:
- Автоматический деплой при пуше в GitHub через Cloudflare Workers Git Integration.
- Проксирование запросов на адрес, указанный в переменной `TARGET_BASE_URL` (по умолчанию `https://httpbin.org`).
- Очистка hop-by-hop и Cloudflare-специфичных заголовков.
- Проверка здоровья по адресу `/health`.

### Локальное тестирование Worker:
```bash
npx wrangler dev
```

### Развёртывание:
```bash
npx wrangler deploy
```

---

## 2. Запуск на Python (FastAPI)

### Установка зависимостей
```bash
python -m venv .venv

# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### Запуск
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

