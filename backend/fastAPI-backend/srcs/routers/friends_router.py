from typing import Annotated

from crud import friend_crud
from database import get_db
from fastapi import APIRouter, Depends, status
from schemas.friend_schema import (
    FriendRequestCreate,
    FriendRequestResponse,
    PeerResponse,
)
from sqlalchemy.orm import Session

router = APIRouter(prefix="/friends", tags=["Friends"])


@router.get("/", response_model=list[PeerResponse])
def list_friends(
    current_user_id: int,  # Temporary until dependencies.py is wired
    db: Annotated[Session, Depends(get_db)],
):
    return friend_crud.get_peers(db, current_user_id)


@router.delete("/{peer_id}", status_code=status.HTTP_204_NO_CONTENT)
def unfriend(
    peer_id: int,
    current_user_id: int,  # Temporary until dependencies.py is wired
    db: Annotated[Session, Depends(get_db)],
):
    friend_crud.remove_peer(db, current_user_id, peer_id)


@router.post("/requests", status_code=status.HTTP_201_CREATED)
def send_request(
    payload: FriendRequestCreate,
    current_user_id: int,  # Temporary until dependencies.py is wired
    db: Annotated[Session, Depends(get_db)],
):
    friend_crud.send_friend_request(db, current_user_id, payload.recipient_id)
    return {"message": "Friend request sent"}


@router.get("/requests/incoming", response_model=list[FriendRequestResponse])
def list_incoming_requests(
    current_user_id: int,  # Temporary until dependencies.py is wired
    db: Annotated[Session, Depends(get_db)],
):
    return friend_crud.get_incoming_requests(db, current_user_id)


@router.get("/requests/outgoing", response_model=list[FriendRequestResponse])
def list_outgoing_requests(
    current_user_id: int,  # Temporary until dependencies.py is wired
    db: Annotated[Session, Depends(get_db)],
):
    return friend_crud.get_outgoing_requests(db, current_user_id)


@router.post("/requests/{sender_id}/accept", status_code=status.HTTP_201_CREATED)
def accept_request(
    sender_id: int,
    current_user_id: int,  # Temporary until dependencies.py is wired
    db: Annotated[Session, Depends(get_db)],
):
    friend_crud.accept_friend_request(db, current_user_id, sender_id)
    return {"message": "Friend request accepted"}


@router.delete("/requests/{other_user_id}", status_code=status.HTTP_204_NO_CONTENT)
def decline_or_cancel_request(
    other_user_id: int,
    current_user_id: int,  # Temporary until dependencies.py is wired
    db: Annotated[Session, Depends(get_db)],
):
    friend_crud.remove_friend_request(db, current_user_id, other_user_id)
