#!/usr/bin/env python3
"""
Deployment script for Cafe Revenue Management System on cPanel
This script helps prepare the application for deployment on cPanel with Python app support.
"""

import os
import sys
import json
import shutil
from pathlib import Path

def create_deployment_structure():
    """Create the necessary directory structure for cPanel deployment"""
    print("Creating deployment structure...")
    
    # Create deployment directory if it doesn't exist
    deployment_dir = Path("deployment")
    deployment_dir.mkdir(exist_ok=True)
    
    # Create logs directory
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)
    
    # Create static directory for frontend build
    static_dir = Path("static")
    static_dir.mkdir(exist_ok=True)
    
    print("✓ Deployment structure created")

def update_requirements_txt():
    """Ensure requirements.txt has all necessary dependencies"""
    print("Updating requirements.txt...")
    
    requirements_path = Path("backend/requirements.txt")
    if requirements_path.exists():
        with open(requirements_path, 'r') as f:
            content = f.read()
        
        # Ensure all required packages are present
        required_packages = [
            'fastapi==0.104.1',
            'uvicorn[standard]==0.24.0',
            'python-multipart==0.0.6',
            'python-jose[cryptography]==3.3.0',
            'passlib[bcrypt]==1.7.4',
            'python-decouple==3.8',
            'sqlalchemy==2.0.23',
            'alembic==1.12.1',
            'psycopg2-binary==2.9.9'
        ]
        
        # Check if each package is in the file
        updated_content = content
        for package in required_packages:
            if package not in content:
                updated_content += f"\n{package}"
        
        with open(requirements_path, 'w') as f:
            f.write(updated_content)
        
        print("✓ requirements.txt updated")
    else:
        print("✗ requirements.txt not found")

def create_cpanel_wsgi():
    """Create or update the WSGI file for cPanel deployment"""
    print("Creating cPanel WSGI configuration...")
    
    wsgi_content = '''"""
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
'''
    
    wsgi_path = Path("backend/wsgi.py")
    with open(wsgi_path, 'w') as f:
        f.write(wsgi_content)
    
    print("✓ cPanel WSGI configuration created")

def create_startup_script():
    """Create a startup script for the backend"""
    print("Creating startup script...")
    
    startup_content = '''#!/bin/bash
# Startup script for Cafe Revenue Management System backend

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Install dependencies
pip install -r requirements.txt

# Start the application
python start_backend.py
'''
    
    startup_path = Path("backend/start.sh")
    with open(startup_path, 'w') as f:
        f.write(startup_content)
    
    # Make it executable
    os.chmod(startup_path, 0o755)
    
    print("✓ Startup script created")

def create_env_example():
    """Create an example environment file"""
    print("Creating environment example file...")
    
    env_content = '''# Environment variables for Cafe Revenue Management System
# Copy this to .env and customize for your environment

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/databasename

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS settings
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com

# Development settings
DEBUG=False
LOG_LEVEL=INFO

# SMS settings (replace with actual values from your SMS provider)
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=your_sender_id
SMS_API_URL=your_sms_api_url
'''
    
    env_path = Path(".env.example")
    with open(env_path, 'w') as f:
        f.write(env_content)
    
    print("✓ Environment example file created")

def main():
    """Main deployment preparation function"""
    print("Preparing Cafe Revenue Management System for cPanel deployment...")
    print("=" * 60)
    
    try:
        create_deployment_structure()
        update_requirements_txt()
        create_cpanel_wsgi()
        create_startup_script()
        create_env_example()
        
        print("\n" + "=" * 60)
        print("✓ Deployment preparation completed successfully!")
        print("\nNext steps for cPanel deployment:")
        print("1. Upload the entire project to your cPanel account")
        print("2. In cPanel, go to 'Setup Python App'")
        print("3. Create a new application with:")
        print("   - Application root: path/to/backend")
        print("   - Application URL: /api (or your preferred endpoint)")
        print("   - Application startup file: wsgi.py")
        print("   - Entry point: app")
        print("4. Install dependencies: pip install -r requirements.txt")
        print("5. Set environment variables in cPanel")
        print("6. Build frontend: npm run build")
        print("7. Upload frontend build to public HTML directory")
        print("8. Configure web server to serve frontend and proxy API requests")
        
    except Exception as e:
        print(f"\n✗ Error during deployment preparation: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()