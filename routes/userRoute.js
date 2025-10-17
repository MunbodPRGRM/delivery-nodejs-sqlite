const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const { registerUser, loginUser } = require('../controllers/userController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // โฟลเดอร์สำหรับเก็บไฟล์
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    },
});

const upload = multer({ storage });

router.post("/register", upload.single("profile_pic"), registerUser);
router.post("/login", loginUser);

module.exports = router;