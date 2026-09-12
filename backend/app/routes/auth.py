import uuid
from datetime import datetime
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app import models, schemas
from app.config import settings
from app.services.auth_service import hash_password, verify_password, validate_signup_email
from app.services.token_service import (
    create_access_token,
    decode_access_token,
    create_verification_token,
    decode_verification_token,
)
from app.services.email_service import send_verification_email

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


@router.post("/signup", response_model=schemas.GenericMessageResponse)
@limiter.limit("5/minute")
def signup(
    request: Request,
    body: schemas.UserSignup,
    db: Session = Depends(get_db)
):
    """Register a customer account with MX and disposable domain validation.
    Leaves user unverified and sends verification email with link."""
    # 1. Format, MX DNS deliverability, and disposable domain checks
    clean_email = validate_signup_email(body.email)

    # 2. Check password length
    if len(body.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )

    # 3. Check if email is already registered (account enumeration protection)
    existing_user = db.query(models.User).filter(models.User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to create account"
        )

    # 4. Create user with is_verified = False
    password_hash = hash_password(body.password)
    new_user = models.User(
        name=body.name.strip(),
        email=clean_email,
        password_hash=password_hash,
        is_verified=False,
        verification_sent_at=datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 5. Generate verification token & send email
    token = create_verification_token(new_user.id)
    verification_link = f"{settings.FRONTEND_URL}/verify-email.html?token={token}"
    send_verification_email(new_user.email, new_user.name, verification_link)

    # Notice: DO NOT set session cookie yet — user cannot log in until email is verified
    return {
        "success": True,
        "message": "Check your email to verify your account"
    }


@router.post("/login", response_model=schemas.AuthSuccessResponse)
@limiter.limit("5/minute")
def login(
    request: Request,
    response: Response,
    body: schemas.UserLogin,
    db: Session = Depends(get_db)
):
    """Authenticate customer with email and password.
    Requires account to be verified before issuing session cookie."""
    user = db.query(models.User).filter(models.User.email == body.email.lower().strip()).first()
    if not user or not verify_password(body.password, str(user.password_hash)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Check if email has been verified
    if not user.is_verified:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "detail": "email_not_verified",
                "error": "email_not_verified",
                "message": "Please verify your email address before logging in."
            }
        )

    # Set session cookie
    set_auth_cookie(response, user.id)

    return {"success": True, "name": user.name}


@router.get("/verify-email", response_model=schemas.GenericMessageResponse)
def verify_email(
    token: str,
    db: Session = Depends(get_db)
):
    """Verify customer email using short-lived token from email link."""
    user_id_str = decode_verification_token(token)
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification link"
        )

    try:
        user_id = uuid.UUID(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification link"
        )

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification link"
        )

    if user.is_verified:
        return {
            "success": True,
            "message": "Email is already verified. You can log in."
        }

    user.is_verified = True
    db.commit()

    return {
        "success": True,
        "message": "Email verified successfully. You can now log in."
    }


@router.post("/resend-verification", response_model=schemas.GenericMessageResponse)
@limiter.limit("5/minute")
def resend_verification(
    request: Request,
    body: schemas.ResendVerificationRequest,
    db: Session = Depends(get_db)
):
    """Resend email verification link.
    Always returns generic success message to prevent account enumeration."""
    clean_email = body.email.lower().strip()
    user = db.query(models.User).filter(models.User.email == clean_email).first()

    if user and not user.is_verified:
        token = create_verification_token(user.id)
        verification_link = f"{settings.FRONTEND_URL}/verify-email.html?token={token}"
        send_verification_email(user.email, user.name, verification_link)
        user.verification_sent_at = datetime.utcnow()
        db.commit()

    return {
        "success": True,
        "message": "If that account exists, we've sent a new link"
    }


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
