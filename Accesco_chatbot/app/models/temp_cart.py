from sqlalchemy import Column, String, Numeric, TIMESTAMP, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func

from app.database import Base


class TempCart(Base):
    __tablename__ = "temp_cart"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())

    session_id = Column(String, unique=True, nullable=False)
    user_id = Column(String, nullable=True)

    cart_items = Column(JSONB, nullable=False)
    total_price = Column(Numeric(10, 2), default=0)

    status = Column(String, default="ACTIVE")

    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


