import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "OM Buildings API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./om_buildings.db")
    
    class Config:
        env_file = ".env"

settings = Settings()
