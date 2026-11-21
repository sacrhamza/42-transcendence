from datetime import date, datetime

from pydantic import BaseModel


class FriendRequestCreate(BaseModel):
    recipient_id: int


class PeerResponse(BaseModel):
    id: int
    name: str
    profile_image: str
    bio: str
    user_join_date: date
    friends_since: datetime


class FriendRequestResponse(BaseModel):
    user_id: int
    name: str
    profile_image: str
    sent_at: datetime
