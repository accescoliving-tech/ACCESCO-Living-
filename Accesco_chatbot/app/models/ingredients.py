from sqlalchemy import Column, Integer, String, Numeric, Text
from Accesco_chatbot.app.database import Base

class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    image_url = Column(Text, nullable=True)