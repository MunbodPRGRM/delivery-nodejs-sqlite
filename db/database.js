const sqlite3 = require("sqlite3").verbose();
const DB_SOURCE = "./delivery.db";

const db = new sqlite3.Database(DB_SOURCE, (err) => {
  if (err) {
    console.error("❌ Database connection error:", err.message);
    throw err; // หยุดการทำงานของแอปถ้าต่อ DB ไม่ได้
  } else {
    console.log("✅ Connected to the delivery_app database.");
  }
});

module.exports = db;