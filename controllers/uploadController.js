const fs = require("fs");
const path = require("path");

// กำหนด path ไปยังโฟลเดอร์ uploads จากตำแหน่งของไฟล์ controller นี้
const uploadsDir = path.resolve(__dirname, "../uploads");

// @desc    Upload a single file
// @route   POST /uploads
// @access  Public
const uploadFile = (req, res) => {
  // multer จะจัดการเรื่องการบันทึกไฟล์และเพิ่มข้อมูลไฟล์เข้ามาใน req.file
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  // ส่งแค่ชื่อไฟล์ที่ถูกสร้างใหม่กลับไปให้ client
  res.status(201).json({ filename: req.file.filename });
};

// @desc    Get a file for viewing or downloading
// @route   GET /uploads/:filename
// @access  Public
const getFile = (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadsDir, filename);

  // ตรวจสอบว่ามีไฟล์อยู่จริงหรือไม่
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  // ตรวจสอบ query parameter ว่าต้องการดาวน์โหลดหรือไม่
  const download = req.query.download === "true";
  if (download) {
    res.download(filePath); // บังคับให้ browser ดาวน์โหลดไฟล์
  } else {
    res.sendFile(filePath); // แสดงไฟล์ใน browser (เช่น รูปภาพ)
  }
};

module.exports = {
  uploadFile,
  getFile,
};