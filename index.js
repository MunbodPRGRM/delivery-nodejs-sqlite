// 1. Import dependencies ที่จำเป็น
const express = require('express');
const sqlite3 = require('sqlite3').verbose(); // .verbose() เพื่อให้ได้ error message ที่ละเอียดขึ้น

// 2. ตั้งค่า Express App
const app = express();
const PORT = process.env.PORT || 3000; // กำหนด Port ของเซิร์ฟเวอร์

// 3. เชื่อมต่อฐานข้อมูล SQLite
// ระบบจะสร้างไฟล์ delivery.db ขึ้นมาเองถ้ายังไม่มี
const db = new sqlite3.Database('./delivery.db', (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {
        console.log("Connected to the SQLite database.");
        // (เราจะใส่คำสั่งสร้างตารางต่างๆ ที่นี่ในภายหลัง)
    }
});

// 4. สร้าง API Endpoint สำหรับทดสอบ
// เมื่อเข้า http://localhost:3000/ จะเห็นข้อความนี้
app.get('/', (req, res) => {
    res.json({ message: "Welcome to Delivery App API!" });
});

// 5. สั่งให้เซิร์ฟเวอร์เริ่มทำงาน
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});