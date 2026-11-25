import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("POSTGRES_URL")
if DATABASE_URL is None:
    raise RuntimeError("couldn't get database url")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db    # keeps the session wokring
    finally:
        db.close()  # kadoz hna fach katsali dakchi li bghiti tdir, awla katra chi exception
