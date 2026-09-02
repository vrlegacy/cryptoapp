from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Auth0
    auth0_domain: str = ""
    auth0_audience: str = ""

    # Database
    database_url: str = ""

    # Redis
    redis_url: str = ""

    # External APIs
    cryptopanic_api_key: str = ""

    # Telegram
    telegram_bot_token: str = ""

    # SMTP
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""

    # App & CORS
    frontend_url: str = ""
    cors_origins: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        if not self.cors_origins:
            return []
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
