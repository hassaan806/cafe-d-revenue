#!/usr/bin/env python3
"""
Script to migrate data from SQLite to PostgreSQL
"""

import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def get_postgres_connection():
    """Create PostgreSQL connection"""
    # Parse the DATABASE_URL from .env
    # Format: postgresql://postgres:hassaan@localhost:5432/cafedrev
    db_url = os.getenv('DATABASE_URL')
    # Extract components from the URL
    # postgresql://user:password@host:port/database
    parts = db_url.split('://')[1]
    user_pass, host_port_db = parts.split('@')
    user, password = user_pass.split(':')
    host_port, database = host_port_db.split('/', 1)
    host, port = host_port.split(':')
    
    conn = psycopg2.connect(
        host=host,
        port=port,
        database=database,
        user=user,
        password=password
    )
    return conn

def create_postgres_tables():
    """Create tables in PostgreSQL database"""
    conn = get_postgres_connection()
    cursor = conn.cursor()
    
    # Create tables
    create_tables_sql = """
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'salesman',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price FLOAT NOT NULL,
        stock INTEGER DEFAULT 0,
        image_url VARCHAR(255),
        category_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id)
    );

    CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) UNIQUE,
        address TEXT,
        card_number VARCHAR(50) UNIQUE,
        rfid_no VARCHAR(50) UNIQUE,
        balance FLOAT DEFAULT 0.0,
        card_discount FLOAT DEFAULT 0.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        total_price FLOAT NOT NULL,
        payment_method VARCHAR(20) NOT NULL,
        is_settled BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        room_no VARCHAR(50),
        customer_id INTEGER,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
    );

    CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price FLOAT NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
    );

    CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL,
        amount FLOAT NOT NULL,
        payment_method VARCHAR(20) NOT NULL,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales (id)
    );

    CREATE TABLE IF NOT EXISTS recharge_transactions (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        amount FLOAT NOT NULL,
        recharge_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
    );
    """
    
    # Split and execute each statement
    statements = create_tables_sql.split(';')
    for statement in statements:
        statement = statement.strip()
        if statement:
            try:
                cursor.execute(statement)
            except Exception as e:
                print(f"Warning: {e}")
    
    conn.commit()
    cursor.close()
    conn.close()
    print("✅ PostgreSQL tables created successfully!")

def migrate_data():
    """Migrate data from SQLite to PostgreSQL"""
    # Connect to SQLite database
    sqlite_conn = sqlite3.connect('backend/cafe_revenue.db')
    sqlite_cursor = sqlite_conn.cursor()
    
    # Connect to PostgreSQL database
    postgres_conn = get_postgres_connection()
    postgres_cursor = postgres_conn.cursor()
    
    try:
        # Migrate users table
        sqlite_cursor.execute("SELECT id, username, email, hashed_password, role, is_active, created_at, updated_at FROM users")
        users = sqlite_cursor.fetchall()
        for user in users:
            # Convert is_active from integer to boolean
            user_data = list(user)
            user_data[5] = bool(user_data[5])  # Convert is_active to boolean
            postgres_cursor.execute("""
                INSERT INTO users (id, username, email, hashed_password, role, is_active, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    username = EXCLUDED.username,
                    email = EXCLUDED.email,
                    hashed_password = EXCLUDED.hashed_password,
                    role = EXCLUDED.role,
                    is_active = EXCLUDED.is_active,
                    created_at = EXCLUDED.created_at,
                    updated_at = EXCLUDED.updated_at
            """, user_data)
        print(f"✅ Migrated {len(users)} users")
        
        # Migrate categories table
        sqlite_cursor.execute("SELECT id, name, created_at, updated_at FROM categories")
        categories = sqlite_cursor.fetchall()
        for category in categories:
            postgres_cursor.execute("""
                INSERT INTO categories (id, name, created_at, updated_at)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    created_at = EXCLUDED.created_at,
                    updated_at = EXCLUDED.updated_at
            """, category)
        print(f"✅ Migrated {len(categories)} categories")
        
        # Migrate customers table
        sqlite_cursor.execute("SELECT id, name, phone, address, card_number, rfid_no, balance, card_discount, created_at, updated_at FROM customers")
        customers = sqlite_cursor.fetchall()
        for customer in customers:
            postgres_cursor.execute("""
                INSERT INTO customers (id, name, phone, address, card_number, rfid_no, balance, card_discount, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    phone = EXCLUDED.phone,
                    address = EXCLUDED.address,
                    card_number = EXCLUDED.card_number,
                    rfid_no = EXCLUDED.rfid_no,
                    balance = EXCLUDED.balance,
                    card_discount = EXCLUDED.card_discount,
                    created_at = EXCLUDED.created_at,
                    updated_at = EXCLUDED.updated_at
            """, customer)
        print(f"✅ Migrated {len(customers)} customers")
        
        # Migrate products table
        sqlite_cursor.execute("SELECT id, name, description, price, stock, image_url, category_id, created_at, updated_at FROM products")
        products = sqlite_cursor.fetchall()
        for product in products:
            postgres_cursor.execute("""
                INSERT INTO products (id, name, description, price, stock, image_url, category_id, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    price = EXCLUDED.price,
                    stock = EXCLUDED.stock,
                    image_url = EXCLUDED.image_url,
                    category_id = EXCLUDED.category_id,
                    created_at = EXCLUDED.created_at,
                    updated_at = EXCLUDED.updated_at
            """, product)
        print(f"✅ Migrated {len(products)} products")
        
        # Migrate sales table
        sqlite_cursor.execute("SELECT id, total_price, payment_method, is_settled, timestamp, room_no, customer_id FROM sales")
        sales = sqlite_cursor.fetchall()
        for sale in sales:
            # Convert is_settled from integer to boolean
            sale_data = list(sale)
            sale_data[3] = bool(sale_data[3])  # Convert is_settled to boolean
            postgres_cursor.execute("""
                INSERT INTO sales (id, total_price, payment_method, is_settled, timestamp, room_no, customer_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    total_price = EXCLUDED.total_price,
                    payment_method = EXCLUDED.payment_method,
                    is_settled = EXCLUDED.is_settled,
                    timestamp = EXCLUDED.timestamp,
                    room_no = EXCLUDED.room_no,
                    customer_id = EXCLUDED.customer_id
            """, sale_data)
        print(f"✅ Migrated {len(sales)} sales")
        
        # Migrate sale_items table
        sqlite_cursor.execute("SELECT id, sale_id, product_id, quantity, price FROM sale_items")
        sale_items = sqlite_cursor.fetchall()
        for item in sale_items:
            postgres_cursor.execute("""
                INSERT INTO sale_items (id, sale_id, product_id, quantity, price)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    sale_id = EXCLUDED.sale_id,
                    product_id = EXCLUDED.product_id,
                    quantity = EXCLUDED.quantity,
                    price = EXCLUDED.price
            """, item)
        print(f"✅ Migrated {len(sale_items)} sale items")
        
        # Migrate payments table
        sqlite_cursor.execute("SELECT id, sale_id, amount, payment_method, payment_date FROM payments")
        payments = sqlite_cursor.fetchall()
        for payment in payments:
            postgres_cursor.execute("""
                INSERT INTO payments (id, sale_id, amount, payment_method, payment_date)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    sale_id = EXCLUDED.sale_id,
                    amount = EXCLUDED.amount,
                    payment_method = EXCLUDED.payment_method,
                    payment_date = EXCLUDED.payment_date
            """, payment)
        print(f"✅ Migrated {len(payments)} payments")
        
        # Migrate recharge_transactions table
        sqlite_cursor.execute("SELECT id, customer_id, amount, recharge_date FROM recharge_transactions")
        recharges = sqlite_cursor.fetchall()
        for recharge in recharges:
            postgres_cursor.execute("""
                INSERT INTO recharge_transactions (id, customer_id, amount, recharge_date)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    customer_id = EXCLUDED.customer_id,
                    amount = EXCLUDED.amount,
                    recharge_date = EXCLUDED.recharge_date
            """, recharge)
        print(f"✅ Migrated {len(recharges)} recharge transactions")
        
        # Commit changes
        postgres_conn.commit()
        print("✅ All data migrated successfully!")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        import traceback
        traceback.print_exc()
        postgres_conn.rollback()
    finally:
        # Close connections
        sqlite_conn.close()
        postgres_cursor.close()
        postgres_conn.close()

def main():
    """Main function to create tables and migrate data"""
    print("Starting migration from SQLite to PostgreSQL...")
    
    # Create PostgreSQL tables
    create_postgres_tables()
    
    # Migrate data
    migrate_data()
    
    print("\n✅ Migration completed successfully!")
    print("You can now use PostgreSQL as your database.")

if __name__ == "__main__":
    main()