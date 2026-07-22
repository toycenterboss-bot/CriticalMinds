# CriticalMinds («Оптика»)

Приложение для развития критического мышления и осознанности у взрослых. Заменяет преподавателя: микроуроки и практики — в приложении, живое обучение — на еженедельных групповых встречах по сценарным карточкам.

## Структура

- `memory-bank/` — контекст проекта для AI-ассистентов (читать первым)
- `docs/` — карта 36 уроков, 12 сценарных карточек встреч, **архитектура MVP** (`docs/architecture.md`)
- `backend/` — API: FastAPI + SQLAlchemy + PostgreSQL
- `frontend/` — SPA: React + Vite (палитра «лабораторный журнал», IBM Plex)
- `prototype/` — исходный прототип «Оптика» (jsx-артефакт)
- `CLAUDE.md` — правила работы Claude Code с проектом

## Запуск на Mac (dev)

Требования: Docker Desktop, Python 3.11+, Node 18+.

```bash
# 0. Конфигурация
cp .env.example .env        # задать JWT_SECRET и SEED_ADMIN_PASSWORD

# 1. База данных
docker compose up -d db

# 2. Бэкенд (первая вкладка терминала)
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m app.seed          # таблицы + superadmin + контент недели 1
uvicorn app.main:app --reload   # API: http://localhost:8000, Swagger: /docs

# 3. Фронтенд (вторая вкладка)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Вход — email/пароль суперадмина из `.env`. Дальше: пригласить куратора (одноразовая ссылка) → куратор создаёт группу → приглашает участников.

## Тесты

```bash
cd backend && source .venv/bin/activate
pytest tests/ -v            # инварианты приватности и изоляции групп
```

## Железные правила

1. Куратор видит **количество, но не содержание**: тексты дневников и формулировки прогнозов не покидают участника. Правило зашито в API-схемы и охраняется тестом `test_privacy.py`.
2. Кураторов и групп может быть много; каждый куратор видит только свои группы (`test_access.py`).
3. Уроки — данные (JSONB в БД), не код.
