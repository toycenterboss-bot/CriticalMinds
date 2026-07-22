# Tech Context

## Текущий стек (прототип)
- React (функциональные компоненты, hooks), один файл JSX
- Стили: inline styles + дизайн-токены в JS, без CSS-фреймворков
- Шрифты: IBM Plex Sans / IBM Plex Mono через Google Fonts @import
- График калибровки: чистый SVG (без chart-библиотек)
- Состояние: useState в памяти. Персистентности нет (прототип запускался как артефакт claude.ai, где browser storage недоступен)

## Ограничения среды прототипа
- Артефакты claude.ai: НЕ использовать localStorage/sessionStorage — падают. Только in-memory state.
- Один файл, default export, без required props.

## Целевой стек (обсуждается, решения не приняты)
Кандидаты для MVP с реальной группой 7 человек:
- Фронт: React (перенос движка уроков из прототипа)
- Бэкенд: лёгкий (FastAPI — уже знаком по Self-Service Platform) либо BaaS (Supabase/Firebase)
- Критично для бэкенда: разделение данных участник/куратор на уровне API (см. systemPatterns §3)
- Push/напоминания: обязательны для дневника и уроков — влияет на выбор платформы (PWA vs нативная оболочка)

## Репозиторий
https://github.com/toycenterboss-bot/CriticalMinds
Структура:
```
memory-bank/     — контекст проекта для AI-ассистентов (этот банк)
docs/            — карта 36 уроков, сценарные карточки 12 встреч
prototype/       — рабочий прототип «Оптика» (jsx-артефакт)
CLAUDE.md        — инструкция для Claude Code: читать memory-bank перед работой
```

## Как запустить прототип
Вставить содержимое `prototype/optika_prototype.jsx` как React-артефакт в claude.ai, либо в Vite-проект (`npm create vite@latest -- --template react`, файл → App.jsx).
