from sqlalchemy import Column, Integer, String, Text
from database import Base

class TweetDB(Base):
    __tablename__ = "tweets"

    id = Column(Integer, primary_key=True, index=True)
    user = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
