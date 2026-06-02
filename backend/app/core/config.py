from pydantic_settings import BaseSettings
from typing import Optional
import os

# Caminho absoluto baseado neste arquivo
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/linkvault"

    # App
    DEBUG: bool = False
    SECRET_KEY: str = "your-secret-key-change-in-production"
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    MAX_FILE_SIZE_MB: int = 50

    # LLM providers
    ANTHROPIC_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    DEFAULT_LLM_PROVIDER: str = "anthropic"  # anthropic | openai | ollama

    # Models
    ANTHROPIC_MODEL: str = "claude-sonnet-4-20250514"
    OPENAI_MODEL: str = "gpt-4o-mini"
    OLLAMA_MODEL: str = "llama3.2"

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
