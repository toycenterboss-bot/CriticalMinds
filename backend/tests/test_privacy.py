"""Инвариант приватности: кураторские схемы не содержат контент-полей.

Куратор видит количество, но не содержание. Если кто-то добавит поле
`text` (или похожее) в кураторскую схему — этот тест обязан упасть.
"""
import pytest
from pydantic import BaseModel

from app import schemas

CURATOR_SCHEMAS = [
    schemas.MemberMeta, schemas.MemberLessonMeta,
    schemas.GroupDashboard, schemas.Flag, schemas.GroupOut,
]

FORBIDDEN_FIELDS = {"text", "content", "body", "entry", "prediction_text"}


def _all_fields(model: type[BaseModel], seen: set | None = None) -> set[str]:
    seen = seen or set()
    if model in seen:
        return set()
    seen.add(model)
    fields = set()
    for name, field in model.model_fields.items():
        fields.add(name)
        ann = field.annotation
        for sub in getattr(ann, "__args__", [ann]):
            if isinstance(sub, type) and issubclass(sub, BaseModel):
                fields |= _all_fields(sub, seen)
    return fields


@pytest.mark.parametrize("schema", CURATOR_SCHEMAS)
def test_no_content_fields_in_curator_schemas(schema):
    leaked = _all_fields(schema) & FORBIDDEN_FIELDS
    assert not leaked, (
        f"{schema.__name__} содержит запрещённые поля {leaked}: "
        "куратор не должен видеть содержание практик"
    )


def test_flag_message_is_not_user_content():
    """Flag.message генерируется из шаблонов flags.py, не из пользовательских текстов."""
    import inspect
    from app import flags
    src = inspect.getsource(flags)
    assert ".text" not in src, "flags.py не должен обращаться к текстовым полям практик"
