# Topic: Деплой и окружение
> Заведён 2026-07-23. Тестовый стенд — Mac Андрея; прод-хостинга нет.

## Состояние
Стенд жив: Postgres 16 в Docker (`optika-db`, порт **15433**), uvicorn :8000 (nohup, лог /tmp/optika_api.log), Vite :5173 (лог /tmp/optika_front.log). Репозиторий: /Users/andrey_efremov/Downloads/CriticalMinds_repo. GitHub main = стенд.

## Как раскатывать изменения (из сессии Cowork)
1. Собрать zip в облаке → SendUserFile → device_commit_files в папку репо.
2. Desktop Commander: unzip -oq, rm zip, при бэкенд-изменениях: `.venv/bin/python -m app.seed` (+ restart uvicorn: pkill -f uvicorn → nohup заново). Фронт Vite подхватывает сам.
3. git add/commit/push — ТОЛЬКО с Mac: из облачной песочницы Cowork запись в GitHub заблокирована прокси («add_repo»), пуш работает по classic-токену ghp_… (fine-grained не завёлся с Contents write? — заводился, но первый токен был read-only; рабочий — classic). ⚠️ Токен светился в чате — перевыпустить после завершения работ.

## Грабли окружения (кровью)
- ⚠️ Порты 5432 И 5433 на Mac заняты (локальный Postgres, ssh-туннели, InvestHub-контейнеры) → наш порт 15433. Симптом: «role optika does not exist» — коннект уходит в ЧУЖОЙ Postgres.
- ⚠️ Глобальный NODE_ENV=production в шелле Андрея → npm молча пропускает devDependencies («vite: command not found»). Лечение: `npm install --include=dev`, запуск `NODE_ENV=development npm run dev`.
- ⚠️ uvicorn запущен БЕЗ --reload — бэкенд-изменения требуют рестарта руками.
- ⚠️ Мост remote-devices рвётся; девайс-тулзы пропадают из списка. Перед деплоем — ToolSearch, при отсутствии просить Андрея открыть десктоп-приложение.
- ⚠️ device_bash не умеет rm; Desktop Commander — полноценный шелл macOS (gsed вместо sed -i без '').
- seed refresh сносит прогресс уроков/квизов (записи дневника и прогнозы целы) — предупреждать Андрея.

## Запуск с нуля
README.md в корне: cp .env.example .env → docker compose up -d db → venv+pip+seed+uvicorn → npm+dev. Пароль superadmin в .env (SEED_ADMIN_*, email НЕ *.local).

## Осталось
Прод-хостинг (контур МТС vs облако — решение Андрея); CI на GitHub Actions (обсуждали, не делали); перевыпуск GitHub-токена.
