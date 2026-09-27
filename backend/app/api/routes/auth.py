from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.models import User, Profile
from app.schemas.schemas import SignupIn, LoginIn, TokenOut, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup", response_model=TokenOut, status_code=201)
def signup(data: SignupIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(409, "An account with this email already exists.")
    if len(data.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")
    user = User(name=data.name, email=data.email, password_hash=hash_password(data.password))
    db.add(user); db.flush()
    db.add(Profile(user_id=user.id))
    db.commit(); db.refresh(user)
    return TokenOut(access_token=create_access_token(str(user.id)), user=UserOut.model_validate(user))

@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password.")
    return TokenOut(access_token=create_access_token(str(user.id)), user=UserOut.model_validate(user))