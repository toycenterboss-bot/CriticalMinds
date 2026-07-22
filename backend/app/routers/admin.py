"""Superadmin: инвайты кураторов, обзор групп (только метаданные)."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import get_current_user, new_opaque_token, require_role, sha256
from ..config import settings
from ..db import get_db
from ..models import Group, GroupMember, Invite, Role, User
from ..routers.me import current_week
from ..schemas import GroupOut, InviteLinkOut

router = APIRouter(prefix="/admin", tags=["admin"],
                   dependencies=[Depends(require_role(Role.superadmin))])


@router.post("/curator-invites", response_model=InviteLinkOut, status_code=201)
def invite_curator(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    token = new_opaque_token()
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    inv = Invite(
        token_hash=sha256(token), role=Role.curator, group_id=None,
        created_by=user.id,
        expires_at=now + timedelta(hours=settings.invite_ttl_hours),
    )
    db.add(inv)
    db.commit()
    return InviteLinkOut(
        url=f"{settings.frontend_origin}/join?token={token}",
        expires_at=inv.expires_at,
    )


@router.get("/groups", response_model=list[GroupOut])
def all_groups(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    result = []
    for g in db.query(Group).all():
        count = db.query(func.count(GroupMember.user_id)).filter(
            GroupMember.group_id == g.id).scalar()
        result.append(GroupOut(
            id=g.id, name=g.name, curator_id=g.curator_id, start_date=g.start_date,
            members_count=count, current_week=current_week(g, now),
        ))
    return result
