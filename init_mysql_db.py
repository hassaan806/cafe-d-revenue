#!/usr/bin/env python3
"""
MySQL Database Initialization Script
This script will create all database tables and insert initial customer data with zero balance.
"""

import mysql.connector
import os

def get_mysql_connection():
    """Create MySQL connection with the provided credentials"""
    conn = mysql.connector.connect(
        host='localhost',
        port=3306,
        database='cafedrev_database',
        user='cafedrev_cafedrev',
        password='cafedrevenue'
    )
    return conn

# Create tables SQL for MySQL
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

# Customer data with balance set to 0
customers = [
    ('Shahzad Sb. (R 523)', '3229168124', None, '1124007', '0005399265', 0, 0.0),
    ('Saira Khan (R 119)', '3335433456', None, '1124001', '0005418939', 0, 0.0),
    ('Awais Mustafa (R 128)', '3202590347', None, '1124024', '0005450933', 0, 0.0),
    ('LOGISTIC', '3348288825', None, '1124033', '0005462104', 0, 0.0),
    ('Shaoor Javaid Alvi ( R 277B )', '3004247992', None, '1124028', '0005242138', 0, 0.0),
    ('Shafqat Niazi (R 206)', '3045183706', None, '1124029', '0005465739', 0, 0.0),
    ('Adeel Ahmad Chaudhary (R 01)', '3215187503', None, '1124009', '0005430966', 0, 0.0),
    ('Ali Asad (R 533)', '3168882211', None, '1124010', '0005389132', 0, 0.0),
    ('Muhammad Adnan Shujaat (R 105)', '3335104280', None, '1124023', '0005458773', 0, 0.0),
    ('Romesa Tahir', '3345336003', None, '1124030', '0005441403', 0, 0.0),
    ('Tanvir M. Niaz (R 577)', '3205000477', None, '1124038', '0005223667', 0, 0.0),
    ('Angel David (R 403)', '3225130127', None, '1124022', '0005277235', 0, 0.0),
    ('Minza Raza (Day Care)', '3342106620', None, '1124021', '0005348703', 0, 0.0),
    ('Khawaja Qasim (R 459)', '3165790671', None, '1124039', '0005254874', 0, 0.0),
    ('Tajamal Bilquis (R 403)', '3335335865', None, '1124040', '0005410857', 0, 0.0),
    ('Afnan Khan (R 224)', '3008002149', None, '1124037', '0005380242', 0, 0.0),
    ('Sajjad Hassan (R-321)', '3455205979', None, '1124036', '0005404819', 0, 0.0),
    ('Fazli Shakoor (R-203)', '3028000123', None, '1124035', '0005476662', 0, 0.0),
    ('Kiran Butt (R- Library)', '3369957900', None, '1124034', '0005398443', 0, 0.0),
    ('Kashmala Tahseen (R-251)', '3319351371', None, '1124032', '0005305152', 0, 0.0),
    ('Hurib Sepoy (Reception) CARD RETURNED', '3195729850', None, '1124033 OLD', None, 0, 0.0),
    ('Saleem Raza (R-24)', '3015524441', None, '1124045', '0005403958', 0, 0.0),
    ('Waqas Mehmood (R 314)', '3335398496', None, '1124047', '0005244018', 0, 0.0),
    ('Haleema Qasim', '3334845846', None, '0824002', '0005734311', 0, 0.0),
    ('Shafkat Rasool (R 569)', '3338101000', None, '1124044', '0005421118', 0, 0.0),
    ('Sidra Shafiq (R-568)', '3355188859', None, '1124043', '0005394202', 0, 0.0),
    ('Ali khan (R-126)', '3419680080', None, '1124042', '0005500467', 0, 0.0),
    ('Madiha Mobin', '3343047956', None, '1124041', '0005265693', 0, 0.0),
    ('Saad (R 270)', '3035508283', None, '1124049', '0005406159', 0, 0.0),
    ('Arafat Faiz Rasool (R 470)', '3333060898', None, '1124046', '0005403952', 0, 0.0),
    ('Rehmatullah Khan', '3455061372', None, '1124050', '0005471283', 0, 0.0),
    ('Fahim Ullah Khan (R 221)', '3459797995', None, '0824036', '0010186105', 0, 0.0),
    ('Shahid Jan (R 114)', '3343232977', None, '0824003', '0005734433', 0, 0.0),
    ('Shahzaib (R 259)', '3435032235', None, '0824037', '0005737599', 0, 0.0),
    ('Mohib Khan (R 332)', '3379211115', None, '0824004', '0005743246', 0, 0.0),
    ('Haneen Saif (R 403)', '3361866500', None, '1124048', '0005447607', 0, 0.0),
    ('Aroma Shah (R 12)', '3335487738', None, '0824001', '0005743407', 0, 0.0),
    ('Bela Khan ( R 522 )', '3463594101', None, '0824006', '0009238463', 0, 0.0),
    ('Secy. Expenditure (R 141)', '3425025501', None, '0824043', '0005736233', 0, 0.0),
    ('Akbar Jan ( R 331)', '3125555555', None, '0824044', '0009352691', 0, 0.0),
    ('Mustafiz ur Rehman (R 507)', '3335233988', None, '0824035', '0009356292', 0, 0.0),
    ('Anisa Altaf ( R 519 )', '3331913043', None, '0824005', '0005514429', 0, 0.0),
    ('Dr. Najeeb Ahmad (R 355)', '3322197114', None, '0824046', '0005740515', 0, 0.0),
    ('Asif Rasool (R 441)', '3235113329', None, '0824047', '0005740962', 0, 0.0),
    ('Sajid Baloch (R 200)', '3353455030', None, '0824045', '0009352714', 0, 0.0),
    ('Wajahat Mir (R 400A)', '33343323312', None, '1124031', '0005378890', 0, 0.0),
    ('Abdul Rehman (R 146)', '3345312212', None, '0824040', '0005740402', 0, 0.0),
    ('Haroon Waqar Malik (R 114)', '3002716116', None, '0824039', '0005740304', 0, 0.0),
    ('Shagufta Kunal (R-219) dec-10-24 gave card back', '3115365094', None, '0824035', None, 0, 0.0),
    ('CHIEF A & F (R 560)', '3425025501', None, '08240334', '0005731177', 0, 0.0),
    ('Taimur ( CR 400)', '3123383990', None, '0824033', '0005736142', 0, 0.0),
    ('Rana Imtiaz (R 512)', '3005286151', None, '0824032', '0005740919', 0, 0.0),
    ('Zanib Mahmood (R 533)', '3029201010', None, '0824038', '0009352758', 0, 0.0),
    ('Mohsin Ali (R 225)', '3315794929', None, '0824049', '0005740686', 0, 0.0),
    ('Muhammad Imtiaz Khan (R 148)', '3359013862', None, '0824008', '0009238489', 0, 0.0),
    ('Ijaz Hussain (R 64)', '3312111035', None, '0824009', '0009238414', 0, 0.0),
    ('Atiqa Khan (R 20)', '3361007874', None, '0824010', '0009238379', 0, 0.0),
    ('Rashid Javaid Rana (R 05)', '3239999113', None, '0824029', '0008243514', 0, 0.0),
    ('Waqas Ahmed Langah (R 19)', '3009542889', None, '0824028', '0008961517', 0, 0.0),
    ('Farid Ahmed Khan (R 222)', '3105365423', None, '0824027', '0005740548', 0, 0.0),
    ('PRAL IT', '3428195029', None, '0824026', '0005734410', 0, 0.0),
    ('Muhammad Afaq (R 418)', '3490050364', None, '0824007', '0009231184', 0, 0.0),
    ('Ihsan Marwat (R 225)', '3130916537', None, '0824024', '0005735221', 0, 0.0),
    ('Zakir Muhammad (R 200)', '3339719085', None, '0824023', '0005736416', 0, 0.0),
    ('Muhammad Siddique (R 221)', '3005208710', None, '0824022', '0005740910', 0, 0.0),
    ('Zara (B 15)', '3488161633', None, '0824031', '0009202813', 0, 0.0),
    ('Masood Akhtar (R 118)', '3333039334', None, '0824030', '0008247957', 0, 0.0),
    ('Sajid Ahmed (R 505)', '333780773', None, '0824021', '0009221351', 0, 0.0),
    ('Qasim Alvi (R 277)', '3005140032', None, '0824020', '0008248012', 0, 0.0),
    ('Hasina Gull', '3335101072', None, '0824019', '0008260762', 0, 0.0),
    ('Dr. Nasir Khan', '3452113648', None, '0824042', '0005486489', 0, 0.0),
    ('Usman Ahmed (R 119)', '3425065071', None, '0824017', '0005737683', 0, 0.0),
    ('Sial Sb (R 529)', '3425025501', None, '0824016', '0010229521', 0, 0.0),
    ('Zara Farooq (R 156)', '3215784332', None, '0824015', '0005514430', 0, 0.0),
    ('Mazhar Riaz', '3456777177', None, '0824014', '0007181959', 0, 0.0),
    ('Muhammad Hannan', '3455105000', None, '0724001', '0008257160', 0, 0.0),
    ('Saad Atta Rabbani (R 133)', '3004421194', None, '0824013', '0005514420', 0, 0.0),
    ('Zaheer Qureshi (R 402) PostPaid', '3020677250', None, '0824011', '0009353513', 0, 0.0),
    ('Sec Admn (R 506)', '3425025501', None, '0824012', '0005512558', 0, 0.0),
    ('Cash', None, None, None, '123', 0, 0.0)
]

try:
    # Connect to MySQL database
    conn = get_mysql_connection()
    cursor = conn.cursor()
    
    # Create tables
    print("Creating MySQL database tables...")
    statements = create_tables_sql.split(';')
    for statement in statements:
        statement = statement.strip()
        if statement:
            try:
                cursor.execute(statement)
            except Exception as e:
                print(f"Warning: {e}")
    print("✅ MySQL database tables created successfully!")
    
    # Insert customers
    print("Inserting customers with zero balance...")
    inserted_count = 0
    for customer in customers:
        try:
            cursor.execute("""
                INSERT INTO customers (name, phone, address, card_number, rfid_no, balance, card_discount) 
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, customer)
            inserted_count += 1
        except mysql.connector.Error as e:
            if e.errno == 1062:  # Duplicate entry
                print(f"Skipping duplicate customer: {customer[0]}")
            else:
                print(f"Error inserting customer {customer[0]}: {e}")
        except Exception as e:
            print(f"Error inserting customer {customer[0]}: {e}")
    
    # Commit changes
    conn.commit()
    conn.close()
    
    print(f"✅ Successfully inserted {inserted_count} customers with balance 0")
    print("\n✅ MySQL database initialization completed successfully!")
    print("You can now start the backend server with: cd backend && python start_backend.py")
    
except Exception as e:
    print(f"❌ Error initializing MySQL database: {e}")