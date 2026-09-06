from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 12
    cors_origins: str = "http://localhost:3000,http://localhost:3001"
    pending_payment_expiry_minutes: int = 15
    # Cookies require Secure to be sent over HTTPS; browsers make an exception for
    # http://localhost, so this can stay True in local dev too. Set False only for
    # a non-localhost, non-HTTPS deployment.
    cookie_secure: bool = True
    # No Razorpay (or other gateway) keys are wired up yet — these stub endpoints
    # fake a successful payment/refund. Must be false before real money moves.
    payments_stub_mode: bool = True

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
