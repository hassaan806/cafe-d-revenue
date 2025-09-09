#!/bin/bash
# Startup script for Cafe Revenue Management System backend

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Install dependencies
pip install -r requirements.txt

# Start the application
python start_backend.py
