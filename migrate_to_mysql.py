#!/usr/bin/env python3
"""
Script to migrate data from SQLite to MySQL
"""

import sqlite3
import mysql.connector
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def get_mysql_connection():
    """Create MySQL connection"""
    # Parse the DATABASE_URL from .env or use provided credentials
    # Format: mysql://username:password@host:port/database
    db_url = os.getenv('DATABASE_URL')
    
    if db_url and db_url.startswith('mysql://'):
        # Extract components from the URL
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
        # Use the provided credentials
        conn = mysql.connector.connect(
            host='localhost',
            port=3306,
            database='cafedrev_database',
            user='cafedrev_cafedrev',
            password='cafedrevenue'
        )
    
    return conn

def create_mysql_tables():
    """Create tables in MySQL database"""
    conn = get_mysql_connection()
    cursor = conn.cursor()
    
    # Create tables
    create_tables_sql = """
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'salesman',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price FLOAT NOT NULL,
        stock INT DEFAULT 0,
        image_url VARCHAR(255),
        category_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id)
    );

    CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) UNIQUE,
        address TEXT,
        card_number VARCHAR(50) UNIQUE,
        rfid_no VARCHAR(50) UNIQUE,
        balance FLOAT DEFAULT 0.0,
        card_discount FLOAT DEFAULT 0.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        total_price FLOAT NOT NULL,
        payment_method VARCHAR(20) NOT NULL,
        is_settled BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        room_no VARCHAR(50),
        customer_id INT,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
    );

    CREATE TABLE IF NOT EXISTS sale_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price FLOAT NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
    );

    CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id INT NOT NULL,
        amount FLOAT NOT NULL,
        payment_method VARCHAR(20) NOT NULL,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales (id)
    );

    CREATE TABLE IF NOT EXISTS recharge_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
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
    print("✅ MySQL tables created successfully!")

def migrate_data():
    """Migrate data from SQLite to MySQL"""
    # Connect to SQLite database
    sqlite_conn = sqlite3.connect('backend/cafe_revenue.db')
    sqlite_cursor = sqlite_conn.cursor()
    
    # Connect to MySQL database
    mysql_conn = get_mysql_connection()
    mysql_cursor = mysql_conn.cursor()
    
    try:
        # Migrate users table
        sqlite_cursor.execute("SELECT id, username, email, hashed_password, role, is_active, created_at, updated_at FROM users")
        users = sqlite_cursor.fetchall()
        for user in users:
            # Convert is_active from integer to boolean
            user_data = list(user)
            user_data[5] = bool(user_data[5])  # Convert is_active to boolean
            mysql_cursor.execute("""
                INSERT INTO users (id, username, email, hashed_password, role, is_active, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    username = VALUES(username),
                    email = VALUES(email),
                    hashed_password = VALUES(hashed_password),
                    role = VALUES(role),
                    is_active = VALUES(is_active),
                    created_at = VALUES(created_at),
                    updated_at = VALUES(updated_at)
            """, user_data)
        print(f"✅ Migrated {len(users)} users")
        
        # Migrate categories table
        sqlite_cursor.execute("SELECT id, name, created_at, updated_at FROM categories")
        categories = sqlite_cursor.fetchall()
        for category in categories:
            mysql_cursor.execute("""
                INSERT INTO categories (id, name, created_at, updated_at)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    created_at = VALUES(created_at),
                    updated_at = VALUES(updated_at)
            """, category)
        print(f"✅ Migrated {len(categories)} categories")
        
        # Migrate customers table
        sqlite_cursor.execute("SELECT id, name, phone, address, card_number, rfid_no, balance, card_discount, created_at, updated_at FROM customers")
        customers = sqlite_cursor.fetchall()
        for customer in customers:
            mysql_cursor.execute("""
                INSERT INTO customers (id, name, phone, address, card_number, rfid_no, balance, card_discount, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    phone = VALUES(phone),
                    address = VALUES(address),
                    card_number = VALUES(card_number),
                    rfid_no = VALUES(rfid_no),
                    balance = VALUES(balance),
                    card_discount = VALUES(card_discount),
                    created_at = VALUES(created_at),
                    updated_at = VALUES(updated_at)
            """, customer)
        print(f"✅ Migrated {len(customers)} customers")
        
        # Migrate products table
        sqlite_cursor.execute("SELECT id, name, description, price, stock, image_url, category_id, created_at, updated_at FROM products")
        products = sqlite_cursor.fetchall()
        for product in products:
            mysql_cursor.execute("""
                INSERT INTO products (id, name, description, price, stock, image_url, category_id, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    description = VALUES(description),
                    price = VALUES(price),
                    stock = VALUES(stock),
                    image_url = VALUES(image_url),
                    category_id = VALUES(category_id),
                    created_at = VALUES(created_at),
                    updated_at = VALUES(updated_at)
            """, product)
        print(f"✅ Migrated {len(products)} products")
        
        # Migrate sales table
        sqlite_cursor.execute("SELECT id, total_price, payment_method, is_settled, timestamp, room_no, customer_id FROM sales")
        sales = sqlite_cursor.fetchall()
        for sale in sales:
            # Convert is_settled from integer to boolean
            sale_data = list(sale)
            sale_data[3] = bool(sale_data[3])  # Convert is_settled to boolean
            mysql_cursor.execute("""
                INSERT INTO sales (id, total_price, payment_method, is_settled, timestamp, room_no, customer_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    total_price = VALUES(total_price),
                    payment_method = VALUES(payment_method),
                    is_settled = VALUES(is_settled),
                    timestamp = VALUES(timestamp),
                    room_no = VALUES(room_no),
                    customer_id = VALUES(customer_id)
            """, sale_data)
        print(f"✅ Migrated {len(sales)} sales")
        
        # Migrate sale_items table
        sqlite_cursor.execute("SELECT id, sale_id, product_id, quantity, price FROM sale_items")
        sale_items = sqlite_cursor.fetchall()
        for item in sale_items:
            mysql_cursor.execute("""
                INSERT INTO sale_items (id, sale_id, product_id, quantity, price)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    sale_id = VALUES(sale_id),
                    product_id = VALUES(product_id),
                    quantity = VALUES(quantity),
                    price = VALUES(price)
            """, item)
        print(f"✅ Migrated {len(sale_items)} sale items")
        
        # Migrate payments table
        sqlite_cursor.execute("SELECT id, sale_id, amount, payment_method, payment_date FROM payments")
        payments = sqlite_cursor.fetchall()
        for payment in payments:
            mysql_cursor.execute("""
                INSERT INTO payments (id, sale_id, amount, payment_method, payment_date)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    sale_id = VALUES(sale_id),
                    amount = VALUES(amount),
                    payment_method = VALUES(payment_method),
                    payment_date = VALUES(payment_date)
            """, payment)
        print(f"✅ Migrated {len(payments)} payments")
        
        # Migrate recharge_transactions table
        sqlite_cursor.execute("SELECT id, customer_id, amount, recharge_date FROM recharge_transactions")
        recharges = sqlite_cursor.fetchall()
        for recharge in recharges:
            mysql_cursor.execute("""
                INSERT INTO recharge_transactions (id, customer_id, amount, recharge_date)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    customer_id = VALUES(customer_id),
                    amount = VALUES(amount),
                    recharge_date = VALUES(recharge_date)
            """, recharge)
        print(f"✅ Migrated {len(recharges)} recharge transactions")
        
        # Commit changes
        mysql_conn.commit()
        print("✅ All data migrated successfully!")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        import traceback
        traceback.print_exc()
        mysql_conn.rollback()
    finally:
        # Close connections
        sqlite_conn.close()
        mysql_cursor.close()
        mysql_conn.close()

def main():
    """Main function to create tables and migrate data"""
    print("Starting migration from SQLite to MySQL...")
    
    # Create MySQL tables
    create_mysql_tables()
    
    # Migrate data
    migrate_data()
    
    print("\n✅ Migration completed successfully!")
    print("You can now use MySQL as your database.")

if __name__ == "__main__":
    main()