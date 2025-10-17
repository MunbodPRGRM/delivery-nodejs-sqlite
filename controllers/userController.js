// เราจะย้าย Dependencies ที่ Controller ต้องใช้มาไว้ที่นี่
const bcrypt = require('bcrypt');
const db = require('../db/database'); // สมมติว่าคุณมีไฟล์ database.js ที่ export db ออกมา

// @desc    Register a new user with profile picture
// @route   POST /users/register
// @access  Public
const registerUser = async (req, res) => {
    // ดึงข้อมูลจาก request body และ file
    const { phone, password, name, address, latitude, longitude } = req.body;

    // 1. ตรวจสอบข้อมูลเข้า
    if (!phone || !password || !name) {
        return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });
    }

    try {
        // 2. เข้ารหัสรหัสผ่าน
        const hashedPassword = await bcrypt.hash(password, 10);
        const profilePic = req.file ? req.file.filename : null; // ดึงชื่อไฟล์จาก req.file ที่ multer สร้างให้

        // 3. บันทึกข้อมูล User ลง DB
        const sqlUser = `INSERT INTO users (phone, password, name, profile_pic) VALUES (?,?,?,?)`;
        
        // ใช้ Promise เพื่อจัดการ Callback ของ sqlite ให้ง่ายขึ้น
        db.run(sqlUser, [phone, hashedPassword, name, profilePic], function (err) {
            if (err) {
                if (err.message.includes("UNIQUE")) {
                    return res.status(400).json({ error: "เบอร์โทรนี้มีผู้ใช้งานแล้ว" });
                }
                return res.status(500).json({ error: err.message });
            }

            const userId = this.lastID;

            // 4. ถ้ามีที่อยู่ ก็บันทึกที่อยู่ด้วย
            if (address) {
                const sqlAddr = `INSERT INTO addresses (user_id, address, latitude, longitude) VALUES (?,?,?,?)`;
                db.run(sqlAddr, [userId, address, latitude || null, longitude || null]);
            }

            // 5. ส่งข้อมูลกลับเมื่อสำเร็จ
            res.status(201).json({
                message: "สมัครสมาชิกสำเร็จ",
                user: { id: userId, phone, name, profile_pic: profilePic },
            });
        });

    } catch (error) {
        res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์: " + error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /users/login
// @access  Public
const loginUser = (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) {
        return res.status(400).json({ error: "กรุณากรอกเบอร์โทรและรหัสผ่าน" });
    }

    const sql = `SELECT * FROM users WHERE phone = ?`;
    db.get(sql, [phone], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: "เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง" });

        // เปรียบเทียบรหัสผ่านที่ส่งมากับ hash ใน DB
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: "เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง" });

        res.json({
            message: "เข้าสู่ระบบสำเร็จ",
            user: {
                id: user.id,
                phone: user.phone,
                name: user.name,
                profile_pic: user.profile_pic,
            },
        });
    });
};


module.exports = {
    registerUser,
    loginUser,
};