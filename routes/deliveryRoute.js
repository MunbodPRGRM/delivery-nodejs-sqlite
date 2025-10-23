// routes/deliveryRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
    createDelivery, 
    getSentDeliveries, 
    getReceivedDeliveries 
} = require('../controllers/deliveryController'); // เราจะสร้างไฟล์นี้

// 1. ตั้งค่า Multer
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    // ตั้งชื่อไฟล์รูปสถานะ 1
    cb(null, `status1-${Date.now()}${ext}`);
  }
});

const upload = multer({ storage: storage });

// 2. สร้าง Route
// เราจะใช้ .single('photo_status1') โดยชื่อนี้ต้องตรงกับที่ Flutter ส่งมา
router.post('/', upload.single('photo_status1'), createDelivery);

router.get('/sent', getSentDeliveries);
router.get('/received', getReceivedDeliveries);

module.exports = router;