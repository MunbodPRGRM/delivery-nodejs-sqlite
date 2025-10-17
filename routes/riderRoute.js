const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// 1. นำเข้า functions จาก Controller
const { registerRider, loginRider } = require('../controllers/riderController');

// 2. ตั้งค่า Multer สำหรับการอัปโหลดไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // เก็บไฟล์ในโฟลเดอร์ uploads/
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน เช่น profile_pic-1678886400000.jpg
    cb(null, file.fieldname + "-" + Date.now() + ext);
  }
});

const upload = multer({ storage: storage });

// 3. กำหนด Routes
// POST /riders/register -> ใช้ middleware 'upload.fields' ก่อน แล้วจึงเรียก 'registerRider'
router.post("/register", upload.fields([
  { name: "profile_pic", maxCount: 1 },
  { name: "vehicle_pic", maxCount: 1 }
]), registerRider);

// POST /riders/login -> เรียก 'loginRider'
router.post("/login", loginRider);

module.exports = router;