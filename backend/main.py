from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
import logging

import models, schemas
from database import engine, Base, get_db
from auth import verify_password, create_access_token
from auth import get_current_user
from auth import get_password_hash, verify_password, create_access_token
from models import User, TweetDB, TweetLike
from schemas import LoginRequest, RegisterRequest


from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache
from redis import asyncio as aioredis

from cricket import get_current_matches, get_match_info, get_match_scorecard

# WebSocket connections
active_connections = []

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ✅ CREATE APP FIRST
app = FastAPI()

# ✅ CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#try:
#    print("🔄 Resetting database tables...")
#    Base.metadata.drop_all(bind=engine)
#    print("✅ Tables dropped")
#    Base.metadata.create_all(bind=engine)
#    print("✅ Tables created with new schema")
#except Exception as e:
#    print(f"⚠️ Database reset error (might be normal): {e}")

# ---------------- AUTH ----------------
@app.post("/auth/login")
async def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == request.username).first()
    
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/register")
async def register(request: schemas.RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(
        (models.User.username == request.username) | (models.User.email == request.email)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    hashed_password = get_password_hash(request.password)
    new_user = models.User(
        username=request.username,
        email=request.email,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User created successfully"}

# ---------------- REDIS CACHE ----------------
@app.on_event("startup")
async def startup_event():
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379")
    redis_client = aioredis.from_url(redis_url, encoding="utf-8", decode_responses=True)
    FastAPICache.init(RedisBackend(redis_client), prefix="fastapi-cache")
    logger.info("✅ Connected to Redis")

# ---------------- WEBSOCKET ----------------
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
            await manager.broadcast(f"Message: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ---------------- TWEETS ----------------
@app.get("/")
def root():
    return {"message": "Mini Twitter API running with caching"}

# Add this new endpoint after your existing tweet endpoints

@app.get("/tweet/match/{match_hashtag}")
def get_tweets_by_match(match_hashtag: str, db: Session = Depends(get_db)):
    """Get tweets for a specific match by hashtag"""
    tweets = db.query(models.TweetDB).filter(
        models.TweetDB.match_hashtag == match_hashtag
    ).all()
    
    return [
        {
            "id": t.id,
            "user": t.user,
            "content": t.content,
            "likes": len(t.liked_by),
            "match_hashtag": t.match_hashtag
        }
        for t in tweets
    ]

# Update your create_tweet endpoint to accept match_hashtag
@app.post("/tweet/create")
async def create_tweet(
    tweet: schemas.TweetCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_tweet = models.TweetDB(
        user=current_user.username,
        content=tweet.content,
        match_hashtag=tweet.match_hashtag  # Add this
    )
    db.add(new_tweet)
    db.commit()
    db.refresh(new_tweet)
    
    # Broadcast update to WebSocket clients
    await manager.broadcast("new_tweet")
    
    return new_tweet

# Update get_all_tweets to include match_hashtag
@app.get("/tweet/all")
def get_all_tweets(db: Session = Depends(get_db)):
    tweets = db.query(models.TweetDB).all()
    return [
        {
            "id": t.id,
            "user": t.user,
            "content": t.content,
            "likes": len(t.liked_by),
            "match_hashtag": t.match_hashtag  # Add this
        }
        for t in tweets
    ]

@app.get("/tweet/{username}")
def get_tweets_by_user(username: str, db: Session = Depends(get_db)):
    """Get tweets by specific username"""
    tweets = db.query(models.TweetDB).filter(models.TweetDB.user == username).all()
    return [
        {
            "id": t.id,
            "user": t.user,
            "content": t.content,
            "likes": len(t.liked_by)
        }
        for t in tweets
    ]

# ✅ ADD THESE MISSING ENDPOINTS

@app.put("/tweet/{tweet_id}")
async def update_tweet(
    tweet_id: int,
    tweet: schemas.TweetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update a tweet"""
    db_tweet = db.query(models.TweetDB).filter(models.TweetDB.id == tweet_id).first()
    
    if not db_tweet:
        raise HTTPException(status_code=404, detail="Tweet not found")
    
    # Check if user owns the tweet
    if db_tweet.user != current_user.username:
        raise HTTPException(status_code=403, detail="Not authorized to update this tweet")
    
    db_tweet.content = tweet.content
    db.commit()
    db.refresh(db_tweet)
    
    await manager.broadcast("tweet_updated")
    
    return db_tweet

@app.delete("/tweet/{tweet_id}")
async def delete_tweet(
    tweet_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a tweet"""
    db_tweet = db.query(models.TweetDB).filter(models.TweetDB.id == tweet_id).first()
    
    if not db_tweet:
        raise HTTPException(status_code=404, detail="Tweet not found")
    
    # Check if user owns the tweet
    if db_tweet.user != current_user.username:
        raise HTTPException(status_code=403, detail="Not authorized to delete this tweet")
    
    db.delete(db_tweet)
    db.commit()
    
    await manager.broadcast("tweet_deleted")
    
    return {"message": "Tweet deleted successfully"}

@app.post("/tweet/{tweet_id}/like")
async def like_tweet(
    tweet_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Like/unlike a tweet"""
    tweet = db.query(models.TweetDB).filter(models.TweetDB.id == tweet_id).first()
    
    if not tweet:
        raise HTTPException(status_code=404, detail="Tweet not found")
    
    # Check if user already liked this tweet
    existing_like = db.query(models.TweetLike).filter(
        models.TweetLike.tweet_id == tweet_id,
        models.TweetLike.user == current_user.username
    ).first()
    
    if existing_like:
        # Unlike: remove the like
        db.delete(existing_like)
        db.commit()
        action = "unliked"
    else:
        # Like: add new like
        new_like = models.TweetLike(
            user=current_user.username,
            tweet_id=tweet_id
        )
        db.add(new_like)
        db.commit()
        action = "liked"
    
    await manager.broadcast("tweet_liked")
    
    return {"message": f"Tweet {action}", "likes": len(tweet.liked_by)}

@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    """Get list of all users who have registered"""
    # Get all registered users from User table
    users = db.query(User.username).all()
    usernames = [user[0] for user in users]
    return usernames



# ---------------- CRICKET ENDPOINTS ----------------
@app.get("/cricket/matches")
async def get_live_matches():
    """Get all current/live cricket matches"""
    matches = await get_current_matches()
    return {"matches": matches}

@app.get("/cricket/match/{match_id}")
async def get_match_details(match_id: str):
    """Get detailed information for a specific match"""
    match_info = await get_match_info(match_id)
    return match_info

@app.get("/cricket/scorecard/{match_id}")
async def get_scorecard(match_id: str):
    """Get scorecard for a specific match"""
    scorecard = await get_match_scorecard(match_id)
    return scorecard