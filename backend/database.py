from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "postgresql+psycopg2://mosaadahmed:Mosaad%40786@host.docker.internal:5432/mini_twitter"




# replace with your username:password@host:port/dbname

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()

# Dependency to get DB sessionmmm
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
