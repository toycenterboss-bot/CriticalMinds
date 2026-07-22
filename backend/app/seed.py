"""Инициализация БД: таблицы, superadmin из .env, контент недели 1.

Запуск:  python -m app.seed   (из папки backend, при активном venv)
Идемпотентен: повторный запуск ничего не дублирует.
"""
from .auth import hash_password
from .config import settings
from .db import Base, SessionLocal, engine
from .models import Lesson, QuizQuestion, Role, User

# Урок недели 1 (формат шагов — как в прототипе; полный контент недель 1–12
# переносится из docs/karta_36_urokov.md отдельной итерацией)
WEEK1_LESSONS = [
    {
        "week": 1, "ord": 1, "title": "Две системы мышления",
        "steps": [
            {"type": "hookNumber",
             "prompt": "Бита и мяч вместе стоят 110 рублей. Бита дороже мяча на 100 рублей. Сколько стоит мяч?",
             "unit": "руб.", "trap": 10, "correct": 5,
             "revealTrap": "10 — ответ Системы 1: быстрый, интуитивный и неверный. Если мяч стоит 10, бита стоит 110, а вместе — 120.",
             "revealCorrect": "Верно: мяч 5, бита 105. Вы включили Систему 2 там, где большинство доверяется автопилоту."},
            {"type": "concept", "title": "Система 1 и Система 2",
             "body": "Система 1 отвечает мгновенно и без усилий — и почти всегда права в привычных ситуациях.\n\nСистема 2 включается, когда задача незнакома или ставки высоки. Проблема не в том, что Система 1 ошибается, а в том, что она не сообщает, когда ошибается.\n\nОдин концепт этого урока: заметить момент, когда ответ «очевиден» — и есть сигнал проверить."},
            {"type": "check",
             "prompt": "Коллега мгновенно оценил задачу в 2 дня, «потому что уже делали похожее». Что это?",
             "options": [
                 {"text": "Опыт — можно брать оценку в план",
                  "feedback": "Возможно. Но «похожее» — любимое слово Системы 1. Проверка: чем именно похоже и чем отличается?"},
                 {"text": "Ответ Системы 1 — быстрый и, может быть, верный, но непроверенный",
                  "correct": True,
                  "feedback": "Да. Скорость ответа — не признак его качества. Один уточняющий вопрос стоит дёшево, ошибка планирования — дорого."},
                 {"text": "Ошибка — интуиции доверять нельзя",
                  "feedback": "Слишком жёстко: интуиция эксперта в знакомой области часто точна. Вопрос в том, знакома ли область на самом деле."},
             ]},
            {"type": "transfer", "label": "система-1",
             "prompt": "Сегодня поймайте один свой мгновенный ответ («очевидно же!») и письменно проверьте его в дневнике: что сказала Система 1 и что нашла Система 2."},
        ],
    },
]

WEEK1_QUIZ = [
    {"week": 1, "question": "Длина Волги, км", "unit": "км", "answer": 3530,
     "source": "БРЭ"},
    {"week": 1, "question": "Год основания МГУ", "unit": "год", "answer": 1755,
     "source": "БРЭ"},
    {"week": 1, "question": "Население Новосибирска, тыс. человек", "unit": "тыс.",
     "answer": 1633, "source": "Росстат, 2024"},
    {"week": 1, "question": "Высота Эльбруса, м", "unit": "м", "answer": 5642,
     "source": "БРЭ"},
    {"week": 1, "question": "Число символов в русском алфавите", "unit": "букв",
     "answer": 33, "source": "—"},
]


def run() -> None:
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        if db.query(User).filter(User.role == Role.superadmin).first() is None:
            if settings.seed_admin_password == "CHANGE_ME_IN_ENV":
                raise SystemExit(
                    "Задайте SEED_ADMIN_PASSWORD в .env перед первым запуском seed")
            db.add(User(
                name=settings.seed_admin_name,
                email=settings.seed_admin_email.lower(),
                password_hash=hash_password(settings.seed_admin_password),
                role=Role.superadmin,
            ))
            print(f"Создан superadmin: {settings.seed_admin_email}")
        if db.query(Lesson).count() == 0:
            for l in WEEK1_LESSONS:
                db.add(Lesson(**l))
            print(f"Загружено уроков: {len(WEEK1_LESSONS)}")
        if db.query(QuizQuestion).count() == 0:
            for q in WEEK1_QUIZ:
                db.add(QuizQuestion(**q))
            print(f"Загружено вопросов квиза: {len(WEEK1_QUIZ)}")
        db.commit()
        print("Seed завершён.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
