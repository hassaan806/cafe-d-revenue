"""
cPanel startup script for Cafe Revenue Management System
This script is designed to work with cPanel's Python application setup.
"""

import os
import sys
from app.main import app

# cPanel expects a variable named 'application' for WSGI
application = app

if __name__ == "__main__":
    # This section is for local development/testing
    import uvicorn
    
    # Get port from environment variable or default to 9000
    port = int(os.environ.get("PORT", 9000))
    
    print(f"Starting Cafe Revenue Management System backend on port {port}...")
    print("Documentation available at http://127.0.0.1:9000/docs")
    
    uvicorn.run(
        "cpanel_start:application",
        host="127.0.0.1",
        port=port,
        reload=False  # Disable reload for production
    )