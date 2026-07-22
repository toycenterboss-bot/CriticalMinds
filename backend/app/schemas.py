"""Pydantic-схемы.

ВАЖНО: блок «КУРАТОРСКИЕ СХЕМЫ» намеренно не содержит ни одного
текстового поля с содержанием практик (text и т.п.) — это механизм
инварианта приватности. Проверяется tests/test_privacy.py.
"""
import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from .models import Role

# ---------- валидация пользовательских текстов ----------
# Инъекции: SQL закрыт параметризацией ORM (сырых запросов в проекте нет),
# XSS — экранированием React. Тексты дневника/прогнозов никогда не передаются
# в LLM; если такая фича появится — тексты участников подставлять только как
# данные, не как инструкции (правило в systemPatterns). Здесь дополнительно
# вычищаются управляющие и невидимые символы — они не нужны в честной записи
# и используются в атаках на парсеры и промпты.

_INVISIBLE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f​-‏‪-‮⁦-⁩﻿]")


def clean_text(value: str, *, field: str, min_len: int, max_len: int,
               min_letters: int = 5) -> str:
    v = _INVISIBLE.sub("", value)
    v = re.sub(r"\s+", " ", v).strip()
    if len(v) < min_len:
        raise ValueError(f"{field}: слишком коротко — опишите словами (минимум {min_len} символов)")
    if len(v) > max_len:
        raise ValueError(f"{field}: слишком длинно (максимум {max_len} символов)")
    letters = sum(ch.isalpha() for ch in v)
    if letters < min_letters:
        raise ValueError(f"{field}: похоже на случайный набор символов — нужна осмысленная запись")
    if len(set(v.lower())) < 4:
        raise ValueError(f"{field}: похоже на повторение одного символа — нужна осмысленная запись")
    return v


# ---------- auth ----------

class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AcceptInviteIn(BaseModel):
    token: str
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=10)


class InviteInfoOut(BaseModel):
    role: Role
    group_name: str | None


class InviteLinkOut(BaseModel):
    url: str
    expires_at: datetime


# ---------- участник ----------

class MeOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: Role
    group_id: int | None
    group_name: str | None
    current_week: int


class LessonListItem(BaseModel):
    id: int
    week: int
    ord: int
    title: str
    completed: bool
    available: bool


class LessonOut(BaseModel):
    id: int
    week: int
    ord: int
    title: str
    steps: list


class JournalEntryIn(BaseModel):
    """Запись дневника — структурно: решение + аргументы + ожидание."""
    decision: str
    args: str | None = None
    expect: str | None = None
    confidence: int | None = Field(default=None, ge=0, le=100)
    label: str | None = Field(default=None, max_length=80)
    shared: bool = False

    @field_validator("decision")
    @classmethod
    def _v_decision(cls, v: str) -> str:
        return clean_text(v, field="Решение", min_len=8, max_len=300)

    @field_validator("args", "expect")
    @classmethod
    def _v_optional(cls, v: str | None, info) -> str | None:
        if v is None or not v.strip():
            return None
        name = "Аргументы" if info.field_name == "args" else "Ожидание"
        return clean_text(v, field=name, min_len=5, max_len=1000, min_letters=3)


class JournalEntryOut(BaseModel):
    id: int
    created_at: datetime
    text: str
    confidence: int | None
    label: str | None
    shared: bool


class PredictionIn(BaseModel):
    text: str
    confidence: int = Field(ge=0, le=100)
    deadline: datetime | None = None

    @field_validator("text")
    @classmethod
    def _v_text(cls, v: str) -> str:
        return clean_text(v, field="Прогноз", min_len=10, max_len=500)


class PredictionOut(BaseModel):
    id: int
    created_at: datetime
    text: str
    confidence: int
    deadline: datetime | None
    resolved_at: datetime | None
    outcome: bool | None


class ResolveIn(BaseModel):
    outcome: bool


class QuizQuestionOut(BaseModel):
    id: int
    question: str
    unit: str | None


class QuizCurrentOut(BaseModel):
    week: int
    attempted: bool
    hits: int | None
    total: int | None
    questions: list[QuizQuestionOut]


class QuizAnswerIn(BaseModel):
    question_id: int
    lo: float
    hi: float


class QuizSubmitIn(BaseModel):
    week: int
    answers: list[QuizAnswerIn]


class QuizQuestionResult(BaseModel):
    question_id: int
    answer: float
    hit: bool


class QuizResultOut(BaseModel):
    hits: int
    total: int
    results: list[QuizQuestionResult]


class CalibrationPoint(BaseModel):
    declared: float   # заявленная уверенность, %
    actual: float     # фактическая доля попаданий, %
    n: int
    source: str       # "quiz" | "predictions"


# ---------- группы ----------

class GroupCreateIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    start_date: datetime | None = None


class GroupOut(BaseModel):
    id: int
    name: str
    curator_id: int
    start_date: datetime | None
    members_count: int
    current_week: int


# ---------- КУРАТОРСКИЕ СХЕМЫ: только метаданные, НИКАКОГО контента ----------

class MemberLessonMeta(BaseModel):
    lesson_id: int
    week: int
    ord: int
    completed_at: datetime | None
    duration_sec: int | None


class MemberMeta(BaseModel):
    """Карточка участника для куратора: счётчики и тайминги. Без текстов."""
    user_id: int
    name: str
    lessons: list[MemberLessonMeta]
    journal_count: int
    shared_count: int
    predictions_count: int
    predictions_resolved: int
    quiz_hits: int | None
    quiz_total: int | None
    last_activity_at: datetime | None


class Flag(BaseModel):
    user_id: int
    level: str        # risk | warn | info
    code: str
    message: str      # рекомендация: личный разговор, не общий чат


class GroupDashboard(BaseModel):
    group: GroupOut
    week: int
    members: list[MemberMeta]
    flags: list[Flag]
