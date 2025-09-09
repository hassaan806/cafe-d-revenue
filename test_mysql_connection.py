#!/usr/bin/env python3
"""
Test script to verify MySQL database connection
"""

import mysql.connector
import os
from dotenv import load_dotenv

def test_mysql_connection():
    """Test MySQL database connection"""
    try:
        # Load environment variables
        load_dotenv('backend/.env')
        
        # Try to connect to MySQL database
        db_url = os.getenv('DATABASE_URL')
        
        if db_url and db_url.startswith('mysql://'):
            # Parse the DATABASE_URL from .env
            # mysql://user:password@host:port/database
            parts = db_url.split('://')[1]
            user_pass, host_port_db = parts.split('@')
            user, password = user_pass.split(':')
            host_port, database = host_port_db.split('/', 1)
            host, port = host_port.split(':')
            
            conn = mysql.connector.connect(
                host=host,
                port=port,
                database=database,
                user=user,
                password=password
            )
        else:
            # Use the default credentials
            conn = mysql.connector.connect(
                host='localhost',
                port=3306,
                database='cafedrev_database',
                user='cafedrev_cafedrev',
                password='cafedrevenue'
            )
        
        print("✅ Successfully connected to MySQL database!")
        
        # Test a simple query
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        print(f"✅ Database query test successful: {result}")
        
        # Close connections
        cursor.close()
        conn.close()
        
        print("✅ MySQL connection test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ MySQL connection test failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing MySQL database connection...")
    print("=" * 40)
    
    success = test_mysql_connection()
    
    if success:
        print("\n🎉 All tests passed! Your MySQL configuration is correct.")
    else:
        print("\n💥 Tests failed! Please check your MySQL configuration.")