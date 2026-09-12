import uuid
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app import models, schemas
from app.config import settings
from app.services.auth_service import hash_password, verify_password
from app.services.token_service import create_access_token, decode_access_token

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

COOKIE_NAME = "access_token"
COOKIE_MAX_AGE = settings.ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60


def get_current_user(request: Request, db: Session = Depends(get_db)) -> models.User:
    """Dependency that extracts the logged-in user from the httpOnly session cookie.
    Raises 401 if unauthenticated or session is invalid."""
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session"
        )
    
    try:
        user_id = uuid.UUID(payload["sub"])
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session token"
        )
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user


def get_optional_current_user(request: Request, db: Session = Depends(get_db)) -> Optional[models.User]:
    """Dependency that returns the current user if a valid session cookie exists, or None."""
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None
    
    try:
        user_id = uuid.UUID(payload["sub"])
        return db.query(models.User).filter(models.User.id == user_id).first()
    except (ValueError, TypeError):
        return None


def set_auth_cookie(response: Response, user_id: Any) -> None:
    """Helper to issue a signed JWT access token in an httpOnly cookie."""
    token = create_access_token(user_id)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True in production with HTTPS
        path="/"
    )



@router.post("/signup", response_model=schemas.AuthSuccessResponse)
@limiter.limit("5/minute")
def signup(
    request: Request,
    response: Response,
    body: schemas.UserSignup,
    db: Session = Depends(get_db)
):
    """Register a new customer account, hash password, set session cookie."""
    # Check password length
    if len(body.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )

    # Check if email is already taken
    existing_user = db.query(models.User).filter(models.User.email == body.email.lower().strip()).first()
    if existing_user:
        # Generic 400 to prevent account enumeration
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to create account"
        )

    # Create user
    password_hash = hash_password(body.password)
    new_user = models.User(
        name=body.name.strip(),
        email=body.email.lower().strip(),
        password_hash=password_hash
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Set session cookie
    set_auth_cookie(response, new_user.id)

    return {"success": True, "name": new_user.name}


@router.post("/login", response_model=schemas.AuthSuccessResponse)
@limiter.limit("5/minute")
def login(
    request: Request,
    response: Response,
    body: schemas.UserLogin,
    db: Session = Depends(get_db)
):
    """Authenticate customer with email and password, set session cookie."""
    user = db.query(models.User).filter(models.User.email == body.email.lower().strip()).first()
    if not user or not verify_password(body.password, str(user.password_hash)):
        # Single generic error message regardless of whether email or password was wrong
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Set session cookie
    set_auth_cookie(response, user.id)

    return {"success": True, "name": user.name}


@router.post("/logout")
def logout(response: Response):
    """Clear session cookie."""
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        httponly=True,
        samesite="lax"
    )
    return {"success": True, "message": "Logged out successfully"}


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    """Return currently logged-in user profile or 401 if unauthenticated."""
    return {"name": current_user.name, "email": current_user.email}
