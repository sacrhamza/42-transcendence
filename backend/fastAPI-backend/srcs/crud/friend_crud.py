from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session
from models.friend_model import Peer
from models.user_model import User


def _order_ids(user_id_1: int, user_id_2: int) -> tuple[int, int]:
    return (user_id_1, user_id_2) if user_id_1 < user_id_2 else (user_id_2, user_id_1)


def add_peer(db: Session, current_user_id: int, target_user_id: int) -> Peer:
    if current_user_id == target_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot add yourself as a peer.",
        )

    target_user = db.scalar(
        select(User).where(User.id == target_user_id, User.deleted.is_(False))
    )
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user not found.",
        )

    id1, id2 = _order_ids(current_user_id, target_user_id)

    existing = db.scalar(
        select(Peer).where(Peer.fk_peer_id1 == id1, Peer.fk_peer_id2 == id2)
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Users are already peers.",
        )

    new_peer = Peer(fk_peer_id1=id1, fk_peer_id2=id2)
    db.add(new_peer)
    db.commit()
    db.refresh(new_peer)
    return new_peer


def get_peers(db: Session, current_user_id: int) -> list[User]:
    peer_rows = db.scalars(
        select(Peer).where(
            or_(
                Peer.fk_peer_id1 == current_user_id,
                Peer.fk_peer_id2 == current_user_id,
            )
        )
    ).all()

    peer_ids = [
        row.fk_peer_id2 if row.fk_peer_id1 == current_user_id else row.fk_peer_id1
        for row in peer_rows
    ]

    if not peer_ids:
        return []

    users = db.scalars(
        select(User).where(User.id.in_(peer_ids), User.deleted.is_(False))
    ).all()
    return list(users)


def remove_peer(db: Session, current_user_id: int, target_user_id: int) -> None:
    id1, id2 = _order_ids(current_user_id, target_user_id)

    peer_row = db.scalar(
        select(Peer).where(Peer.fk_peer_id1 == id1, Peer.fk_peer_id2 == id2)
    )
    if not peer_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Peer relationship does not exist.",
        )

    db.delete(peer_row)
    db.commit()