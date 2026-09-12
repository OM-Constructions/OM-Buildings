import os
from typing import List
from pydantic_settings import BaseSettings

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DB_PATH = os.path.join(BACKEND_DIR, "om_buildings.db")

class Settings(BaseSettings):
    PROJECT_NAME: str = "OM Buildings API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "om-buildings-super-secret-jwt-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: List[str] = [
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
