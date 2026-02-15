from pydantic import BaseModel, EmailStr
from typing import Optional

class Tweet(BaseModel):
    id: Optional[int] = None
    user: str
    content: str
    likes: int = 0
    match_hashtag: Optional[str] = None

    class Config:
        orm_mode = True


class TweetCreate(BaseModel):
    content: str
    match_hashtag: Optional[str] = None


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr  # Add this - EmailStr validates email format
    password: str


class LikeRequest(BaseModel):
    user: str


class LoginRequest(BaseModel):
    username: str
    password: str