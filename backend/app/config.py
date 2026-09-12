import os
from typing import List, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DB_PATH = os.path.join(BACKEND_DIR, "om_buildings.db")

class Settings(BaseSettings):
    PROJECT_NAME: str = "OM Buildings API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "om-buildings-super-secret-jwt-key-change-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+psycopg2://", 1)
        if v.startswith("postgresql://") and not v.startswith("postgresql+"):
            return v.replace("postgresql://", "postgresql+psycopg2://", 1)
        return v
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7
    VERIFICATION_TOKEN_EXPIRE_HOURS: int = 24
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:8000")
    FRONTEND_ORIGIN: Optional[str] = os.getenv("FRONTEND_ORIGIN", None)
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "5"))

    # Email provider settings
    EMAIL_PROVIDER: str = os.getenv("EMAIL_PROVIDER", "resend")
    RESEND_API_KEY: Optional[str] = os.getenv("RESEND_API_KEY", None)
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "enquiries@yourdomain.com")
    EMAIL_TO: str = os.getenv("EMAIL_TO", "leads@yourcompany.com")
    GMAIL_APP_PASSWORD: Optional[str] = os.getenv("GMAIL_APP_PASSWORD", None)
    
    CORS_ORIGINS: List[str] = [
        "https://om-buildings.vercel.app",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
