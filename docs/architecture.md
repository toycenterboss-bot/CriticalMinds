# Архитектура MVP «Оптика» (CriticalMinds)

_Версия: 1.0 — 2026-07-22. Статус: утверждён Андреем как база для разработки._

## 1. Цель и рамка

Превратить прототип (один JSX-файл, состояние в памяти) в устанавливаемое приложение с настоящей СУБД, аутентификацией и многогрупповой моделью. Тестовый стенд — Mac Андрея; целевой сценарий — группа 5–7 человек, но архитектура сразу закладывает **несколько групп с разными кураторами**.

Принципы из memory-bank, которые архитектура обязана соблюдать:

1. **Приватность на уровне данных**: куратор никогда не получает содержание дневников и формулировки прогнозов — только метаданные и счётчики. Правило реализуется на уровне API-схем, не UI.
2. **Урок = данные, движок = код**: контент недель хранится в БД (JSONB), новые уроки не требуют деплоя кода.
3. Формат урока неизменен: Крючок → Концепт (один) → Проверка → Перенос.
4. Дизайн-токены — палитра `C` прототипа, шрифты IBM Plex.
5. Язык продукта — русский.

## 2. Технологический стек (решение зафиксировано)

| Слой | Выбор | Почему |
|---|---|---|
| СУБД | **PostgreSQL 16** (Docker) | Настоящая СУБД с первого дня; та же в проде; JSONB для шагов уроков |
| Бэкенд | **FastAPI (Python 3.11+)** | Уже знаком по Self-Service Platform; Pydantic-схемы = естественный механизм приватности |
| ORM | **SQLAlchemy 2.0** + psycopg | Стандарт; позволит миграции через Alembic перед боевым запуском |
| Аутентификация | **JWT** (access 30 мин + refresh с ротацией), пароли — **argon2** | Без внешних зависимостей типа Auth0 — не усложняем |
| Фронтенд | **React 18 + Vite** | Прямой перенос движка уроков из прототипа |
| Запуск | **docker compose** (только БД) + uvicorn + vite dev | Три команды на Mac; в прод позже — компоуз целиком |

Что сознательно НЕ берём в MVP: Kubernetes, Redis, Celery, микросервисы, SSR, внешние IdP. Пуши/напоминания — отдельное решение после MVP (развилка PWA vs нативная оболочка остаётся открытой, на архитектуру БД не влияет).

## 3. Роли и модель доступа (RBAC)

Три роли, одна колонка `users.role`:

- **superadmin** — владелец инсталляции (Андрей). Создаёт кураторов (через инвайт), видит список групп и их кураторов. **Не видит** содержание чьих-либо дневников/прогнозов — правило приватности распространяется и на него.
- **curator** — администратор учебных групп. Создаёт группы, приглашает участников, видит кураторскую панель **только своих групп** (метаданные и счётчики). Кураторов может быть несколько; чужие группы недоступны — проверка `group.curator_id == current_user.id` в каждом эндпоинте (объектная авторизация, не только ролевая).
- **participant** — участник. Видит только своё: уроки, дневник, прогнозы, квизы, график калибровки; плюс сценарную карточку встречи своей группы.

Куратор может одновременно быть участником своей группы (кейс Андрея): это membership в `group_members`, роль в группе не меняет глобальную роль. Его собственные записи попадают в его же кураторскую сводку как счётчики — наравне со всеми.

### Матрица доступа (ключевые операции)

| Операция | participant | curator | superadmin |
|---|---|---|---|
| Свои уроки/дневник/прогнозы/квизы | ✅ CRUD | ✅ (если участник группы) | — |
| Создать группу | — | ✅ | ✅ |
| Инвайт участника в группу | — | ✅ только в свою | ✅ |
| Кураторская панель группы | — | ✅ только своя, только метаданные | ✅ только метаданные |
| Инвайт куратора | — | — | ✅ |
| Содержание чужого дневника/прогноза | ❌ | ❌ | ❌ |

Последняя строка — инвариант системы. Эндпоинтов, возвращающих чужой контент, не существует физически.

## 4. Модель данных

```
users            id, name, email(unique), password_hash, role, is_active, created_at
groups           id, name, curator_id→users, start_date, created_at
group_members    group_id→groups, user_id→users, joined_at   (PK: group_id+user_id)
invites          id, token_hash(unique), role, group_id→groups NULL, created_by→users,
                 expires_at, used_at NULL, used_by→users NULL
refresh_tokens   id, user_id→users, token_hash, expires_at, revoked_at NULL

lessons          id, week, ord, title, steps JSONB      -- контент = данные
lesson_progress  user_id, lesson_id, started_at, completed_at NULL, duration_sec
journal_entries  id, user_id, created_at, text, confidence, label NULL, shared bool
predictions      id, user_id, created_at, text, confidence, deadline,
                 resolved_at NULL, outcome NULL
quiz_questions   id, week, question, lo, hi, unit, answer, source
quiz_attempts    id, user_id, week, created_at, hits int, total int
quiz_answers     attempt_id, question_id, lo, hi, hit bool
```

Замечания:

- `lessons.steps` — JSONB-массив шагов тех же типов, что в прототипе (`hookNumber`, `hookChoice`, `concept`, `check`, `firstEntry`, `transfer`). Движок фронтенда рендерит по `type` — прямой перенос `LessonPlayer`.
- `journal_entries.text` и `predictions.text` — единственные «приватные» поля. Кураторские запросы агрегируют эти таблицы **только** через `COUNT`/`MAX(created_at)` — текстовые колонки не попадают даже в SELECT.
- График калибровки строится из `quiz_answers` (точки при заявленных 90%) + разрешённых `predictions` (бакеты по уверенности) — паттерн «калибровка как сквозная сущность» сохранён.
- `invites.token_hash`: в БД хранится SHA-256 от токена, сам токен живёт только в ссылке. Одноразовость — `used_at`; срок — `expires_at` (72 часа по умолчанию).

## 5. Аутентификация и безопасность

**Вход**: email + пароль → `POST /auth/login` → access JWT (30 мин, в памяти SPA) + refresh-токен (HttpOnly cookie, 14 дней, ротация при каждом обновлении, хэш в БД → отзыв работает).

**Онбординг** (без почтового сервера):
1. Куратор жмёт «Пригласить участника» → бэкенд создаёт `invite` и возвращает одноразовую ссылку `https://…/join?token=…`.
2. Куратор передаёт ссылку лично (мессенджер).
3. Участник открывает ссылку → `POST /auth/accept-invite`: имя + пароль → аккаунт создан, membership в группе проставлен, инвайт погашен.
4. Инвайт куратора — то же самое, но создаёт его только superadmin и `group_id` пуст.

Первый superadmin создаётся seed-скриптом из переменных окружения (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`) при пустой БД.

**Защитные меры MVP**:

- Пароли: argon2id; минимум 10 символов.
- Rate limit на `/auth/*` (slowapi): 5 попыток/мин с IP.
- CORS — только origin фронтенда; в проде фронт и API за одним доменом.
- Все проверки доступа — зависимости FastAPI: `require_role(...)` + объектные проверки владения группой. Запрещено размазывать проверки по коду руками.
- Приватность контента — отдельные Pydantic-схемы для кураторских ответов (`MemberMeta`, `GroupDashboard`), в которых текстовых полей нет вообще; плюс автотест, который валит сборку, если в кураторском JSON появляется поле `text`.
- Секреты (`JWT_SECRET`, пароль БД) — в `.env`, файл в `.gitignore`, в репо — `.env.example`.

## 6. API (поверхность MVP)

```
POST /auth/login            вход → access + refresh cookie
POST /auth/refresh          ротация refresh → новый access
POST /auth/logout           отзыв refresh
POST /auth/accept-invite    регистрация по инвайт-токену
GET  /auth/invite-info      имя группы/роль по токену (для экрана регистрации)

GET  /me                    профиль + группа + номер текущей недели
GET  /me/lessons            уроки с прогрессом (доступность по неделям группы)
POST /me/lessons/{id}/start | /complete      прогресс + длительность
GET|POST /me/journal        дневник (только свой)
GET|POST /me/predictions    прогнозы; POST /me/predictions/{id}/resolve
GET  /me/quiz/current       вопросы недели; POST /me/quiz — сдать
GET  /me/calibration        данные графика (квизы + бакеты прогнозов)
GET  /me/meeting            сценарная карточка текущей недели + «что принести»

POST /curator/groups                         создать группу
GET  /curator/groups                         ТОЛЬКО свои группы
GET  /curator/groups/{id}/dashboard          сводка недели: счётчики, автофлаги (5 правил
                                             из прототипа, teamFlags — чистая функция)
GET  /curator/groups/{id}/members            карточки участников: тайминги уроков,
                                             счётчики практик — БЕЗ содержания
POST /curator/groups/{id}/invites            инвайт участника → одноразовая ссылка

POST /admin/curator-invites  инвайт куратора (superadmin)
GET  /admin/groups           все группы + кураторы (метаданные)
```

## 7. Структура репозитория

```
backend/
  app/
    main.py            FastAPI, CORS, подключение роутеров
    config.py          настройки из .env (pydantic-settings)
    db.py              engine, SessionLocal, get_db
    models.py          SQLAlchemy-модели (§4)
    schemas.py         Pydantic; кураторские схемы — отдельный блок без контент-полей
    auth.py            argon2, JWT, get_current_user, require_role
    flags.py           teamFlags: чистая функция автофлагов над метаданными
    seed.py            superadmin из env + уроки недели 1 + квиз недели 1
    routers/
      auth.py  me.py  curator.py  admin.py
  tests/
    test_privacy.py    инвариант: в кураторских ответах нет content-полей
    test_access.py     куратор А не видит группу куратора Б
  requirements.txt
frontend/
  index.html  package.json  vite.config.js
  src/
    main.jsx  App.jsx       роутинг по ролям, оболочка
    api.js                  fetch-клиент с access-токеном и авторефрешем
    tokens.js               палитра C + IBM Plex (из прототипа)
    pages/  Login.jsx  Join.jsx  Participant.jsx  Curator.jsx  Admin.jsx
docker-compose.yml           postgres:16 + volume
.env.example  README.md (Quickstart для Mac)
docs/architecture.md         этот документ
```

Фронтенд-каркас в этой итерации — оболочка с аутентификацией и ролевым роутингом; перенос движка уроков, дневника, трекера и графика из `prototype/optika_prototype.jsx` — следующая итерация (движок переносится почти дословно: данные уже в том же формате шагов).

## 8. Запуск на Mac (Quickstart)

```bash
# 0. Требования: Docker Desktop, Python 3.11+, Node 18+
git clone https://github.com/toycenterboss-bot/CriticalMinds && cd CriticalMinds
cp .env.example .env                      # при желании поменять пароли/секреты

# 1. База
docker compose up -d db

# 2. Бэкенд
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m app.seed                        # таблицы + superadmin + неделя 1
uvicorn app.main:app --reload             # http://localhost:8000 (docs: /docs)

# 3. Фронтенд (другая вкладка терминала)
cd frontend && npm install && npm run dev # http://localhost:5173
```

Вход: email/пароль superadmin из `.env`. Дальше — инвайт куратора → инвайт участников.

## 9. Дорожная карта после каркаса

1. Перенос движка уроков и всех практик из прототипа во фронтенд (участник получает полный опыт недели 1).
2. Контент недель 2–12 → JSONB-формат `lessons` (из `docs/karta_36_urokov.md`).
3. Банк калибровочных вопросов (~60 шт.) → `quiz_questions`.
4. Alembic-миграции — обязательно ДО запуска с реальной группой.
5. Напоминания: решение PWA vs нативная оболочка → пуши дневника/уроков/четверга.
6. Механика «поделиться с группой», слепое сравнение «до/после» (неделя 12), режим поддержки.
7. Прод-хостинг: внутренний контур МТС vs внешнее облако (открытый вопрос из activeContext).

## 10. Риски и как закрыты

| Риск | Мера |
|---|---|
| Утечка приватного контента куратору | Отдельные схемы без content-полей + автотест `test_privacy.py` + правило: SELECT без текстовых колонок |
| Куратор видит чужую группу | Объектная авторизация в каждом эндпоинте + `test_access.py` |
| Кража инвайт-ссылки | TTL 72 ч, одноразовость, хэш в БД, привязка к группе/роли |
| Слитый refresh-токен | Ротация + хэши в БД + отзыв при logout |
| Простой перебор пароля | argon2 + rate limit на /auth/* |
