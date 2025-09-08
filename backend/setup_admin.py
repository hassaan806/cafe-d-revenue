import sqlite3
from passlib.context import CryptContext

# Initialize password context (same as in security.py)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin_user():
    """Create admin user with proper bcrypt password hash"""
    
    # Database path
    db_path = "cafe_revenue.db"
    
    # Admin user details
    username = "admin"
    password = "admin123"
    email = "admin@caferevenue.com"
    role = "admin"
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if admin user already exists
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print("✅ Admin user already exists")
            return
        
        # Hash password using bcrypt (same as security.py)
        hashed_password = pwd_context.hash(password)
        
        # Create admin user
        cursor.execute("""
            INSERT INTO users (username, email, hashed_password, role, is_active) 
            VALUES (?, ?, ?, ?, ?)
        """, (username, email, hashed_password, role, True))
        
        conn.commit()
        print("✅ Admin user created successfully!")
        print(f"   Username: {username}")
        print(f"   Password: {password}")
        print(f"   Email: {email}")
        print(f"   Role: {role}")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
    
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    create_admin_user()