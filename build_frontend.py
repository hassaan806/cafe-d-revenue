#!/usr/bin/env python3
"""
Frontend build script for Cafe Revenue Management System
This script helps build the frontend for deployment.
"""

import os
import sys
import subprocess
from pathlib import Path

def check_node_installed():
    """Check if Node.js is installed"""
    try:
        result = subprocess.run(['node', '--version'], 
                              capture_output=True, text=True, check=True)
        print(f"✓ Node.js version: {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("✗ Node.js is not installed or not in PATH")
        return False

def check_npm_installed():
    """Check if npm is installed"""
    try:
        result = subprocess.run(['npm', '--version'], 
                              capture_output=True, text=True, check=True)
        print(f"✓ npm version: {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("✗ npm is not installed or not in PATH")
        return False

def install_dependencies():
    """Install frontend dependencies"""
    print("Installing frontend dependencies...")
    try:
        subprocess.run(['npm', 'install'], check=True)
        print("✓ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("✗ Failed to install dependencies")
        return False

def build_frontend():
    """Build the frontend for production"""
    print("Building frontend for production...")
    try:
        subprocess.run(['npm', 'run', 'build'], check=True)
        print("✓ Frontend built successfully")
        print("Frontend files are in the 'dist' directory")
        return True
    except subprocess.CalledProcessError:
        print("✗ Failed to build frontend")
        return False

def main():
    """Main build function"""
    print("Cafe Revenue Management System - Frontend Build")
    print("=" * 50)
    
    # Check prerequisites
    if not check_node_installed():
        print("Please install Node.js to build the frontend")
        sys.exit(1)
    
    if not check_npm_installed():
        print("Please install npm to build the frontend")
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("Failed to install dependencies")
        sys.exit(1)
    
    # Build frontend
    if not build_frontend():
        print("Failed to build frontend")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("✓ Frontend build completed successfully!")
    print("\nNext steps for deployment:")
    print("1. Upload the contents of 'dist' directory to your public HTML folder")
    print("2. Configure your web server to serve these files")
    print("3. Set up API proxy to backend at /api endpoint")

if __name__ == "__main__":
    main()