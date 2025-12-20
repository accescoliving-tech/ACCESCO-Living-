from sqlalchemy import Column, Integer, String, JSON, DateTime, Text
from datetime import datetime
from Accesco_chatbot.app.database import Base

class Orders(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, unique=True, index=True, nullable=False)
    platform = Column(String, nullable=False)
    session_id = Column(String, index=True)
    items = Column(JSON, nullable=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    customization = Column(Text, nullable=True)