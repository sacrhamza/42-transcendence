from datetime import datetime

from database import Base
from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column


class Peer(Base):
    __tablename__ = "peers"
    __table_args__ = (CheckConstraint("fk_peer_id1 < fk_peer_id2", name="chk_user_order"),)

    fk_peer_id1: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), primary_key=True)
    fk_peer_id2: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), primary_key=True)
    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class PeerRequest(Base):
    __tablename__ = "peer_requests"

    fk_sender_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), primary_key=True)
    fk_recipient_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), primary_key=True)
    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
