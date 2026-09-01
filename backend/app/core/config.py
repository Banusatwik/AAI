import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mechanical Safety & Operations Decision System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database configuration - defaults to SQLite for easy local runs, PostgreSQL for production/docker
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./mechanical_safety.db"
    )
    
    # OpenAI API Key (optional - fallback to deterministic reasoning if not provided)
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o")
    
    # Statistical / Probability Engine Parameters
    MIN_SAMPLE_SIZE_FOR_PROBABILITY: int = 10
    CRITICAL_RISK_THRESHOLD: float = 75.0
    HIGH_RISK_THRESHOLD: float = 50.0
    MODERATE_RISK_THRESHOLD: float = 25.0

    model_config = {
        "case_sensitive": True,
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
