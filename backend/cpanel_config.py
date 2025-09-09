"""
cPanel configuration for Cafe Revenue Management System
This file contains settings specific to cPanel deployment.
"""

import os

# cPanel-specific settings
class CPanelConfig:
    # Application settings
    APP_MODULE = "passenger_wsgi"
    CALLABLE = "application"
    
    # Server settings
    HOST = "127.0.0.1"
    PORT = int(os.environ.get("PORT", 9000))
    
    # Worker settings for Gunicorn (if used)
    WORKERS = int(os.environ.get("WORKERS", 1))
    THREADS = int(os.environ.get("THREADS", 1))
    
    # Timeout settings
    TIMEOUT = int(os.environ.get("TIMEOUT", 30))
    
    # Logging
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "info")
    
    # Database - configured for MySQL
    DATABASE_URL = os.environ.get("DATABASE_URL", "mysql://cafedrev_cafedrev:cafedrevenue@localhost:3306/cafedrev_database")
    
    # Security
    SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key")
    DEBUG = os.environ.get("DEBUG", "False").lower() == "true"

# For cPanel WSGI application
from passenger_wsgi import application

# This is what cPanel will look for
app = application