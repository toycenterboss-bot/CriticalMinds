"""Pydantic-схемы.

ВАЖНО: блок «КУРАТОРСКИЕ СХЕМЫ» намеренно не содержит ни одного
текстового поля с содержанием практик (text и т.п.) — это механизм
инварианта приватности. Проверяется tests/test_privacy.py.
"""
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from .models import Role


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
    text: str = Field(min_length=1)
    confidence: int | None = Field(default=None, ge=0, le=100)
    label: str | None = None
    shared: bool = False


class JournalEntryOut(JournalEntryIn):
    id: int
    created_at: datetime


class PredictionIn(BaseModel):
    text: str = Field(min_length=1)
    confidence: int = Field(ge=0, le=100)
    deadline: datetime | None = None


class PredictionOut(PredictionIn):
    id: int
    created_at: datetime
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
