"""Автофлаги внимания — чистая функция над метаданными (паттерн из прототипа).

Правила (5 шт., как в прототипе): урок пролистан (≤5 мин), уроки без записей
в дневнике, неактивность 2+ дня, квиз недели не пройден, ноль прогнозов.
Новые правила добавлять сюда, не размазывать по UI/роутерам.
"""
from datetime import datetime, timedelta

from .schemas import Flag, MemberMeta

ADVICE = " Рекомендация: личный разговор, не общий чат."


def team_flags(members: list[MemberMeta], week: int, now: datetime) -> list[Flag]:
    flags: list[Flag] = []
    for m in members:
        skimmed = [l for l in m.lessons if l.duration_sec is not None and l.duration_sec <= 300]
        if skimmed:
            flags.append(Flag(
                user_id=m.user_id, level="warn", code="lesson_skimmed",
                message=f"{m.name}: урок(и) пройдены за ≤5 минут — возможно, пролистаны." + ADVICE,
            ))
        completed = [l for l in m.lessons if l.completed_at is not None]
        if completed and m.journal_count == 0:
            flags.append(Flag(
                user_id=m.user_id, level="warn", code="no_journal",
                message=f"{m.name}: уроки идут, а дневник пуст." + ADVICE,
            ))
        if m.last_activity_at is None or now - m.last_activity_at > timedelta(days=2):
            flags.append(Flag(
                user_id=m.user_id, level="risk", code="inactive",
                message=f"{m.name}: нет активности 2+ дня." + ADVICE,
            ))
        if m.quiz_total is None:
            flags.append(Flag(
                user_id=m.user_id, level="info", code="quiz_pending",
                message=f"{m.name}: калибровочный квиз недели {week} ещё не пройден.",
            ))
        if m.predictions_count == 0:
            flags.append(Flag(
                user_id=m.user_id, level="info", code="no_predictions",
                message=f"{m.name}: ни одного прогноза в трекере.",
            ))
    return flags
