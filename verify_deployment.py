#!/usr/bin/env python3
"""
Verification script for Cafe Revenue Management System deployment
This script checks if all necessary files and configurations are in place for deployment.
"""

import os
import sys
from pathlib import Path

def check_file_exists(filepath, description):
    """Check if a file exists and print status"""
    exists = Path(filepath).exists()
    status = "✓" if exists else "✗"
    print(f"{status} {description}: {filepath}")
    return exists

def check_directory_exists(dirpath, description):
    """Check if a directory exists and print status"""
    exists = Path(dirpath).exists()
    status = "✓" if exists else "✗"
    print(f"{status} {description}: {dirpath}")
    return exists

def check_requirements():
    """Check if all required files are present"""
    print("Checking deployment requirements...")
    print("=" * 50)
    
    # Check directories
    dirs_to_check = [
        ("backend", "Backend directory"),
        ("src", "Frontend source directory"),
        ("public", "Public assets directory"),
    ]
    
    all_dirs_exist = True
    for dirpath, description in dirs_to_check:
        if not check_directory_exists(dirpath, description):
            all_dirs_exist = False
    
    # Check files
    files_to_check = [
        ("backend/requirements.txt", "Python requirements"),
        ("backend/wsgi.py", "WSGI entry point"),
        ("backend/cpanel_start.py", "cPanel startup script"),
        ("backend/cpanel_config.py", "cPanel configuration"),
        ("package.json", "Frontend package configuration"),
        ("vite.config.ts", "Vite configuration"),
        ("DEPLOYMENT_GUIDE.md", "Deployment guide"),
    ]
    
    all_files_exist = True
    for filepath, description in files_to_check:
        if not check_file_exists(filepath, description):
            all_files_exist = False
    
    print("\n" + "=" * 50)
    
    if all_dirs_exist and all_files_exist:
        print("✓ All required files and directories are present!")
        print("\nNext steps:")
        print("1. Build the frontend: npm run build")
        print("2. Upload to cPanel")
        print("3. Set up Python application in cPanel")
        print("4. Configure environment variables")
        print("5. Install dependencies")
        return True
    else:
        print("✗ Some required files or directories are missing!")
        print("Please check the missing items above.")
        return False

def main():
    """Main verification function"""
    print("Cafe Revenue Management System - Deployment Verification")
    print("=" * 60)
    
    success = check_requirements()
    
    if success:
        print("\n✓ Ready for deployment!")
        sys.exit(0)
    else:
        print("\n✗ Not ready for deployment!")
        sys.exit(1)

if __name__ == "__main__":
    main()