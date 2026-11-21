from datetime import date, datetime
from typing import TypedDict

from fastapi import HTTPException, status
from models.friend_model import Peer, PeerRequest
from models.user_model import FtUser, NormalUser, User
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session


def _order_ids(user_id_1: int, user_id_2: int) -> tuple[int, int]:
    return (user_id_1, user_id_2) if user_id_1 < user_id_2 else (user_id_2, user_id_1)


class UserProfilesDict(TypedDict):
    id: int
    name: str
    profile_image: str
    bio: str
    user_join_date: date


def _fetch_user_profiles(db: Session, user_ids: list[int]) -> dict[int, UserProfilesDict]:
    if not user_ids:
        return {}

    user_rows = (
        select(
            User.id,
            func.coalesce(FtUser.name, NormalUser.name, "Unknown").label("name"),
            User.profile_image,
            User.bio,
            User.user_join_date,
        )
        .outerjoin(FtUser, FtUser.fk_user_id == User.id)
        .outerjoin(NormalUser, NormalUser.fk_user_id == User.id)
        .where(User.id.in_(user_ids), User.deleted.is_(False))
    )

    rows = db.execute(user_rows).all()
    return {
        row.id: {
            "id": row.id,
            "name": row.name,
            "profile_image": row.profile_image,
            "bio": row.bio,
            "user_join_date": row.user_join_date,
        }
        for row in rows
    }


def send_friend_request(db: Session, sender_id: int, recipient_id: int) -> PeerRequest:
    if sender_id == recipient_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot send a friend request to yourself.",
        )

    recipient = db.scalar(
        select(User).where(User.id == recipient_id, User.deleted.is_(False))
    )
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient user not found.",
        )

    id1, id2 = _order_ids(sender_id, recipient_id)
    already_peers = db.scalar(
        select(Peer).where(Peer.fk_peer_id1 == id1, Peer.fk_peer_id2 == id2)
    )
    if already_peers:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already peers with this user.",
        )

    existing_req = db.scalar(
        select(PeerRequest).where(
            or_(
                and_(
                    PeerRequest.fk_sender_id == sender_id,
                    PeerRequest.fk_recipient_id == recipient_id,
                ),
                and_(
                    PeerRequest.fk_sender_id == recipient_id,
                    PeerRequest.fk_recipient_id == sender_id,
                ),
            )
        )
    )
    if existing_req:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A pending friend request already exists.",
        )

    new_request = PeerRequest(fk_sender_id=sender_id, fk_recipient_id=recipient_id)
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request


class RequestsDict(TypedDict):
    user_id: int
    name: str
    profile_image: str
    sent_at: datetime


def get_incoming_requests(db: Session, current_user_id: int) -> list[RequestsDict]:
    reqs = db.scalars(
        select(PeerRequest).where(PeerRequest.fk_recipient_id == current_user_id)
    ).all()
    profiles = _fetch_user_profiles(db, [r.fk_sender_id for r in reqs])

    return [
        {
            "user_id": r.fk_sender_id,
            "name": profiles[r.fk_sender_id]["name"],
            "profile_image": profiles[r.fk_sender_id]["profile_image"],
            "sent_at": r.time,
        }
        for r in reqs
        if r.fk_sender_id in profiles
    ]


def get_outgoing_requests(db: Session, current_user_id: int) -> list[RequestsDict]:
    reqs = db.scalars(
        select(PeerRequest).where(PeerRequest.fk_sender_id == current_user_id)
    ).all()
    profiles = _fetch_user_profiles(db, [r.fk_recipient_id for r in reqs])

    return [
        {
            "user_id": r.fk_recipient_id,
            "name": profiles[r.fk_recipient_id]["name"],
            "profile_image": profiles[r.fk_recipient_id]["profile_image"],
            "sent_at": r.time,
        }
        for r in reqs
        if r.fk_recipient_id in profiles
    ]


def accept_friend_request(db: Session, current_user_id: int, sender_id: int) -> None:
    req = db.scalar(
        select(PeerRequest).where(
            PeerRequest.fk_sender_id == sender_id,
            PeerRequest.fk_recipient_id == current_user_id,
        )
    )
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incoming friend request not found.",
        )

    id1, id2 = _order_ids(current_user_id, sender_id)
    db.delete(req)
    db.add(Peer(fk_peer_id1=id1, fk_peer_id2=id2))
    db.commit()


def remove_friend_request(db: Session, current_user_id: int, other_user_id: int) -> None:
    req = db.scalar(
        select(PeerRequest).where(
            or_(
                and_(
                    PeerRequest.fk_sender_id == other_user_id,
                    PeerRequest.fk_recipient_id == current_user_id,
                ),
                and_(
                    PeerRequest.fk_sender_id == current_user_id,
                    PeerRequest.fk_recipient_id == other_user_id,
                ),
            )
        )
    )
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friend request not found.",
        )

    db.delete(req)
    db.commit()


class PeersDict(TypedDict):
    id: int
    name: str
    profile_image: str
    bio: str
    user_join_date: date
    friends_since: date


def get_peers(db: Session, current_user_id: int) -> list[PeersDict]:
    peer_rows = db.scalars(
        select(Peer).where(
            or_(
                Peer.fk_peer_id1 == current_user_id,
                Peer.fk_peer_id2 == current_user_id,
            )
        )
    ).all()

    peer_times = {
        (row.fk_peer_id2 if row.fk_peer_id1 == current_user_id else row.fk_peer_id1): row.time
        for row in peer_rows
    }
    profiles = _fetch_user_profiles(db, list(peer_times.keys()))

    return [
        {**profiles[uid], "friends_since": friends_since}
        for uid, friends_since in peer_times.items()
        if uid in profiles
    ]


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