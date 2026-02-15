from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)  # Add this
    hashed_password = Column(String)


class TweetDB(Base):
    __tablename__ = "tweets"

    id = Column(Integer, primary_key=True, index=True)
    user = Column(String, index=True)
    content = Column(String)
    match_hashtag = Column(String, index=True, nullable=True)
    liked_by = relationship("TweetLike", back_populates="tweet", cascade="all, delete")


class TweetLike(Base):
    __tablename__ = "tweet_likes"

    id = Column(Integer, primary_key=True, index=True)
    user = Column(String, index=True)

    tweet_id = Column(Integer, ForeignKey("tweets.id"))
    tweet = relationship("TweetDB", back_populates="liked_by")