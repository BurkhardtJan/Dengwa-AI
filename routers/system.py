from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User


router = APIRouter(tags=["System"])

@router.get("/health")
async def root():
    """Health check of the Website"""
    return {"message": "Immersio AI running"}


@router.post("/register")
async def register(username: str, native_language: str = "de", db: Session = Depends(get_db)):
    """Register a new user"""
    user = (db.query(User).filter(User.username == username)).first()
    if user:
        raise HTTPException(
            status_code=409,
            detail="Username already exists"
        )
    new_user = User(username=username, native_language=native_language)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user