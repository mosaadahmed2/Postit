from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

import models, schemas


from database import engine, Base, get_db

from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache
import redis
from redis import asyncio as aioredis 

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


import os


# Create the tables if they don’t exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)

print(f"Server started on port {os.getenv('PORT')}")

# Then in your startup function:
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Startup event triggered!")
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379")
    logger.info(f"📍 Connecting to Redis at: {redis_url}")
    redis_client = aioredis.from_url(redis_url, encoding="utf-8", decode_responses=True)
    FastAPICache.init(RedisBackend(redis_client), prefix="fastapi-cache")
    logger.info("✅ Connected to Redis successfully")


@app.get("/status")
def status():
    hostname = os.getenv("HOSTNAME", "unknown")
    pid = os.getpid()
    return {"server": hostname, "pid": pid, "message": "I'm alive!"}


# Keep track of all connected clients
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Optionally handle messages from client
            await manager.broadcast(f"Message: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.get("/")
async def root():
    return {"message": "Mini Twitter API running with caching"}

@app.post("/tweets")
async def create_tweet(tweet: schemas.Tweet, db: Session = Depends(get_db)):
    db_tweet = models.TweetDB(user=tweet.user, content=tweet.content)
    db.add(db_tweet)
    db.commit()
    db.refresh(db_tweet)

    # Clear cache so /tweet/all is refreshed next time
    await FastAPICache.clear()
    return {"message": "Tweet created", "tweet": db_tweet}


# Get all tweets
@app.get("/tweet/all", response_model=List[schemas.Tweet])
@cache(expire=60)  # Cache this endpoint for 60 seconds
def get_all_tweets(db: Session = Depends(get_db)):
    return db.query(models.TweetDB).all()

# Get tweets by username
@app.get("/tweet/{user}", response_model=List[schemas.Tweet])
@cache(expire=60)  # Cache this endpoint for 60 seconds
def get_tweets_by_user(user: str, db: Session = Depends(get_db)):
    return db.query(models.TweetDB).filter(models.TweetDB.user == user).all()

@app.get("/users", response_model=List[str])
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.TweetDB.user).distinct().all()
    return [user[0] for user in users]  # return as simple list of strings



# Update tweet
@app.put("/tweet/{tweet_id}", response_model=schemas.Tweet)
def update_tweet(tweet_id: int, tweet: schemas.Tweet, db: Session = Depends(get_db)):
    db_tweet = db.query(models.TweetDB).filter(models.TweetDB.id == tweet_id).first()
    if not db_tweet:
        raise HTTPException(status_code=404, detail="Tweet not found")
    db_tweet.content = tweet.content
    db.commit()
    db.refresh(db_tweet)
    return db_tweet

# Delete tweet
@app.delete("/tweet/{tweet_id}")
def delete_tweet(tweet_id: int, db: Session = Depends(get_db)):
    db_tweet = db.query(models.TweetDB).filter(models.TweetDB.id == tweet_id).first()
    if not db_tweet:
        raise HTTPException(status_code=404, detail="Tweet not found")
    db.delete(db_tweet)
    db.commit()
    return {"message": "Tweet deleted"}
