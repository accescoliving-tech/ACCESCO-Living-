from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool

from Accesco_chatbot.app.config import settings

# -----------------------------
# SQLAlchemy Engine
# -----------------------------
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=NullPool,                  # REQUIRED for Supabase Pooler
    connect_args={"sslmode": "require"}, # REQUIRED for Supabase
)

# -----------------------------
# Session factory
# -----------------------------
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# -----------------------------
# Base class for models
# -----------------------------
Base = declarative_base()

# -----------------------------
# FastAPI DB dependency
# -----------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
