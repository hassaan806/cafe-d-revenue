from decouple import config
from typing import List

class Settings:
    # Database configuration - support for MySQL, PostgreSQL, and SQLite
    DATABASE_URL: str = config("DATABASE_URL", default="mysql://cafedrev_cafedrev:cafedrevenue@localhost:3306/cafedrev_database")
    SECRET_KEY: str = config("SECRET_KEY", default="your-super-secret-key")
    ALGORITHM: str = config("ALGORITHM", default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = config("ACCESS_TOKEN_EXPIRE_MINUTES", default=30, cast=int)
    
    # CORS settings - updated for your domain
    FRONTEND_URL: str = config("FRONTEND_URL", default="https://staging.cafedrev.com")
    ALLOWED_ORIGINS: List[str] = config(
        "ALLOWED_ORIGINS", 
        default="https://staging.cafedrev.com,https://www.staging.cafedrev.com",
        cast=lambda v: [i.strip() for i in v.split(',')]
    )
    
    # App settings
    APP_NAME: str = "Cafe Revenue Management API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = config("DEBUG", default=False, cast=bool)
    LOG_LEVEL: str = config("LOG_LEVEL", default="INFO")
    
    # SMS settings
    SMS_API_KEY: str = config("SMS_API_KEY", default="")
    SMS_SENDER_ID: str = config("SMS_SENDER_ID", default="")
    SMS_API_URL: str = config("SMS_API_URL", default="")

settings = Settings()