from decouple import config
from typing import List
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to get DATABASE_URL from environment, with fallbacks
try:
    DATABASE_URL = config("DATABASE_URL")
    logger.info(f"Using database URL from environment: {DATABASE_URL}")
except:
    # Fallback to SQLite for development if no DATABASE_URL is set
    DATABASE_URL = "sqlite:///./sql_app.db"
    logger.info("Using default SQLite database")

class Settings:
    # Database configuration - support for MySQL, PostgreSQL, and SQLite
    DATABASE_URL: str = DATABASE_URL
    SECRET_KEY: str = config("SECRET_KEY", default="your-super-secret-key")
    ALGORITHM: str = config("ALGORITHM", default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = config("ACCESS_TOKEN_EXPIRE_MINUTES", default=30, cast=int)
    
    # CORS settings - updated for your domain
    FRONTEND_URL: str = config("FRONTEND_URL", default="https://staging.cafedrev.com")
    ALLOWED_ORIGINS: List[str] = config(
        "ALLOWED_ORIGINS", 
        default="https://staging.cafedrev.com,https://www.staging.cafedrev.com,http://localhost:3010,http://127.0.0.1:3010",
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