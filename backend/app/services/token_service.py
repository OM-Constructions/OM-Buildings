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
