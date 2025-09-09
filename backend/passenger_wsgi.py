"""
passenger_wsgi.py for cPanel Python application deployment
This file is required by cPanel to start the Python application.
"""

import sys
import os

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the FastAPI app
from app.main import app

# cPanel expects a variable named 'application' for WSGI
application = app

# For local development/testing
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "passenger_wsgi:application",
        host="127.0.0.1",
        port=9000,
        reload=False  # Disable reload for production
    )