#!/usr/bin/env python3
"""
Script to add admin user to the database
"""

import sqlite3
import os
from passlib.context import CryptContext

# Database file path
db_path = os.path.join(os.path.dirname(__file__), 'backend', 'cafe_revenue.db')
print(f"Database path: {db_path}")

# Password hashing context (same as used in the backend)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Admin user details
admin_username = "admin"
admin_email = "admin@cafedrevenue.com"
admin_password = "admin123"  # Default password, should be changed after first login

# Hash the password using bcrypt (same as backend)
def hash_password(password: str) -> str:
    """Hash password using bcrypt (same as backend)"""
    return pwd_context.hash(password)

try:
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if admin user already exists
    cursor.execute("SELECT id FROM users WHERE username = ?", (admin_username,))
    existing_user = cursor.fetchone()
    
    if existing_user:
        print(f"Admin user '{admin_username}' already exists with ID: {existing_user[0]}")
        # Update the existing admin user
        hashed_password = hash_password(admin_password)
        cursor.execute("""
            UPDATE users 
            SET email = ?, hashed_password = ?, role = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP
            WHERE username = ?
        """, (admin_email, hashed_password, 'admin', admin_username))
        print(f"✅ Admin user '{admin_username}' updated successfully!")
    else:
        # Insert admin user
        hashed_password = hash_password(admin_password)
        cursor.execute("""
            INSERT INTO users (username, email, hashed_password, role, is_active)
            VALUES (?, ?, ?, ?, ?)
        """, (admin_username, admin_email, hashed_password, 'admin', 1))
        user_id = cursor.lastrowid
        print(f"✅ Admin user '{admin_username}' created successfully with ID: {user_id}")
    
    # Commit changes
    conn.commit()
    conn.close()
    
    print("\n✅ Admin user setup completed successfully!")
    print(f"Login credentials:")
    print(f"  Username: {admin_username}")
    print(f"  Password: {admin_password}")
    print("\n⚠️  Please change the password after first login for security!")
    
except Exception as e:
    print(f"❌ Error setting up admin user: {e}")