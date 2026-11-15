from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from crud import friend_crud
from database import get_db
from schemas.friend_schema import PeerAddRequest, PeerResponse

router = APIRouter(prefix="/friends", tags=["Friends"])

@router.post("/", status_code=status.HTTP_201_CREATED)
def add_friend(
    payload: PeerAddRequest,
    current_user_id: int,  # Temporary until dependencies.py is wired
    db: Session = Depends(get_db),
):
    friend_crud.add_peer(db, current_user_id, payload.peer_id)
    return {"message": "Peer added successfully"}


@router.get("/", response_model=list[PeerResponse])
def list_friends(
    current_user_id: int,  # Temporary until dependencies.py is wired
    db: Session = Depends(get_db),
):
    return friend_crud.get_peers(db, current_user_id)


@router.delete("/{peer_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_friend(
    peer_id: int,
    current_user_id: int,  # Temporary until dependencies.py is wired
    db: Session = Depends(get_db),
):
    friend_crud.remove_peer(db, current_user_id, peer_id)