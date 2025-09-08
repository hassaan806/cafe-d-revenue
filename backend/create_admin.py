#!/usr/bin/env python3
"""
Create admin user for the Cafe Revenue Management System
"""

import sqlite3
import hashlib
import secrets

def hash_password(password: str) -> str:
    """Hash password using bcrypt-like method compatible with passlib"""
    # For simplicity, using a basic hash with salt
    # In production, you should use proper bcrypt
    salt = "cafe_revenue_salt_2024"
    return hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()

def create_admin_user():
    # Database path
    db_path = "cafe_revenue.db"
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if admin user already exists
    cursor.execute("SELECT * FROM users WHERE username = 'admin'")
    existing_user = cursor.fetchone()
    
    if existing_user:
        print("✅ Admin user already exists")
        conn.close()
        return
    
    # Create admin user with proper password hash
    username = "admin"
    password = "admin123"
    email = "admin@caferevenue.com"
    role = "admin"
    
    # Generate password hash
    password_hash = hash_password(password)
    
    try:
        cursor.execute("""
            INSERT INTO users (username, email, hashed_password, role, is_active)
            VALUES (?, ?, ?, ?, ?)
        """, (username, email, password_hash, role, True))
        
        conn.commit()
        print(f"✅ Admin user created successfully!")
        print(f"   Username: {username}")
        print(f"   Password: {password}")
        print(f"   Role: {role}")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    create_admin_user()