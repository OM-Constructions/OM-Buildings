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

    # Email configuration (SMTP)
    EMAIL_PROVIDER: str = os.getenv("EMAIL_PROVIDER", "smtp")
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "465"))
    SMTP_USER: str = os.getenv("SMTP_USER", os.getenv("EMAIL_FROM", "omengineeringconsultants06@gmail.com"))
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD", os.getenv("SMTP_PASS", os.getenv("GMAIL_APP_PASSWORD", None)))
    SMTP_PASS: Optional[str] = SMTP_PASSWORD
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "omengineeringconsultants06@gmail.com")
    ENQUIRY_RECEIVER_EMAIL: str = os.getenv("ENQUIRY_RECEIVER_EMAIL", os.getenv("COMPANY_NOTIFICATION_EMAIL", os.getenv("EMAIL_TO", "omengineeringconsultants06@gmail.com")))
    COMPANY_NOTIFICATION_EMAIL: str = ENQUIRY_RECEIVER_EMAIL
    EMAIL_TO: str = ENQUIRY_RECEIVER_EMAIL
    GMAIL_APP_PASSWORD: Optional[str] = SMTP_PASSWORD
    RESEND_API_KEY: Optional[str] = os.getenv("RESEND_API_KEY", None)
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY", None)
    ASSISTANT_MODEL: str = os.getenv("ASSISTANT_MODEL", "claude-haiku-4-5-20251001")
    
    CORS_ORIGINS: List[str] = [
        "https://om-buildings.vercel.app",
        "https://om-buildings-rust.vercel.app",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ]

    class Config:
        env_file = (os.path.join(BACKEND_DIR, ".env"), ".env")
        extra = "ignore"

settings = Settings()
