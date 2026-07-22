"""Кураторские эндпоинты.

ЖЕЛЕЗНОЕ ПРАВИЛО: здесь не существует запросов, читающих
journal_entries.text или predictions.text. Только счётчики,
тайминги и агрегаты. См. tests/test_privacy.py.
"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import get_current_user, get_own_group, new_opaque_token, require_role, sha256
from ..config import settings
from ..db import get_db
from ..flags import team_flags
from ..models import (
    Group, GroupMember, Invite, JournalEntry, Lesson, LessonProgress,
    Prediction, QuizAttempt, Role, User,
)
from ..routers.me import current_week
from ..schemas import (
    GroupCreateIn, GroupDashboard, GroupOut, InviteLinkOut,
    MemberLessonMeta, MemberMeta,
)

router = APIRouter(prefix="/curator", tags=["curator"],
                   dependencies=[Depends(require_role(Role.curator, Role.superadmin))])


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _group_out(db: Session, g: Group) -> GroupOut:
    count = db.query(func.count(GroupMember.user_id)).filter(
        GroupMember.group_id == g.id).scalar()
    return GroupOut(id=g.id, name=g.name, curator_id=g.curator_id,
                    start_date=g.start_date, members_count=count,
                    current_week=current_week(g, _utcnow()))


@router.post("/groups", response_model=GroupOut, status_code=201)
def group_create(body: GroupCreateIn, user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    g = Group(name=body.name, curator_id=user.id, start_date=body.start_date)
    db.add(g)
    db.commit()
    return _group_out(db, g)


@router.get("/groups", response_model=list[GroupOut])
def groups_own(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Куратор видит ТОЛЬКО свои группы. Это не фильтр UI — это сам запрос."""
    rows = db.query(Group).filter(Group.curator_id == user.id).all()
    return [_group_out(db, g) for g in rows]


def _member_meta(db: Session, member: User) -> MemberMeta:
    progress = db.query(LessonProgress, Lesson).join(
        Lesson, Lesson.id == LessonProgress.lesson_id,
    ).filter(LessonProgress.user_id == member.id).all()

    # Только агрегаты. Текстовые колонки не участвуют даже в SELECT.
    journal_count = db.query(func.count(JournalEntry.id)).filter(
        JournalEntry.user_id == member.id).scalar()
    shared_count = db.query(func.count(JournalEntry.id)).filter(
        JournalEntry.user_id == member.id, JournalEntry.shared.is_(True)).scalar()
    preds_count = db.query(func.count(Prediction.id)).filter(
        Prediction.user_id == member.id).scalar()
    preds_resolved = db.query(func.count(Prediction.id)).filter(
        Prediction.user_id == member.id, Prediction.resolved_at.isnot(None)).scalar()
    last_quiz = (db.query(QuizAttempt).filter(QuizAttempt.user_id == member.id)
                 .order_by(QuizAttempt.week.desc()).first())
    last_activity = max(filter(None, [
        db.query(func.max(LessonProgress.started_at)).filter(
            LessonProgress.user_id == member.id).scalar(),
        db.query(func.max(JournalEntry.created_at)).filter(
            JournalEntry.user_id == member.id).scalar(),
        db.query(func.max(Prediction.created_at)).filter(
            Prediction.user_id == member.id).scalar(),
    ]), default=None)

    return MemberMeta(
        user_id=member.id, name=member.name,
        lessons=[MemberLessonMeta(
            lesson_id=l.id, week=l.week, ord=l.ord,
            completed_at=p.completed_at, duration_sec=p.duration_sec,
        ) for p, l in progress],
        journal_count=journal_count, shared_count=shared_count,
        predictions_count=preds_count, predictions_resolved=preds_resolved,
        quiz_hits=last_quiz.hits if last_quiz else None,
        quiz_total=last_quiz.total if last_quiz else None,
        last_activity_at=last_activity,
    )


@router.get("/groups/{group_id}/members", response_model=list[MemberMeta])
def group_members(group_id: int, user: User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    g = get_own_group(group_id, user, db)
    members = db.query(User).join(GroupMember, GroupMember.user_id == User.id).filter(
        GroupMember.group_id == g.id).all()
    return [_member_meta(db, m) for m in members]


@router.get("/groups/{group_id}/dashboard", response_model=GroupDashboard)
def group_dashboard(group_id: int, user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    g = get_own_group(group_id, user, db)
    members = db.query(User).join(GroupMember, GroupMember.user_id == User.id).filter(
        GroupMember.group_id == g.id).all()
    metas = [_member_meta(db, m) for m in members]
    week = current_week(g, _utcnow())
    return GroupDashboard(
        group=_group_out(db, g), week=week, members=metas,
        flags=team_flags(metas, week, _utcnow()),
    )


@router.post("/groups/{group_id}/invites", response_model=InviteLinkOut, status_code=201)
def invite_participant(group_id: int, user: User = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    g = get_own_group(group_id, user, db)
    token = new_opaque_token()
    inv = Invite(
        token_hash=sha256(token), role=Role.participant, group_id=g.id,
        created_by=user.id,
        expires_at=_utcnow() + timedelta(hours=settings.invite_ttl_hours),
    )
    db.add(inv)
    db.commit()
    return InviteLinkOut(
        url=f"{settings.frontend_origin}/join?token={token}",
        expires_at=inv.expires_at,
    )
