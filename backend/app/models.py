"""Модель данных MVP «Оптика». См. docs/architecture.md §4.

Инвариант приватности: journal_entries.text и predictions.text никогда
не попадают в кураторские выборки (см. routers/curator.py и tests/test_privacy.py).
"""
import enum
from datetime import date, datetime

from sqlalchemy import (
    JSON, Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, String,
    Text, UniqueConstraint, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class Role(str, enum.Enum):
    superadmin = "superadmin"
    curator = "curator"
    participant = "participant"


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.participant)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Group(Base):
    __tablename__ = "groups"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    curator_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    start_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    curator: Mapped[User] = relationship()
    members: Mapped[list["GroupMember"]] = relationship(back_populates="group")


class GroupMember(Base):
    __tablename__ = "group_members"
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    group: Mapped[Group] = relationship(back_populates="members")
    user: Mapped[User] = relationship()


class Invite(Base):
    __tablename__ = "invites"
    id: Mapped[int] = mapped_column(primary_key=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    role: Mapped[Role] = mapped_column(Enum(Role))
    group_id: Mapped[int | None] = mapped_column(ForeignKey("groups.id"), nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    used_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class Lesson(Base):
    """Урок = данные. steps — JSON-массив шагов типов из прототипа:
    hookNumber | hookChoice | concept | check | firstEntry | transfer."""
    __tablename__ = "lessons"
    id: Mapped[int] = mapped_column(primary_key=True)
    week: Mapped[int] = mapped_column(Integer, index=True)
    ord: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(200))
    steps: Mapped[list] = mapped_column(JSON)
    __table_args__ = (UniqueConstraint("week", "ord"),)


class LessonProgress(Base):
    __tablename__ = "lesson_progress"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), primary_key=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    duration_sec: Mapped[int | None] = mapped_column(Integer, nullable=True)


class JournalEntry(Base):
    __tablename__ = "journal_entries"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    text: Mapped[str] = mapped_column(Text)  # ПРИВАТНО: не для кураторских выборок
    confidence: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 0..100
    label: Mapped[str | None] = mapped_column(String(80), nullable=True)
    shared: Mapped[bool] = mapped_column(Boolean, default=False)


class Prediction(Base):
    __tablename__ = "predictions"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    text: Mapped[str] = mapped_column(Text)  # ПРИВАТНО: не для кураторских выборок
    confidence: Mapped[int] = mapped_column(Integer)  # 0..100
    deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    outcome: Mapped[bool | None] = mapped_column(Boolean, nullable=True)


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    id: Mapped[int] = mapped_column(primary_key=True)
    week: Mapped[int] = mapped_column(Integer, index=True)
    question: Mapped[str] = mapped_column(Text)
    unit: Mapped[str | None] = mapped_column(String(60), nullable=True)
    answer: Mapped[float] = mapped_column(Float)
    source: Mapped[str | None] = mapped_column(String(300), nullable=True)


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    week: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    hits: Mapped[int] = mapped_column(Integer)
    total: Mapped[int] = mapped_column(Integer)
    __table_args__ = (UniqueConstraint("user_id", "week"),)


class MeetingCard(Base):
    """Сценарная карточка встречи недели. Контент = данные (JSON целиком)."""
    __tablename__ = "meeting_cards"
    id: Mapped[int] = mapped_column(primary_key=True)
    week: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    data: Mapped[dict] = mapped_column(JSON)


class MeetingLog(Base):
    """Артефакт прошедшей встречи: групповой (виден всей группе и куратору).

    Это НЕ личные записи: журнал встречи — общий документ группы,
    сюда попадают только совместные выводы и договорённости.
    """
    __tablename__ = "meeting_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), index=True)
    week: Mapped[int] = mapped_column(Integer)
    held_at: Mapped[date] = mapped_column(Date)
    facilitator: Mapped[str] = mapped_column(String(120))  # ведущий (ротируется)
    summary: Mapped[str] = mapped_column(Text)             # ключевые выводы
    agreements: Mapped[str | None] = mapped_column(Text, nullable=True)  # договорённости
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    __table_args__ = (UniqueConstraint("group_id", "week"),)


class WeekMaterial(Base):
    """Оффлайн-задание недели: статьи + что принести. Контент = данные."""
    __tablename__ = "week_materials"
    id: Mapped[int] = mapped_column(primary_key=True)
    week: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text)
    links: Mapped[list] = mapped_column(JSON)  # [{title, url, note}]


class MaterialCheck(Base):
    """Отметка «оффлайн-задание недели выполнено». На гейтинг не влияет."""
    __tablename__ = "material_checks"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    week: Mapped[int] = mapped_column(Integer, primary_key=True)
    done_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class MoodCheckin(Base):
    """Барометр настроения: 1 (гроза) … 5 (солнце), одна отметка в день.

    ПРИВАТНОСТЬ: индивидуальные значения видит только сам участник.
    Куратору отдаётся ТОЛЬКО агрегат группы и только при ≥3 ответивших
    (см. routers/curator.py::_mood_aggregate).
    """
    __tablename__ = "mood_checkins"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    day: Mapped[date] = mapped_column(Date, index=True)
    score: Mapped[int] = mapped_column(Integer)  # 1..5
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    __table_args__ = (UniqueConstraint("user_id", "day"),)


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"
    attempt_id: Mapped[int] = mapped_column(ForeignKey("quiz_attempts.id"), primary_key=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("quiz_questions.id"), primary_key=True)
    lo: Mapped[float] = mapped_column(Float)
    hi: Mapped[float] = mapped_column(Float)
    hit: Mapped[bool] = mapped_column(Boolean)
