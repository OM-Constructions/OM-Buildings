import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Union, Dict, Any
from jose import jwt, JWTError
from app.config import settings

def create_access_token(user_id: Union[str, uuid.UUID], expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token for the given user_id."""
    if expires_delta is not None:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)

    payload: Dict[str, Any] = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }

    encoded_jwt = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT access token. Returns payload dict or None if invalid/expired."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

def create_verification_token(user_id: Any) -> str:
    """Create a short-lived signed JWT for email verification (expires in 24 hours)."""
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.VERIFICATION_TOKEN_EXPIRE_HOURS)
    payload: Dict[str, Any] = {
        "sub": str(user_id),
        "purpose": "verify_email",
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_verification_token(token: str) -> Optional[str]:
    """Decode and validate an email verification token.
    Ensures purpose is 'verify_email' and token is not expired.
    Returns user_id string on success, or None on failure."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("purpose") != "verify_email":
            return None
        return payload.get("sub")
    except JWTError:
        return None
