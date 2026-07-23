"""Эндпоинты участника: всё только своё (user_id = current_user.id)."""
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..content import MEETING_COMMON
from ..models import (
    Group, GroupMember, JournalEntry, Lesson, LessonProgress, MaterialCheck,
    MeetingCard, MeetingLog, MoodCheckin, Prediction, QuizAnswer, QuizAttempt,
    QuizQuestion, User, WeekMaterial,
)
from ..schemas import (
    CalibrationPoint, JournalEntryIn, JournalEntryOut, LessonListItem, LessonOut,
    MeetingLogIn, MeetingLogOut, MeetingsOut, MeOut, MoodDay, MoodIn, MoodOut,
    PredictionIn, PredictionOut, QuizCurrentOut, QuizQuestionOut,
    QuizQuestionResult, QuizResultOut, QuizSubmitIn, ResolveIn, TournamentOut,
    WeekMaterialOut, WeekStatus,
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


# ---------- прогресс по неделям (гейтинг: уроки + квиз недели) ----------

def _week_lessons(db: Session) -> dict[int, list[Lesson]]:
    weeks: dict[int, list[Lesson]] = {}
    for l in db.query(Lesson).order_by(Lesson.week, Lesson.ord):
        weeks.setdefault(l.week, []).append(l)
    return weeks


def _completion_time(db: Session, user_id: int, lessons: list[Lesson],
                     week: int) -> datetime | None:
    """Момент завершения недели пользователем: все уроки пройдены И квиз сдан.
    None — неделя не завершена."""
    ids = [l.id for l in lessons]
    done = db.query(LessonProgress).filter(
        LessonProgress.user_id == user_id,
        LessonProgress.lesson_id.in_(ids),
        LessonProgress.completed_at.isnot(None),
    ).all()
    if len(done) < len(ids):
        return None
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == user_id, QuizAttempt.week == week,
    ).first()
    if attempt is None:
        return None
    stamps = [p.completed_at for p in done] + [attempt.created_at]
    return max(stamps)


def week_statuses(db: Session, user: User) -> list[WeekStatus]:
    weeks = _week_lessons(db)
    gm = db.query(GroupMember).filter(GroupMember.user_id == user.id).first()
    member_ids: list[int] = []
    if gm:
        member_ids = [
            m.user_id for m in
            db.query(GroupMember).filter(GroupMember.group_id == gm.group_id)
        ]
    result: list[WeekStatus] = []
    prev_completed = True  # неделя 1 открыта всегда
    for week in sorted(weeks):
        lessons = weeks[week]
        ids = [l.id for l in lessons]
        my_done = db.query(LessonProgress).filter(
            LessonProgress.user_id == user.id,
            LessonProgress.lesson_id.in_(ids),
            LessonProgress.completed_at.isnot(None),
        ).count()
        quiz_attempted = db.query(QuizAttempt).filter(
            QuizAttempt.user_id == user.id, QuizAttempt.week == week,
        ).first() is not None
        completed = my_done == len(ids) and quiz_attempted
        unlocked = prev_completed

        others_times: list[tuple[int, datetime]] = []
        for uid in member_ids:
            t = _completion_time(db, uid, lessons, week)
            if t is not None:
                others_times.append((uid, t))
        my_time = next((t for uid, t in others_times if uid == user.id), None)
        i_was_first = (
            my_time is not None
            and all(my_time <= t for _, t in others_times)
            and len(others_times) > 0
        )
        result.append(WeekStatus(
            week=week, lessons_total=len(ids), lessons_done=my_done,
            quiz_attempted=quiz_attempted, completed=completed, unlocked=unlocked,
            group_completed=len(others_times), group_size=len(member_ids),
            i_was_first=i_was_first,
        ))
        prev_completed = completed
    return result


def _unlocked_weeks(statuses: list[WeekStatus]) -> set[int]:
    return {s.week for s in statuses if s.unlocked}


def _active_week(statuses: list[WeekStatus]) -> int:
    """Самая старшая открытая неделя — здесь живут квиз и «сегодняшний» урок."""
    unlocked = [s.week for s in statuses if s.unlocked]
    return max(unlocked) if unlocked else 1


@router.get("", response_model=MeOut)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    group = _my_group(db, user)
    return MeOut(
        id=user.id, name=user.name, email=user.email, role=user.role,
        group_id=group.id if group else None,
        group_name=group.name if group else None,
        current_week=current_week(group, _utcnow()),
    )


@router.get("/weeks", response_model=list[WeekStatus])
def weeks(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return week_statuses(db, user)


@router.get("/lessons", response_model=list[LessonListItem])
def lessons(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Гейтинг v2 (решение Андрея 22.07, вечер): неделя открывается после
    # завершения предыдущей (все уроки + квиз). Неделя 1 открыта всегда.
    unlocked = _unlocked_weeks(week_statuses(db, user))
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
            completed=l.id in done, available=l.week in unlocked,
        )
        for l in db.query(Lesson).order_by(Lesson.week, Lesson.ord)
    ]


@router.get("/lessons/{lesson_id}", response_model=LessonOut)
def lesson(lesson_id: int, user: User = Depends(get_current_user),
           db: Session = Depends(get_db)):
    l = db.get(Lesson, lesson_id)
    if l is None:
        raise HTTPException(404, "Урок не найден")
    if l.week not in _unlocked_weeks(week_statuses(db, user)):
        raise HTTPException(403, "Неделя ещё закрыта: завершите уроки и квиз текущей недели")
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
    text = body.decision
    if body.args:
        text += f"\nАргументы: {body.args}"
    if body.expect:
        text += f"\nОжидаю: {body.expect}"
    row = JournalEntry(
        user_id=user.id, text=text, confidence=body.confidence,
        label=body.label, shared=body.shared,
    )
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
    week = _active_week(week_statuses(db, user))
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
    if body.week not in _unlocked_weeks(week_statuses(db, user)):
        raise HTTPException(403, "Квиз этой недели ещё закрыт")
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


@router.get("/meetings", response_model=MeetingsOut)
def meetings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Все 12 сценарных карточек + общий контекст. Не гейтится:
    сценарии встреч открыты для чтения вперёд (ведущему нужно готовиться)."""
    cards = [m.data for m in db.query(MeetingCard).order_by(MeetingCard.week)]
    return MeetingsOut(common=MEETING_COMMON, cards=cards)


def _log_out(db: Session, log: MeetingLog) -> MeetingLogOut:
    author = db.get(User, log.created_by)
    return MeetingLogOut(
        id=log.id, week=log.week, held_at=log.held_at.isoformat(),
        facilitator=log.facilitator, summary=log.summary,
        agreements=log.agreements, author=author.name if author else "—",
    )


@router.get("/meeting-logs", response_model=list[MeetingLogOut])
def meeting_logs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    gm = db.query(GroupMember).filter(GroupMember.user_id == user.id).first()
    if gm is None:
        return []
    rows = db.query(MeetingLog).filter(MeetingLog.group_id == gm.group_id) \
             .order_by(MeetingLog.week).all()
    return [_log_out(db, r) for r in rows]


@router.post("/meeting-logs", response_model=MeetingLogOut, status_code=201)
def meeting_log_add(body: MeetingLogIn, user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    gm = db.query(GroupMember).filter(GroupMember.user_id == user.id).first()
    if gm is None:
        raise HTTPException(409, "Вы не состоите в группе")
    if db.query(MeetingLog).filter(
        MeetingLog.group_id == gm.group_id, MeetingLog.week == body.week,
    ).first():
        raise HTTPException(409, f"Встреча недели {body.week} уже зарегистрирована")
    try:
        held = date.fromisoformat(body.held_at) if body.held_at else _utcnow().date()
    except ValueError:
        raise HTTPException(422, "Дата встречи: ожидается формат ГГГГ-ММ-ДД")
    row = MeetingLog(
        group_id=gm.group_id, week=body.week, held_at=held,
        facilitator=body.facilitator, summary=body.summary,
        agreements=body.agreements, created_by=user.id,
    )
    db.add(row)
    db.commit()
    return _log_out(db, row)


@router.get("/materials", response_model=list[WeekMaterialOut])
def materials(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Оффлайн-задания всех недель + личная отметка выполнения."""
    done_weeks = {
        m.week for m in
        db.query(MaterialCheck).filter(MaterialCheck.user_id == user.id)
    }
    return [
        WeekMaterialOut(week=m.week, title=m.title, body=m.body,
                        links=m.links, done=m.week in done_weeks)
        for m in db.query(WeekMaterial).order_by(WeekMaterial.week)
    ]


@router.post("/materials/{week}/done")
def material_toggle(week: int, user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    if db.query(WeekMaterial).filter(WeekMaterial.week == week).first() is None:
        raise HTTPException(404, "У этой недели нет оффлайн-задания")
    row = db.get(MaterialCheck, (user.id, week))
    if row is None:
        db.add(MaterialCheck(user_id=user.id, week=week))
    else:
        db.delete(row)
    db.commit()
    return {"done": row is None}


@router.get("/tournament", response_model=TournamentOut)
def tournament(week: int | None = None, user: User = Depends(get_current_user),
               db: Session = Depends(get_db)):
    """Турнир калибровки: мой результат явно, остальные — анонимные значения."""
    statuses = week_statuses(db, user)
    w = week or _active_week(statuses)
    gm = db.query(GroupMember).filter(GroupMember.user_id == user.id).first()
    member_ids = [
        m.user_id for m in
        db.query(GroupMember).filter(GroupMember.group_id == gm.group_id)
    ] if gm else [user.id]
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.week == w, QuizAttempt.user_id.in_(member_ids),
    ).all()
    my = next((a for a in attempts if a.user_id == user.id), None)
    others = sorted(a.hits for a in attempts if a.user_id != user.id)  # сортировка = анонимизация порядка
    total = attempts[0].total if attempts else 5
    return TournamentOut(week=w, total=total,
                         my_hits=my.hits if my else None, others_hits=others)


@router.get("/mood", response_model=MoodOut)
def mood_get(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = _utcnow().date()
    rows = db.query(MoodCheckin).filter(
        MoodCheckin.user_id == user.id,
        MoodCheckin.day >= today - timedelta(days=6),
    ).order_by(MoodCheckin.day).all()
    today_row = next((r for r in rows if r.day == today), None)
    return MoodOut(
        today=today_row.score if today_row else None,
        history=[MoodDay(day=r.day.isoformat(), score=r.score) for r in rows],
    )


@router.post("/mood", response_model=MoodOut)
def mood_set(body: MoodIn, user: User = Depends(get_current_user),
             db: Session = Depends(get_db)):
    today = _utcnow().date()
    row = db.query(MoodCheckin).filter(
        MoodCheckin.user_id == user.id, MoodCheckin.day == today,
    ).first()
    if row is None:
        db.add(MoodCheckin(user_id=user.id, day=today, score=body.score))
    else:
        row.score = body.score
    db.commit()
    return mood_get(user, db)


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
