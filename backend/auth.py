from fastapi import APIRouter, Depends, HTTPException,status
from sqlalchemy.orm import Session
import database
from models import User
from schemas import SignupRequest,LoginRequest
from sqlalchemy.exc import IntegrityError
from auth_utils import verify_password,create_access_token,get_password_hash
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["auth"])
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Dependency for DB
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/signup")
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    email = payload.email
    password = payload.password
    role = payload.role

    user = db.query(User).filter(User.email == email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email {email} already registered as {user.role}",
        )
    
    new_user = User(
        email=email,
        password=get_password_hash(password),
        role=role,
    )
    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email {email} already exists.",
        )
    finally:
        db.close()
    return {"message": "User created successfully"}


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # enforce role match
    if payload.role and user.role != payload.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This account is registered as {user.role}, not {payload.role}",
        )

    # create JWT
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    print("DB password:", user.password)
    print("Entered password:", payload.password)
    print("Verify:", verify_password(payload.password, user.password))

    return {"access_token": access_token, "token_type": "bearer"}
