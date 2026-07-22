"""Аутентификация и авторизация: argon2, JWT, зависимости FastAPI."""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from .config import settings
from .db import get_db
from .models import Group, Role, User

_ph = PasswordHasher()  # argon2id по умолчанию


def hash_password(password: str) -> str:
    if len(password) < 10:
        raise HTTPException(422, "Пароль должен быть не короче 10 символов")
    return _ph.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _ph.verify(password_hash, password)
    except VerifyMismatchError:
        return False


def sha256(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def new_opaque_token() -> str:
    return secrets.token_urlsafe(32)


def make_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "role": user.role.value,
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Нет токена")
    try:
        payload = jwt.decode(
            auth.removeprefix("Bearer "),
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Токен недействителен")
    user = db.get(User, int(payload["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Пользователь не найден")
    return user


def require_role(*roles: Role):
    def dep(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")
        return user
    return dep


def get_own_group(group_id: int, user: User, db: Session) -> Group:
    """Объектная авторизация: куратор работает ТОЛЬКО со своей группой.

    Superadmin проходит (метаданные ему доступны), любой другой куратор — 404,
    чтобы не раскрывать сам факт существования чужой группы.
    """
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(404, "Группа не найдена")
    if user.role == Role.superadmin:
        return group
    if user.role == Role.curator and group.curator_id == user.id:
        return group
    raise HTTPException(404, "Группа не найдена")
