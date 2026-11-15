import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# def get_secret(secret_name: str) -> str:
#     """Reads a Docker secret from /run/secrets/, if it fails it searches for the environment variable."""
#     secret_path = f"/run/secrets/{secret_name}"
#     if os.path.exists(secret_path):
#         with open(secret_path, "r") as f:
#             return f.read().strip()
#     env_var = os.getenv(secret_name)
#     if env_var is None:
#         raise RuntimeError(f"failed to find secret: {secret_name}")
#     return env_var

# secrets / env variables
# DB_USER = get_secret("postgres_user")
# DB_PASSWORD = get_secret("postgres_password")
# DB_NAME = get_secret("POSTGRES_DB")
# DB_HOST = os.getenv("DB_HOST")
# DB_PORT = os.getenv("POSTGRES_PORT")

# DATABASE_URL = (
#     f"postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
# )

# DATABASE_URL = os.getenv("POSTGRES_URL")
DATABASE_URL = os.getenv("POSTGRES_URL")
if DATABASE_URL is None:
    raise RuntimeError("couldn't get database url")

# 1. create engine (like a pathway or so)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# 2. class used to generate new "configurable" session instances
SessionLocal = sessionmaker(autoflush=False, bind=engine)

# 3. base class for database models
Base = declarative_base()

# 4. instanciate a database session to use or so
def get_db():
    db = SessionLocal()
    try:
        yield db    # keeps the session wokring
    finally:
        db.close()  # kadoz hna fach katsali dakchi li bghiti tdir, awla katra chi exception
