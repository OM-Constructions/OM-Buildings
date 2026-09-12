from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hashes a plain text password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    """Verifies a plain text password against a stored hash."""
    return pwd_context.verify(password, password_hash)
