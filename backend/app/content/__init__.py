"""Контент программы: 36 уроков (12 недель × 3), банк калибровочных вопросов.

Источник: docs/karta_36_urokov.md. Урок = данные для движка (systemPatterns §1).
"""
from . import module1, module2, module3, module4
from .materials import MATERIALS
from .meetings import MEETING_CARDS, MEETING_COMMON

ALL_LESSONS = (
    module1.LESSONS + module2.LESSONS + module3.LESSONS + module4.LESSONS
)
ALL_QUIZ = module1.QUIZ + module2.QUIZ + module3.QUIZ + module4.QUIZ
ALL_MATERIALS = MATERIALS
