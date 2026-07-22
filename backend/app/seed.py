"""Инициализация БД: таблицы, superadmin из .env, контент программы.

Запуск:  python -m app.seed            — первичная инициализация (идемпотентен)
         python -m app.seed refresh    — пересоздать контент уроков/квизов
                                         (стирает и прогресс уроков/квизов!)

Контент: app/content/ — 36 уроков (12 недель), банк калибровочных вопросов.
"""
import sys

from .auth import hash_password
from .config import settings
from .content import ALL_LESSONS, ALL_QUIZ
from .db import Base, SessionLocal, engine
from .models import (
    Lesson, LessonProgress, QuizAnswer, QuizAttempt, QuizQuestion, Role, User,
)


def _insert_content(db) -> None:
    for l in ALL_LESSONS:
        db.add(Lesson(**l))
    for q in ALL_QUIZ:
        db.add(QuizQuestion(**q))
    print(f"Загружено: {len(ALL_LESSONS)} уроков, {len(ALL_QUIZ)} вопросов квиза")


def run(refresh: bool = False) -> None:
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

        if refresh:
            db.query(QuizAnswer).delete()
            db.query(QuizAttempt).delete()
            db.query(LessonProgress).delete()
            db.query(Lesson).delete()
            db.query(QuizQuestion).delete()
            print("Старый контент и прогресс по нему удалены")
            _insert_content(db)
        elif db.query(Lesson).count() == 0:
            _insert_content(db)

        db.commit()
        print("Seed завершён.")
    finally:
        db.close()


if __name__ == "__main__":
    run(refresh="refresh" in sys.argv[1:])
