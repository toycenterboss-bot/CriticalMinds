"""Изоляция групп: куратор А не видит группу куратора Б (даже её существование)."""
import pytest
from fastapi import HTTPException

from app.auth import get_own_group
from app.models import Group, Role, User


class FakeDB:
    def __init__(self, group):
        self._group = group

    def get(self, model, pk):
        if model is Group and self._group is not None and pk == self._group.id:
            return self._group
        return None


def _user(uid, role):
    u = User(name=f"u{uid}", email=f"u{uid}@t.local", password_hash="x", role=role)
    u.id = uid
    return u


def _group(gid, curator_id):
    g = Group(name="G", curator_id=curator_id)
    g.id = gid
    return g


def test_curator_sees_own_group():
    g = _group(1, curator_id=10)
    assert get_own_group(1, _user(10, Role.curator), FakeDB(g)) is g


def test_foreign_curator_gets_404_not_403():
    """404, а не 403: чужой куратор не должен узнать, что группа существует."""
    g = _group(1, curator_id=10)
    with pytest.raises(HTTPException) as e:
        get_own_group(1, _user(20, Role.curator), FakeDB(g))
    assert e.value.status_code == 404


def test_participant_gets_404():
    g = _group(1, curator_id=10)
    with pytest.raises(HTTPException) as e:
        get_own_group(1, _user(30, Role.participant), FakeDB(g))
    assert e.value.status_code == 404


def test_superadmin_sees_metadata():
    g = _group(1, curator_id=10)
    assert get_own_group(1, _user(1, Role.superadmin), FakeDB(g)) is g
