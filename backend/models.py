from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class TweetDB(Base):
    __tablename__ = "tweets"

    id = Column(Integer, primary_key=True, index=True)
    user = Column(String, index=True)
    content = Column(String)

    liked_by = relationship("TweetLike", back_populates="tweet", cascade="all, delete")


class TweetLike(Base):
    __tablename__ = "tweet_likes"

    id = Column(Integer, primary_key=True, index=True)
    user = Column(String, index=True)

    tweet_id = Column(Integer, ForeignKey("tweets.id"))
    tweet = relationship("TweetDB", back_populates="liked_by")
