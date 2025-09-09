"""
WSGI entry point for cPanel deployment
This file provides the WSGI callable object for production deployment on cPanel.
"""

import sys
import os

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the FastAPI app
from app.main import app

# The WSGI callable object is 'app'
# This should be referenced as 'backend.wsgi:app' in cPanel Python application settings

# For local testing
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=9000)
