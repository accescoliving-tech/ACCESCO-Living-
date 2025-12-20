from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from Accesco_chatbot.app.database import Base

class Cancel_Feedback(Base):
    __tablename__ = "cancel_feedback"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), nullable=False)
    feedback = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
