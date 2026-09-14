import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app import models, schemas
from app.config import settings
from app.services.auth_service import (
    hash_password,
    verify_password,
    validate_signup_email,
    generate_otp,
    hash_otp,
    verify_otp_hash,
)
from app.services.token_service import (
    create_access_token,
    decode_access_token,
)
from app.services.email_service import send_otp_email

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

COOKIE_NAME = "access_token"
COOKIE_MAX_AGE = settings.ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60


def get_current_user(request: Request, db: Session = Depends(get_db)) -> models.User:
    """Dependency that extracts the logged-in user from the httpOnly session cookie
    OR Authorization Bearer header. Raises 401 if unauthenticated or session is invalid."""
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()

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
    """Dependency that returns the current user if a valid session cookie exists or Bearer token is provided, or None."""
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()

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


def is_expired(expires_at: Optional[datetime]) -> bool:
    if not expires_at:
        return True
    now = datetime.now(expires_at.tzinfo) if expires_at.tzinfo else datetime.utcnow()
    return expires_at < now


def set_auth_cookie(response: Response, user_id: Any, request: Optional[Request] = None) -> str:
    """Helper to issue a signed JWT access token in an httpOnly cookie and return the token string."""
    token = create_access_token(user_id)
    # Check if request is HTTPS or running in production behind a proxy (like Render)
    is_secure = False
    if request:
        proto = request.headers.get("x-forwarded-proto", "")
        scheme = getattr(request.url, "scheme", "")
        is_secure = scheme == "https" or proto == "https"
    else:
        is_secure = settings.FRONTEND_URL.startswith("https://")

    # In modern browsers, cross-site cookies between Vercel and Render require SameSite=None and Secure=True
    samesite_val = "none" if is_secure else "lax"
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite=samesite_val,
        secure=is_secure,
        path="/"
    )
    return token


@router.post("/signup", response_model=schemas.SignupResponse)
@limiter.limit("5/minute")
def signup(
    request: Request,
    body: schemas.UserSignup,
    db: Session = Depends(get_db)
):
    """Register a customer account with MX and disposable domain validation.
    Generates a 6-digit OTP expiring in 5 minutes and sends via email."""
    # 1. Format, MX DNS deliverability, and disposable domain checks
    clean_email = validate_signup_email(body.email)

    # 2. Check password length
    if len(body.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )

    # 3. Check if email is already registered
    existing_user = db.query(models.User).filter(models.User.email == clean_email).first()
    if existing_user:
        if not existing_user.is_verified:
            # Re-generate fresh OTP and allow unverified user to complete verification
            otp = generate_otp()
            now = datetime.now(timezone.utc)
            existing_user.name = body.name.strip()
            existing_user.password_hash = hash_password(body.password)
            existing_user.otp_hash = hash_otp(otp)
            existing_user.otp_expires_at = now + timedelta(minutes=5)
            existing_user.otp_attempts = 0
            db.commit()
            delivered = False
            try:
                delivered = send_otp_email(existing_user.email, existing_user.name, otp)
            except Exception as err:
                print(f"[SIGNUP RESEND OTP ERROR]: {err}")
                delivered = False
            return {
                "success": True,
                "message": "Enter the code sent to your email",
                "email": clean_email
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists. Please log in."
            )

    # 4. Create new user with is_verified = False and hashed 5-minute OTP
    otp = generate_otp()
    password_hash = hash_password(body.password)
    now = datetime.now(timezone.utc)
    new_user = models.User(
        name=body.name.strip(),
        email=clean_email,
        password_hash=password_hash,
        is_verified=False,
        otp_hash=hash_otp(otp),
        otp_expires_at=now + timedelta(minutes=5),
        otp_attempts=0
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 5. Send OTP via email (safe, non-crashing)
    delivered = False
    try:
        delivered = send_otp_email(new_user.email, new_user.name, otp)
    except Exception as err:
        print(f"[SIGNUP OTP EMAIL ERROR]: {err}")
        delivered = False

    return {
        "success": True,
        "message": "Enter the code sent to your email",
        "email": clean_email
    }


@router.post("/verify-otp", response_model=schemas.AuthSuccessResponse)
@limiter.limit("10/minute")
def verify_otp(
    request: Request,
    response: Response,
    body: schemas.VerifyOtpRequest,
    db: Session = Depends(get_db)
):
    """Verify 6-digit OTP and establish session cookie on success."""
    clean_email = body.email.lower().strip()
    user = db.query(models.User).filter(models.User.email == clean_email).first()

    # 1. User lookup, verified check, null hash check
    if not user or user.is_verified or not user.otp_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired code"
        )

    # 2. Check expiration
    if is_expired(user.otp_expires_at):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code expired, request a new one"
        )

    # 3. Check attempts threshold (max 5)
    if user.otp_attempts >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts, request a new code"
        )

    # 4. Compare hash
    if not verify_otp_hash(body.otp.strip(), str(user.otp_hash)):
        user.otp_attempts += 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired code"
        )

    # 5. On match: activate account and log in
    user.is_verified = True
    user.otp_hash = None
    user.otp_expires_at = None
    user.otp_attempts = 0
    user.last_login_at = datetime.utcnow()
    db.commit()

    # Set session cookie (log them in) and obtain token
    token = set_auth_cookie(response, user.id, request)

    return {"success": True, "name": user.name, "token": token}


@router.post("/resend-otp", response_model=schemas.GenericMessageResponse)
@limiter.limit("1/minute")
def resend_otp(
    request: Request,
    body: schemas.ResendOtpRequest,
    db: Session = Depends(get_db)
):
    """Resend 6-digit OTP. Rate-limited to 1 request per 60 seconds per IP.
    Always returns generic message to prevent account enumeration."""
    clean_email = body.email.lower().strip()
    user = db.query(models.User).filter(models.User.email == clean_email).first()

    delivered = False
    otp_val = None
    if user and not user.is_verified:
        otp_val = generate_otp()
        user.otp_hash = hash_otp(otp_val)
        now = datetime.now(timezone.utc)
        user.otp_expires_at = now + timedelta(minutes=5)
        user.otp_attempts = 0
        db.commit()
        try:
            delivered = send_otp_email(user.email, user.name, otp_val)
        except Exception as err:
            print(f"[RESEND OTP DISPATCH ERROR]: {err}")
            delivered = False

    return {
        "success": True,
        "message": "If that account exists, a new code has been sent"
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

    # Record last login timestamp
    user.last_login_at = datetime.utcnow()
    db.commit()

    # Set session cookie and obtain token
    token = set_auth_cookie(response, user.id, request)

    return {"success": True, "name": user.name, "token": token}


@router.post("/logout")
def logout(request: Request, response: Response):
    """Clear session cookie."""
    proto = request.headers.get("x-forwarded-proto", "")
    scheme = getattr(request.url, "scheme", "")
    is_secure = scheme == "https" or proto == "https" or settings.FRONTEND_URL.startswith("https://")
    samesite_val = "none" if is_secure else "lax"
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        httponly=True,
        samesite=samesite_val,
        secure=is_secure
    )
    return {"success": True, "message": "Logged out successfully"}


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    """Return currently logged-in user profile or 401 if unauthenticated."""
    return {"name": current_user.name, "email": current_user.email}
