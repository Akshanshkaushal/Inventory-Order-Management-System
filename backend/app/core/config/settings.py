from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Inventory & Order Management API"
    environment: str = Field(default="development")
    database_url: str = Field(default="postgresql+psycopg://postgres:postgres@localhost:5432/inventory")
    secret_key: str = Field(default="change-me-in-production")
    allowed_origins: str = Field(default="http://localhost:5173,http://localhost:3000")
    low_stock_threshold: int = Field(default=10, ge=0)
    rate_limit_default: str = "100/minute"
    rate_limit_write: str = "20/minute"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("database_url")
    @classmethod
    def use_psycopg_driver(cls, value: str) -> str:
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
