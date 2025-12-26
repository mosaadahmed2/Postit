from pydantic import BaseModel
from typing import Optional

class Tweet(BaseModel):
    id: Optional[int] = None   # <-- works in Python 3.9
    user: str
    content: str
    likes: int = 0

    class Config:
        orm_mode = True

class LikeRequest(BaseModel):
    user: str

