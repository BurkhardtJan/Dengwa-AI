from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from schemas import UserRegister
from database import get_db
from models import User
from services.user_service import create_access_token, verify_password, hash_password

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/register")
async def register(data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    user = (db.query(User).filter(User.username == data.username)).first()
    if user:
        raise HTTPException(
            status_code=409,
            detail="Username already exists"
        )
    new_user = User(username=data.username, native_language=data.native_language,
                    hashed_password=hash_password(data.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"status": "success", "username": new_user.username}


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Falsche Anmeldedaten")

    token = create_access_token(subject=str(user.id))
    return {"access_token": token, "token_type": "bearer"}
