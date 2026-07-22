"""Настройки приложения. Все секреты — из .env (см. .env.example в корне)."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")

    database_url: str = "postgresql+psycopg://optika:optika_dev_pass@localhost:5432/optika"
    jwt_secret: str = "CHANGE_ME_IN_ENV"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 30
    refresh_token_days: int = 14
    invite_ttl_hours: int = 72
    frontend_origin: str = "http://localhost:5173"

    seed_admin_email: str = "admin@optika.app"  # .local не пройдёт email-валидацию
    seed_admin_password: str = "CHANGE_ME_IN_ENV"
    seed_admin_name: str = "Суперадмин"


settings = Settings()
