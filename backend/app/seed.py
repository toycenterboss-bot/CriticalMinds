"""Инициализация БД: таблицы, superadmin из .env, контент программы.

Запуск:  python -m app.seed            — первичная инициализация (идемпотентен)
         python -m app.seed refresh    — пересоздать контент уроков/квизов
                                         (стирает и прогресс уроков/квизов!)

Контент: app/content/ — 36 уроков (12 недель), банк калибровочных вопросов.
"""
import sys

from .auth import hash_password
from .config import settings
from .content import ALL_LESSONS, ALL_MATERIALS, ALL_QUIZ, MEETING_CARDS
from .db import Base, SessionLocal, engine
from .models import (
    Lesson, LessonProgress, MeetingCard, QuizAnswer, QuizAttempt, QuizQuestion,
    Role, User, WeekMaterial,
)


def _insert_content(db, force: bool = False) -> None:
    """Каждый тип контента заливается независимо, если его таблица пуста —
    добавление нового типа не требует refresh (и не трогает прогресс)."""
    if force or db.query(Lesson).count() == 0:
        for l in ALL_LESSONS:
            db.add(Lesson(**l))
        print(f"Уроки: {len(ALL_LESSONS)}")
    if force or db.query(QuizQuestion).count() == 0:
        for q in ALL_QUIZ:
            db.add(QuizQuestion(**q))
        print(f"Вопросы квиза: {len(ALL_QUIZ)}")
    if force or db.query(WeekMaterial).count() == 0:
        for m in ALL_MATERIALS:
            db.add(WeekMaterial(**m))
        print(f"Оффлайн-задания: {len(ALL_MATERIALS)}")
    if force or db.query(MeetingCard).count() == 0:
        for c in MEETING_CARDS:
            db.add(MeetingCard(week=c["week"], data=c))
        print(f"Карточки встреч: {len(MEETING_CARDS)}")


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
            db.query(WeekMaterial).delete()
            db.query(MeetingCard).delete()
            print("Старый контент и прогресс по нему удалены")
            _insert_content(db, force=True)
        else:
            _insert_content(db)

        db.commit()
        print("Seed завершён.")
    finally:
        db.close()


if __name__ == "__main__":
    run(refresh="refresh" in sys.argv[1:])
