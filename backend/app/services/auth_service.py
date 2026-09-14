import secrets
import hashlib
from email_validator import validate_email, EmailNotValidError
from fastapi import HTTPException, status
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_otp() -> str:
    return f"{secrets.randbelow(900000) + 100000}"  # 6-digit, 100000-999999

def hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()  # OTP is short-lived + attempt-limited, sha256 is fine here

def verify_otp_hash(otp: str, otp_hash: str) -> bool:
    return hashlib.sha256(otp.encode()).hexdigest() == otp_hash

DISPOSABLE_DOMAINS = {
    "mailinator.com",
    "tempmail.com",
    "10minutemail.com",
    "guerrillamail.com",
    "yopmail.com",
    "sharklasers.com",
    "dispostable.com",
    "throwawaymail.com",
    "temp-mail.org",
    "fakeinbox.com",
    "getairmail.com",
    "mytemp.email",
}

def hash_password(password: str) -> str:
    """Hashes a plain text password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    """Verifies a plain text password against a stored hash."""
    return pwd_context.verify(password, password_hash)

def validate_signup_email(email: str) -> str:
    """Validates email format, checks MX records for deliverability,
    and blocks known disposable domains.
    Raises HTTPException(400, 'Please enter a valid email address') without exposing specific reason."""
    email_clean = email.lower().strip()

    # 1. Format & DNS MX deliverability check
    try:
        valid = validate_email(email_clean, check_deliverability=True)
        email_clean = valid.normalized
        domain = valid.domain.lower()
    except EmailNotValidError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid email address"
        )

    # 2. Disposable domain blocklist
    if domain in DISPOSABLE_DOMAINS or any(domain.endswith(f".{d}") for d in DISPOSABLE_DOMAINS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid email address"
        )

    return email_clean
