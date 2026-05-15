import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import bcrypt
from dotenv import load_dotenv
from fastapi import HTTPException, status
from jose import JWTError, jwt
from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24
DATABASE_URL = f"sqlite:///{Path(__file__).resolve().parents[1] / 'helix_auth.db'}"

Base = declarative_base()
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)


Base.metadata.create_all(bind=engine)


def signup(email: str, password: str) -> dict:
    """Create a new user account with a bcrypt-hashed password."""
    normalized_email = _normalize_email(email)
    _validate_password(password)

    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == normalized_email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered.")

        user = User(
            email=normalized_email,
            hashed_password=_hash_password(password),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        return {"message": "signup successful", "user_id": str(user.id)}
    finally:
        db.close()


def login(email: str, password: str) -> dict:
    """Verify credentials and return a signed bearer token."""
    normalized_email = _normalize_email(email)

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == normalized_email).first()
        if not user or not _verify_password(password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        token = _create_access_token(user)
        return {"access_token": token, "token_type": "bearer"}
    finally:
        db.close()


def get_current_user(token: str) -> dict:
    """Decode a JWT bearer token and return the current user's identity."""
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, _get_secret_key(), algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        email = payload.get("email")
        if not user_id or not email:
            raise credentials_error
    except JWTError as exc:
        raise credentials_error from exc

    db = SessionLocal()
    try:
        try:
            numeric_user_id = int(user_id)
        except ValueError as exc:
            raise credentials_error from exc

        user = db.query(User).filter(User.id == numeric_user_id).first()
        if not user:
            raise credentials_error

        return {"user_id": str(user.id), "email": user.email}
    finally:
        db.close()


def _create_access_token(user: User) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "exp": expires_at,
    }
    return jwt.encode(payload, _get_secret_key(), algorithm=JWT_ALGORITHM)


def _hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))


def _normalize_email(email: str) -> str:
    if not email or not email.strip():
        raise HTTPException(status_code=400, detail="Email must not be empty.")
    return email.strip().lower()


def _validate_password(password: str) -> None:
    if not password or not password.strip():
        raise HTTPException(status_code=400, detail="Password must not be empty.")


def _get_secret_key() -> str:
    secret_key = os.getenv("JWT_SECRET_KEY") or JWT_SECRET_KEY
    if not secret_key:
        raise HTTPException(status_code=500, detail="JWT_SECRET_KEY is not configured.")
    return secret_key
