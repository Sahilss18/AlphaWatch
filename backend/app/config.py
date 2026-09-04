from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List
import os

class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://root:Resets18%26@localhost:3306/signal_watch"
    MARKET_API_KEY: str = "dad6j4pr01qt1ophoucgdad6j4pr01qt1ophoud0"
    MARKET_API_URL: str = "https://finnhub.io/api/v1"
    FRONTEND_URL: str = "http://localhost:5173"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    ENVIRONMENT: str = "development"
    DEMO_USER_ID: str = "demo-user-001"
    STALE_THRESHOLD_SECONDS: int = 900  # 15 minutes
    
    # Allowed CORS origins
    @property
    def cors_origins(self) -> List[str]:
        origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
        ]
        if self.FRONTEND_URL and self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        return origins

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

@lru_cache()
def get_settings() -> Settings:
    return Settings()
