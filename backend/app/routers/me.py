"""Эндпоинты участника: всё только своё (user_id = current_user.id)."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..models import (
    Group, GroupMember, JournalEntry, Lesson, LessonProgress, Prediction,
    QuizAnswer, QuizAttempt, QuizQuestion, User,
)
from ..schemas import (
    CalibrationPoint, JournalEntryIn, JournalEntryOut, LessonListItem, LessonOut,
    MeOut, PredictionIn, PredictionOut, QuizCurrentOut, QuizQuestionOut,
    QuizQuestionResult, QuizResultOut, QuizSubmitIn, ResolveIn,
)

router = APIRouter(prefix="/me", tags=["me"])


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _my_group(db: Session, user: User) -> Group | None:
    gm = db.query(GroupMember).filter(GroupMember.user_id == user.id).first()
    return db.get(Group, gm.group_id) if gm else None


def current_week(group: Group | None, now: datetime) -> int:
    if group is None or group.start_date is None:
        return 1
    weeks = (now - group.start_date).days // 7 + 1
    return max(1, min(12, weeks))


@router.get("", response_model=MeOut)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    group = _my_group(db, user)
    return MeOut(
        id=user.id, name=user.name, email=user.email, role=user.role,
        group_id=group.id if group else None,
        group_name=group.name if group else None,
        current_week=current_week(group, _utcnow()),
    )


@router.get("/lessons", response_model=list[LessonListItem])
def lessons(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    week = current_week(_my_group(db, user), _utcnow())
    done = {
        p.lesson_id for p in
        db.query(LessonProgress).filter(
            LessonProgress.user_id == user.id,
            LessonProgress.completed_at.isnot(None),
        )
    }
    return [
        LessonListItem(
            id=l.id, week=l.week, ord=l.ord, title=l.title,
            completed=l.id in done, available=l.week <= week,
        )
        for l in db.query(Lesson).order_by(Lesson.week, Lesson.ord)
    ]


@router.get("/lessons/{lesson_id}", response_model=LessonOut)
def lesson(lesson_id: int, user: User = Depends(get_current_user),
           db: Session = Depends(get_db)):
    l = db.get(Lesson, lesson_id)
    if l is None:
        raise HTTPException(404, "Урок не найден")
    if l.week > current_week(_my_group(db, user), _utcnow()):
        raise HTTPException(403, "Урок ещё не открыт — спиральность важнее спешки")
    return LessonOut(id=l.id, week=l.week, ord=l.ord, title=l.title, steps=l.steps)


@router.post("/lessons/{lesson_id}/start")
def lesson_start(lesson_id: int, user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    if db.get(Lesson, lesson_id) is None:
        raise HTTPException(404, "Урок не найден")
    row = db.get(LessonProgress, (user.id, lesson_id))
    if row is None:
        db.add(LessonProgress(user_id=user.id, lesson_id=lesson_id, started_at=_utcnow()))
        db.commit()
    return {"ok": True}


@router.post("/lessons/{lesson_id}/complete")
def lesson_complete(lesson_id: int, user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    row = db.get(LessonProgress, (user.id, lesson_id))
    if row is None:
        raise HTTPException(409, "Урок не был начат")
    if row.completed_at is None:
        row.completed_at = _utcnow()
        row.duration_sec = int((row.completed_at - row.started_at).total_seconds())
        db.commit()
    return {"ok": True}


@router.get("/journal", response_model=list[JournalEntryOut])
def journal(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (db.query(JournalEntry).filter(JournalEntry.user_id == user.id)
            .order_by(JournalEntry.created_at.desc()))
    return [JournalEntryOut(
        id=r.id, created_at=r.created_at, text=r.text,
        confidence=r.confidence, label=r.label, shared=r.shared,
    ) for r in rows]


@router.post("/journal", response_model=JournalEntryOut, status_code=201)
def journal_add(body: JournalEntryIn, user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    row = JournalEntry(user_id=user.id, **body.model_dump())
    db.add(row)
    db.commit()
    return JournalEntryOut(
        id=row.id, created_at=row.created_at, text=row.text,
        confidence=row.confidence, label=row.label, shared=row.shared,
    )


@router.get("/predictions", response_model=list[PredictionOut])
def predictions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (db.query(Prediction).filter(Prediction.user_id == user.id)
            .order_by(Prediction.created_at.desc()))
    return [PredictionOut(
        id=r.id, created_at=r.created_at, text=r.text, confidence=r.confidence,
        deadline=r.deadline, resolved_at=r.resolved_at, outcome=r.outcome,
    ) for r in rows]


@router.post("/predictions", response_model=PredictionOut, status_code=201)
def prediction_add(body: PredictionIn, user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    row = Prediction(user_id=user.id, **body.model_dump())
    db.add(row)
    db.commit()
    return PredictionOut(
        id=row.id, created_at=row.created_at, text=row.text, confidence=row.confidence,
        deadline=row.deadline, resolved_at=None, outcome=None,
    )


@router.post("/predictions/{pred_id}/resolve", response_model=PredictionOut)
def prediction_resolve(pred_id: int, body: ResolveIn,
                       user: User = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    row = db.get(Prediction, pred_id)
    if row is None or row.user_id != user.id:
        raise HTTPException(404, "Прогноз не найден")
    if row.resolved_at is not None:
        raise HTTPException(409, "Прогноз уже разрешён")
    row.resolved_at = _utcnow()
    row.outcome = body.outcome
    db.commit()
    return PredictionOut(
        id=row.id, created_at=row.created_at, text=row.text, confidence=row.confidence,
        deadline=row.deadline, resolved_at=row.resolved_at, outcome=row.outcome,
    )


@router.get("/quiz/current", response_model=QuizCurrentOut)
def quiz_current(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    week = current_week(_my_group(db, user), _utcnow())
    qs = db.query(QuizQuestion).filter(QuizQuestion.week == week).all()
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == user.id, QuizAttempt.week == week,
    ).first()
    return QuizCurrentOut(
        week=week,
        attempted=attempt is not None,
        hits=attempt.hits if attempt else None,
        total=attempt.total if attempt else None,
        questions=[QuizQuestionOut(id=q.id, question=q.question, unit=q.unit) for q in qs],
    )


@router.post("/quiz", response_model=QuizResultOut)
def quiz_submit(body: QuizSubmitIn, user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    if db.query(QuizAttempt).filter(
        QuizAttempt.user_id == user.id, QuizAttempt.week == body.week,
    ).first():
        raise HTTPException(409, "Квиз этой недели уже сдан")
    hits = 0
    results = []
    attempt = QuizAttempt(user_id=user.id, week=body.week, hits=0, total=len(body.answers))
    db.add(attempt)
    db.flush()
    for a in body.answers:
        q = db.get(QuizQuestion, a.question_id)
        if q is None:
            raise HTTPException(404, f"Вопрос {a.question_id} не найден")
        hit = a.lo <= q.answer <= a.hi
        hits += hit
        results.append(QuizQuestionResult(question_id=q.id, answer=q.answer, hit=hit))
        db.add(QuizAnswer(attempt_id=attempt.id, question_id=q.id,
                          lo=a.lo, hi=a.hi, hit=hit))
    attempt.hits = hits
    db.commit()
    return QuizResultOut(hits=hits, total=attempt.total, results=results)


@router.get("/calibration", response_model=list[CalibrationPoint])
def calibration(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    points: list[CalibrationPoint] = []
    answers = (db.query(QuizAnswer).join(QuizAttempt)
               .filter(QuizAttempt.user_id == user.id).all())
    if answers:
        hits = sum(1 for a in answers if a.hit)
        points.append(CalibrationPoint(
            declared=90.0, actual=100.0 * hits / len(answers),
            n=len(answers), source="quiz",
        ))
    resolved = db.query(Prediction).filter(
        Prediction.user_id == user.id, Prediction.resolved_at.isnot(None),
    ).all()
    buckets: dict[int, list[bool]] = {}
    for p in resolved:
        buckets.setdefault(round(p.confidence / 10) * 10, []).append(bool(p.outcome))
    for declared, outcomes in sorted(buckets.items()):
        points.append(CalibrationPoint(
            declared=float(declared),
            actual=100.0 * sum(outcomes) / len(outcomes),
            n=len(outcomes), source="predictions",
        ))
    return points
