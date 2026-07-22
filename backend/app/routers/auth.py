from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from ..auth import (
    hash_password, make_access_token, new_opaque_token, sha256, verify_password,
)
from ..config import settings
from ..db import get_db
from ..models import GroupMember, Invite, RefreshToken, Role, User
from ..schemas import AcceptInviteIn, InviteInfoOut, LoginIn, TokenOut

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)

REFRESH_COOKIE = "optika_refresh"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _issue_refresh(response: Response, db: Session, user: User) -> None:
    token = new_opaque_token()
    db.add(RefreshToken(
        user_id=user.id,
        token_hash=sha256(token),
        expires_at=_utcnow() + timedelta(days=settings.refresh_token_days),
    ))
    db.commit()
    response.set_cookie(
        REFRESH_COOKIE, token,
        httponly=True, samesite="lax", secure=False,  # secure=True в проде (HTTPS)
        max_age=settings.refresh_token_days * 86400, path="/auth",
    )


@router.post("/login", response_model=TokenOut)
@limiter.limit("5/minute")
def login(request: Request, body: LoginIn, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Неверный email или пароль")
    if not user.is_active:
        raise HTTPException(403, "Аккаунт деактивирован")
    _issue_refresh(response, db, user)
    return TokenOut(access_token=make_access_token(user))


@router.post("/refresh", response_model=TokenOut)
@limiter.limit("30/minute")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(REFRESH_COOKIE)
    if not token:
        raise HTTPException(401, "Нет refresh-токена")
    row = db.query(RefreshToken).filter(RefreshToken.token_hash == sha256(token)).first()
    if row is None or row.revoked_at is not None or row.expires_at < _utcnow():
        raise HTTPException(401, "Refresh-токен недействителен")
    row.revoked_at = _utcnow()  # ротация: старый гасим, выдаём новый
    user = db.get(User, row.user_id)
    if user is None or not user.is_active:
        raise HTTPException(401, "Пользователь не найден")
    _issue_refresh(response, db, user)
    return TokenOut(access_token=make_access_token(user))


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(REFRESH_COOKIE)
    if token:
        row = db.query(RefreshToken).filter(RefreshToken.token_hash == sha256(token)).first()
        if row is not None:
            row.revoked_at = _utcnow()
            db.commit()
    response.delete_cookie(REFRESH_COOKIE, path="/auth")
    return {"ok": True}


def _valid_invite(db: Session, token: str) -> Invite:
    inv = db.query(Invite).filter(Invite.token_hash == sha256(token)).first()
    if inv is None or inv.used_at is not None or inv.expires_at < _utcnow():
        raise HTTPException(404, "Приглашение не найдено или истекло")
    return inv


@router.get("/invite-info", response_model=InviteInfoOut)
def invite_info(token: str, db: Session = Depends(get_db)):
    inv = _valid_invite(db, token)
    group_name = inv.group.name if getattr(inv, "group", None) else None
    if inv.group_id:
        from ..models import Group
        g = db.get(Group, inv.group_id)
        group_name = g.name if g else None
    return InviteInfoOut(role=inv.role, group_name=group_name)


@router.post("/accept-invite", response_model=TokenOut)
@limiter.limit("10/minute")
def accept_invite(request: Request, body: AcceptInviteIn, response: Response,
                  db: Session = Depends(get_db)):
    inv = _valid_invite(db, body.token)
    email = body.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "Пользователь с таким email уже существует")
    user = User(
        name=body.name, email=email,
        password_hash=hash_password(body.password), role=inv.role,
    )
    db.add(user)
    db.flush()
    if inv.role == Role.participant and inv.group_id:
        db.add(GroupMember(group_id=inv.group_id, user_id=user.id))
    inv.used_at = _utcnow()
    inv.used_by = user.id
    db.commit()
    _issue_refresh(response, db, user)
    return TokenOut(access_token=make_access_token(user))
