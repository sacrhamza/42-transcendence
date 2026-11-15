from datetime import date
from sqlalchemy import BigInteger, Boolean, Date, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(75), unique=True, nullable=False)
    profile_image: Mapped[str] = mapped_column(Text, nullable=False)
    user_join_date: Mapped[date] = mapped_column(Date, nullable=False)
    bio: Mapped[str] = mapped_column(Text, nullable=False)
    updated_date: Mapped[date] = mapped_column(Date, nullable=False)
    deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
