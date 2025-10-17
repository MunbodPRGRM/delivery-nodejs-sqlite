const express = require("express");
const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

const router = express.Router();

// 1. นำเข้า functions จาก controller
const { uploadFile, getFile } = require("../controllers/uploadController");

// 2. ตั้งค่าการอัปโหลด (ส่วนนี้ถือเป็น configuration ของ route)
const uploadsDir = path.resolve(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = uuidv4() + ext; // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 64 * 1024 * 1024 }, // 64 MB
});

// 3. กำหนด Routes และเชื่อมกับ Controller
// POST /uploads -> ใช้ middleware 'upload' ก่อน แล้วค่อยเรียก 'uploadFile'
router.post("/", upload.single("file"), uploadFile);

// GET /uploads/:filename -> เรียก 'getFile'
router.get("/:filename", getFile);

module.exports = router;