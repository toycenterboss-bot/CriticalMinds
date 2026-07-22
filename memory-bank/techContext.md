# Tech Context

## Стек MVP (РЕШЕНИЕ ПРИНЯТО 2026-07-22, детали: docs/architecture.md)
- СУБД: **PostgreSQL 16** в Docker (docker-compose.yml в корне)
- Бэкенд: **FastAPI** (Python 3.11+), SQLAlchemy 2.0, psycopg
- Аутентификация: JWT (access 30 мин в памяти SPA + refresh HttpOnly cookie с ротацией), пароли argon2id, rate limit на /auth/* (slowapi)
- Фронтенд: **React 18 + Vite**, инлайн-стили + токены палитры C, IBM Plex
- Роли: superadmin / curator / participant; кураторов и групп много, изоляция на уровне запросов
- Онбординг: одноразовые инвайт-ссылки (TTL 72 ч, хэш в БД), без SMTP

## Структура репозитория
```
backend/          FastAPI: app/{models,schemas,auth,flags,seed}.py + routers/ + tests/
frontend/         Vite+React SPA: src/pages/{Login,Join,Participant,Curator,Admin}.jsx
docker-compose.yml  Postgres 16 (для dev — только БД)
.env.example      секреты: JWT_SECRET, SEED_ADMIN_*, DB_PASSWORD
docs/architecture.md  архитектура MVP (роли, модель данных, API, безопасность)
memory-bank/  docs/  prototype/  CLAUDE.md   — как раньше
```

## Запуск на Mac (Quickstart — подробнее в README.md)
```
cp .env.example .env   # задать JWT_SECRET (openssl rand -hex 32) и SEED_ADMIN_PASSWORD
docker compose up -d db
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && python -m app.seed && uvicorn app.main:app --reload
cd frontend && npm install && npm run dev   # http://localhost:5173
```

## Ограничения и заметки
- Email вида *.local не проходят валидацию EmailStr — для dev использовать *.app / example.com.
- Прототип-артефакт (prototype/): НЕ использовать localStorage — только in-memory state.
- Alembic-миграций пока нет (create_all в seed) — ввести ДО запуска с реальной группой.
- Push/напоминания: развилка PWA vs нативная оболочка всё ещё открыта.

## Репозиторий
https://github.com/toycenterboss-bot/CriticalMinds (push работает по classic-токену)
