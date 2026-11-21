from datetime import date

from database import Base
from sqlalchemy import BigInteger, Boolean, Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    profile_image: Mapped[str] = mapped_column(Text, nullable=False)
    user_join_date: Mapped[date] = mapped_column(Date, nullable=False)
    bio: Mapped[str] = mapped_column(Text, nullable=False)
    updated_date: Mapped[date] = mapped_column(Date, nullable=False)
    deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class FtUser(Base):
    __tablename__ = "ft_users"

    intra_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    fk_user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(75), unique=True, nullable=False)


class NormalUser(Base):
    __tablename__ = "normal_users"

    mail: Mapped[str] = mapped_column(String(50), primary_key=True)
    fk_user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    password: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(75), unique=True, nullable=False)
