"""
WSGI entry point for the Cafe Revenue Management System
This file provides the WSGI callable object for production deployment.
"""

import sys
import os

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the FastAPI app
from app.main import app

# The WSGI callable object is 'app'
# This can be referenced as 'backend.wsgi:app' in production WSGI servers

if __name__ == "__main__":
    # This is for development/testing only
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=9000)