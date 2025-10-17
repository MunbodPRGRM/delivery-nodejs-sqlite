-- USERS
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    profile_pic TEXT
);

-- ADDRESSES (ผู้ใช้มีหลายที่อยู่ได้)
CREATE TABLE addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    address TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- RIDERS
CREATE TABLE riders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    profile_pic TEXT,
    vehicle_pic TEXT,
    plate_number TEXT
);

CREATE TABLE deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    receiver_address_id INTEGER NOT NULL,
    rider_id INTEGER,
    status INTEGER DEFAULT 1,  -- 1: waiting, 2: rider accepted, 3: picked up, 4: delivered
    item_description TEXT,
    
    -- รูปประกอบตามสถานะ
    photo_status1 TEXT,   -- รอไรเดอร์มารับสินค้า
    photo_status3 TEXT,   -- ไรเดอร์รับสินค้าแล้วและกำลังไปส่ง
    photo_status4 TEXT,   -- ไรเดอร์นำส่งสินค้าแล้ว

    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (receiver_address_id) REFERENCES addresses(id),
    FOREIGN KEY (rider_id) REFERENCES riders(id)
);

-- RIDER LOCATIONS (อัปเดตตำแหน่งแบบ real-time)
CREATE TABLE rider_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rider_id INTEGER NOT NULL,
    latitude REAL,
    longitude REAL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rider_id) REFERENCES riders(id)
);
