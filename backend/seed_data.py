import sqlite3
import random
from pathlib import Path
from datetime import datetime, timedelta

def get_db_path():
    from backend.config import DB_PATH
    p = Path(DB_PATH)
    p.parent.mkdir(parents=True, exist_ok=True)
    return str(p)

def seed_mysql():
    import pymysql
    from backend.config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
    
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False
    )
    cur = conn.cursor()

    cur.execute("SET FOREIGN_KEY_CHECKS = 0;")
    for tbl in ["reviews", "order_items", "orders", "products", "users"]:
        cur.execute(f"DROP TABLE IF EXISTS `{tbl}`;")
    cur.execute("SET FOREIGN_KEY_CHECKS = 1;")

    cur.execute("""
    CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        hired_at DATE,
        country VARCHAR(100) NOT NULL,
        created_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    cur.execute("""
    CREATE TABLE products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock_quantity INT NOT NULL,
        sku VARCHAR(100) UNIQUE NOT NULL,
        created_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    cur.execute("""
    CREATE TABLE orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        order_date DATETIME NOT NULL,
        status VARCHAR(50) NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        shipping_city VARCHAR(100) NOT NULL,
        created_at DATETIME NOT NULL,
        CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    cur.execute("""
    CREATE TABLE order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
        CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    cur.execute("""
    CREATE TABLE reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        user_id INT NOT NULL,
        rating INT NOT NULL,
        comment TEXT,
        created_at DATETIME NOT NULL,
        CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
        CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    # If SQLite database exists with data, migrate from it directly to ensure perfect parity
    sqlite_p = Path(get_db_path())
    if sqlite_p.exists() and sqlite_p.stat().st_size > 0:
        sq_conn = sqlite3.connect(str(sqlite_p))
        sq_conn.row_factory = sqlite3.Row
        sq_cur = sq_conn.cursor()

        for tbl, insert_cols in [
            ("users", ["id", "name", "email", "role", "department", "hired_at", "country", "created_at"]),
            ("products", ["id", "name", "category", "price", "stock_quantity", "sku", "created_at"]),
            ("orders", ["id", "customer_id", "order_date", "status", "total_amount", "shipping_city", "created_at"]),
            ("order_items", ["id", "order_id", "product_id", "quantity", "unit_price", "subtotal"]),
            ("reviews", ["id", "product_id", "user_id", "rating", "comment", "created_at"]),
        ]:
            sq_cur.execute(f"SELECT * FROM `{tbl}` ORDER BY id ASC;")
            rows = sq_cur.fetchall()
            if rows:
                col_names = ", ".join([f"`{c}`" for c in insert_cols])
                placeholders = ", ".join([f"%({c})s" for c in insert_cols])
                cur.executemany(f"INSERT INTO `{tbl}` ({col_names}) VALUES ({placeholders});", [dict(r) for r in rows])
        sq_conn.close()
    
    conn.commit()

    counts = {}
    for tbl in ["users", "products", "orders", "order_items", "reviews"]:
        cur.execute(f"SELECT COUNT(*) AS cnt FROM `{tbl}`;")
        counts[tbl] = cur.fetchone()["cnt"]

    conn.close()
    return counts

def seed_database(db_path=None):
    from backend.config import DB_TYPE
    if DB_TYPE == "mysql" and db_path is None:
        return seed_mysql()

    if db_path is None:
        db_path = get_db_path()

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Enable foreign keys
    cur.execute("PRAGMA foreign_keys = ON;")

    # Drop existing tables cleanly
    cur.execute("DROP TABLE IF EXISTS reviews;")
    cur.execute("DROP TABLE IF EXISTS order_items;")
    cur.execute("DROP TABLE IF EXISTS orders;")
    cur.execute("DROP TABLE IF EXISTS products;")
    cur.execute("DROP TABLE IF EXISTS users;")

    # 1. users table
    cur.execute("""
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        department TEXT NOT NULL,
        hired_at TEXT,
        country TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    # 2. products table
    cur.execute("""
    CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        stock_quantity INTEGER NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    # 3. orders table
    cur.execute("""
    CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        order_date TEXT NOT NULL,
        status TEXT NOT NULL,
        total_amount REAL NOT NULL,
        shipping_city TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """)

    # 4. order_items table
    cur.execute("""
    CREATE TABLE order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );
    """)

    # 5. reviews table
    cur.execute("""
    CREATE TABLE reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
        comment TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """)

    random.seed(42)

    # -------------------------------------------------------------
    # Seeding USERS (70 rows)
    # Realistic names, departments, roles, and hire dates
    # -------------------------------------------------------------
    first_names = [
        "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
        "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
        "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
        "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
        "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
        "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa",
        "Edward", "Deborah", "Ronald", "Stephanie", "Timothy", "Rebecca", "Jason", "Sharon",
        "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy",
        "Nicholas", "Shirley", "Eric", "Angela", "Jonathan", "Helen"
    ]
    last_names = [
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
        "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
        "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
        "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
        "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
        "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
        "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker"
    ]
    countries = ["United States", "United Kingdom", "Canada", "Germany", "India", "Australia", "France", "Japan"]
    cities = ["New York", "San Francisco", "London", "Toronto", "Berlin", "Sydney", "Paris", "Tokyo", "Chicago", "Austin"]

    user_data = []
    # Seed 25 engineering employees (some hired <= 2022, some > 2022)
    engineering_roles = [
        "Senior Software Engineer", "Backend Developer", "Frontend Engineer",
        "Fullstack Engineer", "DevOps Engineer", "QA Engineer", "Engineering Manager"
    ]

    for i in range(70):
        fn = first_names[i % len(first_names)]
        ln = last_names[(i * 3 + 7) % len(last_names)]
        name = f"{fn} {ln}"
        email = f"{fn.lower()}.{ln.lower()}{i+1}@example.com"
        country = countries[i % len(countries)]
        created_at = (datetime(2024, 1, 1) + timedelta(days=i * 12)).strftime("%Y-%m-%d %H:%M:%S")

        if i < 24:
            # Engineering department
            dept = "Engineering"
            role = engineering_roles[i % len(engineering_roles)]
            # Alternate hire dates before and after 2022
            if i % 2 == 0:
                # After 2022
                hire_year = random.choice([2023, 2024, 2025])
                hire_month = random.randint(1, 12)
                hire_day = random.randint(1, 28)
                hired_at = f"{hire_year}-{hire_month:02d}-{hire_day:02d}"
            else:
                # 2022 or earlier
                hire_year = random.choice([2019, 2020, 2021, 2022])
                hire_month = random.randint(1, 12)
                hire_day = random.randint(1, 28)
                hired_at = f"{hire_year}-{hire_month:02d}-{hire_day:02d}"
        elif i < 35:
            dept = "Sales"
            role = random.choice(["Sales Representative", "Account Executive", "Sales Manager"])
            hired_at = f"{random.choice([2021, 2022, 2023, 2024])}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}"
        elif i < 45:
            dept = "Marketing"
            role = random.choice(["Marketing Specialist", "Content Strategist", "SEO Analyst"])
            hired_at = f"{random.choice([2020, 2022, 2023, 2024])}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}"
        elif i < 52:
            dept = "Customer Support"
            role = random.choice(["Support Agent", "Customer Success Specialist"])
            hired_at = f"{random.choice([2021, 2023, 2024, 2025])}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}"
        else:
            dept = "General"
            role = "Customer"
            hired_at = None

        user_data.append((name, email, role, dept, hired_at, country, created_at))

    cur.executemany("""
    INSERT INTO users (name, email, role, department, hired_at, country, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?);
    """, user_data)

    # -------------------------------------------------------------
    # Seeding PRODUCTS (60 rows)
    # Including several with stock_quantity = 0 (out of stock)
    # -------------------------------------------------------------
    product_specs = [
        ("MacBook Pro 16\"", "Electronics", 2499.00, 15, "ELEC-MBP16"),
        ("Dell XPS 15 Laptop", "Electronics", 1799.00, 22, "ELEC-XPS15"),
        ("Apple iPad Air 11\"", "Electronics", 599.00, 30, "ELEC-IPADAIR"),
        ("Sony WH-1000XM5 Headphones", "Audio", 399.00, 45, "AUD-XM5"),
        ("Bose QuietComfort 45", "Audio", 329.00, 0, "AUD-QC45-OOS"),  # OUT OF STOCK
        ("AirPods Pro 2", "Audio", 249.00, 85, "AUD-APP2"),
        ("Logitech MX Master 3S Mouse", "Accessories", 99.99, 120, "ACC-MXM3S"),
        ("Keychron Q1 Pro Mechanical Keyboard", "Accessories", 199.00, 18, "ACC-KQ1P"),
        ("LG 27\" 4K UltraFine Monitor", "Electronics", 449.00, 0, "ELEC-LG27-OOS"),  # OUT OF STOCK
        ("Samsung 34\" Odyssey Curved Monitor", "Electronics", 799.99, 12, "ELEC-SAM34"),
        ("Anker 737 Power Bank (24,000mAh)", "Accessories", 149.99, 65, "ACC-ANK737"),
        ("CalDigit TS4 Thunderbolt Dock", "Accessories", 399.95, 8, "ACC-TS4"),
        ("Herman Miller Aeron Chair", "Office", 1395.00, 10, "OFF-AERON"),
        ("Autonomous SmartDesk Pro", "Office", 699.00, 0, "OFF-SDPRO-OOS"),  # OUT OF STOCK
        ("Steelcase Gesture Office Chair", "Office", 1250.00, 7, "OFF-GESTURE"),
        ("Sony PlayStation 5 Console", "Gaming", 499.99, 0, "GAM-PS5-OOS"),  # OUT OF STOCK
        ("Nintendo Switch OLED", "Gaming", 349.99, 40, "GAM-SWOLED"),
        ("Xbox Wireless Controller", "Gaming", 59.99, 90, "GAM-XBCTRL"),
        ("Apple Watch Series 10", "Wearables", 399.00, 50, "WEAR-AWS10"),
        ("Garmin Fenix 7 Sapphire Solar", "Wearables", 799.99, 0, "WEAR-FENIX-OOS"), # OUT OF STOCK
        ("Fitbit Charge 6 Fitness Tracker", "Wearables", 159.95, 75, "WEAR-FC6"),
        ("Kindle Paperwhite 16GB", "Electronics", 149.99, 110, "ELEC-KPW16"),
        ("Ember Temperature Control Smart Mug", "Office", 129.95, 34, "OFF-EMBMUG"),
        ("Elgato Stream Deck MK.2", "Accessories", 149.99, 28, "ACC-STREAMDECK"),
        ("Blue Yeti USB Microphone", "Audio", 129.99, 0, "AUD-YETI-OOS"), # OUT OF STOCK
        ("Razer BlackShark V2 Pro Headset", "Audio", 199.99, 32, "AUD-RZV2"),
        ("SanDisk Extreme 1TB Portable SSD", "Accessories", 109.99, 140, "ACC-SD1TB"),
        ("Samsung T7 Shield 2TB SSD", "Accessories", 189.99, 60, "ACC-T72TB"),
        ("Belkin 3-in-1 MagSafe Wireless Charger", "Accessories", 149.99, 0, "ACC-BELK31-OOS"), # OUT OF STOCK
        ("Roost V3 Laptop Stand", "Office", 89.95, 55, "OFF-ROOST"),
        ("BenQ ScreenBar Monitor Light", "Office", 109.00, 42, "OFF-BENQBAR"),
        ("Fujifilm X-T5 Mirrorless Camera", "Electronics", 1699.00, 6, "ELEC-FUJIXT5"),
        ("Sony Alpha 7 IV Camera Body", "Electronics", 2498.00, 0, "ELEC-A7IV-OOS"), # OUT OF STOCK
        ("Sigma 24-70mm f/2.8 DG DN Lens", "Electronics", 1099.00, 9, "ELEC-SIG2470"),
        ("Rode Wireless PRO Mic System", "Audio", 399.00, 16, "AUD-RODEPRO"),
        ("Peak Design Everyday Backpack 20L", "Accessories", 279.95, 25, "ACC-PDBP20"),
        ("Bellroy Tech Kit Organizer", "Accessories", 59.00, 80, "ACC-BELTECH"),
        ("Osprey Farpoint 40 Travel Pack", "Accessories", 185.00, 35, "ACC-OSPF40"),
        ("Audio-Technica AT2020USB-X", "Audio", 149.00, 48, "AUD-AT2020"),
        ("Shure SM7B Vocal Microphone", "Audio", 399.00, 20, "AUD-SM7B"),
        ("Focusrite Scarlett 2i2 4th Gen", "Audio", 199.99, 38, "AUD-SCAR2I2"),
        ("Logitech Brio 4K Webcam", "Accessories", 169.99, 62, "ACC-BRIO4K"),
        ("Insta360 Link 4K AI Gimbal Webcam", "Accessories", 299.99, 14, "ACC-IN360"),
        ("ASUS ROG Swift 27\" OLED Monitor", "Electronics", 899.99, 0, "ELEC-ROG27-OOS"), # OUT OF STOCK
        ("Secretlab TITAN Evo Gaming Chair", "Office", 549.00, 19, "OFF-SECRETTITAN"),
        ("Govee RGBIC LED Strip Lights 16.4ft", "Accessories", 34.99, 150, "ACC-GOVEE16"),
        ("Philips Hue White & Color Ambiance 4-Pack", "Office", 199.99, 44, "OFF-HUE4PK"),
        ("Anker MagGo Wireless Power Bank", "Accessories", 69.99, 95, "ACC-MAGGO"),
        ("Theragun Prime Massage Gun", "Wearables", 299.00, 21, "WEAR-THERA"),
        ("Oura Ring Gen 3 Horizon", "Wearables", 349.00, 0, "WEAR-OURA-OOS"), # OUT OF STOCK
        ("Whoop 4.0 Activity Band", "Wearables", 239.00, 33, "WEAR-WHOOP4"),
        ("Sonos Move 2 Portable Speaker", "Audio", 449.00, 17, "AUD-MOVE2"),
        ("JBL Flip 6 Waterproof Speaker", "Audio", 129.95, 105, "AUD-JBLFLIP6"),
        ("Marshall Stanmore III Bluetooth Speaker", "Audio", 379.99, 15, "AUD-STAN3"),
        ("Tile Pro 4-Pack Bluetooth Tracker", "Accessories", 99.99, 70, "ACC-TILE4"),
        ("Apple AirTag 4-Pack", "Accessories", 99.00, 130, "ACC-AIRTAG4"),
        ("Western Digital 12TB Elements Desktop Drive", "Accessories", 229.99, 24, "ACC-WD12TB"),
        ("UGREEN Revodok 10-in-1 USB-C Hub", "Accessories", 59.99, 88, "ACC-UG10IN1"),
        ("Fellow Ode Gen 2 Coffee Grinder", "Office", 345.00, 11, "OFF-ODEG2"),
        ("Moccamaster KBGV Select Coffee Maker", "Office", 359.00, 14, "OFF-MOCCA")
    ]

    products_data = []
    base_prod_date = datetime(2024, 2, 1)
    for idx, (pname, cat, price, stock, sku) in enumerate(product_specs):
        pdate = (base_prod_date + timedelta(days=idx * 7)).strftime("%Y-%m-%d %H:%M:%S")
        products_data.append((pname, cat, price, stock, sku, pdate))

    cur.executemany("""
    INSERT INTO products (name, category, price, stock_quantity, sku, created_at)
    VALUES (?, ?, ?, ?, ?, ?);
    """, products_data)

    # -------------------------------------------------------------
    # Seeding ORDERS (85 rows)
    # With distinct order dates:
    # 25 orders placed in the last 30 days (satisfies "orders placed in the last 30 days")
    # 60 orders placed earlier in 2026/2025
    # -------------------------------------------------------------
    order_statuses = ["Delivered", "Delivered", "Delivered", "Processing", "Shipped", "Pending", "Cancelled"]
    now = datetime(2026, 11, 12, 11, 0, 0)
    
    orders_data = []
    # Assign specific top spending customers for realistic aggregation
    # Customer IDs 1, 3, 7, 12, 18 will be high-volume spenders
    vip_customer_ids = [1, 3, 7, 12, 18, 22, 29]

    for order_id in range(1, 86):
        if order_id <= 28:
            # Last 30 days (from 1 to 29 days ago)
            days_ago = random.randint(1, 29)
            order_date = (now - timedelta(days=days_ago, hours=random.randint(1, 23))).strftime("%Y-%m-%d %H:%M:%S")
        else:
            # Earlier orders (35 to 450 days ago)
            days_ago = random.randint(35, 450)
            order_date = (now - timedelta(days=days_ago, hours=random.randint(1, 23))).strftime("%Y-%m-%d %H:%M:%S")

        # VIP customers get more frequent orders
        if random.random() < 0.45:
            customer_id = random.choice(vip_customer_ids)
        else:
            customer_id = random.randint(1, 70)

        status = random.choice(order_statuses)
        city = random.choice(cities)
        created_at = order_date
        # Total amount will be computed after adding order items, initially placeholder
        orders_data.append((customer_id, order_date, status, 0.0, city, created_at))

    cur.executemany("""
    INSERT INTO orders (customer_id, order_date, status, total_amount, shipping_city, created_at)
    VALUES (?, ?, ?, ?, ?, ?);
    """, orders_data)

    # -------------------------------------------------------------
    # Seeding ORDER_ITEMS (180+ rows)
    # And updating orders.total_amount accordingly
    # -------------------------------------------------------------
    order_items_data = []
    order_totals = {oid: 0.0 for oid in range(1, 86)}

    # Fetch product prices
    cur.execute("SELECT id, price FROM products;")
    prod_price_map = dict(cur.fetchall())

    for order_id in range(1, 86):
        # 1 to 4 distinct items per order
        num_items = random.randint(1, 4)
        chosen_products = random.sample(list(prod_price_map.keys()), num_items)
        for pid in chosen_products:
            qty = random.randint(1, 3)
            unit_price = prod_price_map[pid]
            subtotal = round(unit_price * qty, 2)
            order_items_data.append((order_id, pid, qty, unit_price, subtotal))
            order_totals[order_id] += subtotal

    cur.executemany("""
    INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
    VALUES (?, ?, ?, ?, ?);
    """, order_items_data)

    # Update orders with calculated totals
    for order_id, total in order_totals.items():
        cur.execute("UPDATE orders SET total_amount = ? WHERE id = ?;", (round(total, 2), order_id))

    # -------------------------------------------------------------
    # Seeding REVIEWS (65 rows)
    # Ratings 1-5 with realistic feedback
    # -------------------------------------------------------------
    reviews_sample = [
        (5, "Exceptional quality! Exceeded my expectations in every aspect."),
        (5, "Best purchase I made this year. High performance and very sleek design."),
        (4, "Great product overall. Setup took slightly longer than expected but works like a charm."),
        (4, "Solid build quality and reliable performance. Would definitely recommend to colleagues."),
        (3, "Decent value for money. Does the job, but missing a few advanced features."),
        (2, "Not quite as advertised. Found a few software quirks right out of the box."),
        (1, "Disappointed with battery life and customer service response time."),
        (5, "Fast shipping, pristine packaging, and fantastic performance!"),
        (4, "Very satisfied. Good ergonomics and durable materials."),
        (5, "A game changer for my daily workflow. Worth every penny.")
    ]

    reviews_data = []
    base_rev_date = datetime(2025, 6, 1)
    for r_idx in range(65):
        pid = random.randint(1, 60)
        uid = random.randint(1, 70)
        rating, template = random.choice(reviews_sample)
        rdate = (base_rev_date + timedelta(days=r_idx * 7)).strftime("%Y-%m-%d %H:%M:%S")
        reviews_data.append((pid, uid, rating, template, rdate))

    cur.executemany("""
    INSERT INTO reviews (product_id, user_id, rating, comment, created_at)
    VALUES (?, ?, ?, ?, ?);
    """, reviews_data)

    conn.commit()

    # Verify counts
    counts = {}
    for tbl in ["users", "products", "orders", "order_items", "reviews"]:
        cur.execute(f"SELECT COUNT(*) FROM {tbl};")
        counts[tbl] = cur.fetchone()[0]

    conn.close()
    return counts

if __name__ == "__main__":
    counts = seed_database()
    print("Database seeded successfully with realistic data:")
    for tbl, cnt in counts.items():
        print(f"  - {tbl}: {cnt} rows")
