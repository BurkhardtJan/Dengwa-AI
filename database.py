import os
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()
# engine = create_engine(os.environ["SQLALCHEMY_DATABASE_URL"])
db_url = os.environ["SQLALCHEMY_DATABASE_URL"]

# Spezielle Konfiguration für SQLite, falls es genutzt wird
if db_url.startswith("sqlite"):
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False}  # Wichtig für FastAPI!
    )
else:
    engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Helper function to get db session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
