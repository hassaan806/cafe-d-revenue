#!/usr/bin/env python3
"""
Script to set up PostgreSQL database for the application
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def parse_database_url():
    """Parse the DATABASE_URL from .env"""
    # Format: postgresql://postgres:hassaan@localhost:5432/cafedrev
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        raise Exception("DATABASE_URL not found in .env file")
    
    # Extract components from the URL
    # postgresql://user:password@host:port/database
    parts = db_url.split('://')[1]
    user_pass, host_port_db = parts.split('@')
    user, password = user_pass.split(':')
    host_port, database = host_port_db.split('/', 1)
    host, port = host_port.split(':')
    
    return {
        'user': user,
        'password': password,
        'host': host,
        'port': port,
        'database': database
    }

def create_database():
    """Create the cafedrev database in PostgreSQL"""
    config = parse_database_url()
    
    # Connect to PostgreSQL server (without specifying database)
    conn = psycopg2.connect(
        host=config['host'],
        port=config['port'],
        user=config['user'],
        password=config['password']
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    # Create database
    try:
        cursor.execute(f"CREATE DATABASE {config['database']}")
        print(f"✅ Database '{config['database']}' created successfully!")
    except psycopg2.errors.DuplicateDatabase:
        print(f"⚠️  Database '{config['database']}' already exists.")
    except Exception as e:
        print(f"❌ Error creating database: {e}")
    finally:
        cursor.close()
        conn.close()

def install_requirements():
    """Install required Python packages"""
    try:
        import subprocess
        import sys
        
        print("Installing required packages...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary"])
        print("✅ psycopg2-binary installed successfully!")
    except Exception as e:
        print(f"❌ Error installing packages: {e}")
        print("Please install manually: pip install psycopg2-binary")

def main():
    """Main function to set up PostgreSQL"""
    print("Setting up PostgreSQL database...")
    
    # Install required packages
    install_requirements()
    
    # Create database
    create_database()
    
    print("\n✅ PostgreSQL setup completed!")
    print("Next steps:")
    print("1. Run 'python migrate_to_postgres.py' to migrate your data")
    print("2. Start your backend server as usual")

if __name__ == "__main__":
    main()