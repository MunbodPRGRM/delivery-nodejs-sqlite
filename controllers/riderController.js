const bcrypt = require('bcrypt');
const db = require('../db/database'); // แก้ไข path ไปยังไฟล์ database ของคุณ

// @desc    Register a new rider
// @route   POST /riders/register
// @access  Public
const registerRider = async (req, res) => {
    // 1. ดึงข้อมูลจาก request body และ files
    const { phone, password, name, plate_number } = req.body;

    // ตรวจสอบว่ามีไฟล์ถูกอัปโหลดมาหรือไม่
    const profilePic = req.files['profile_pic'] ? req.files['profile_pic'][0].filename : null;
    const vehiclePic = req.files['vehicle_pic'] ? req.files['vehicle_pic'][0].filename : null;

    // 2. ตรวจสอบข้อมูลที่จำเป็น
    if (!phone || !password || !name) {
        return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ (เบอร์โทร, รหัสผ่าน, ชื่อ)" });
    }

    try {
        // 3. เข้ารหัสรหัสผ่าน
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. บันทึกข้อมูลลงฐานข้อมูล
        const sql = `INSERT INTO riders 
                     (phone, password, name, profile_pic, vehicle_pic, plate_number) 
                     VALUES (?,?,?,?,?,?)`;
        
        const params = [phone, hashedPassword, name, profilePic, vehiclePic, plate_number || null];

        db.run(sql, params, function(err) {
            if (err) {
                if (err.message.includes("UNIQUE")) {
                    return res.status(400).json({ error: "เบอร์โทรนี้มีผู้ใช้งานแล้ว" });
                }
                return res.status(500).json({ error: "Database error: " + err.message });
            }

            // 5. ส่งข้อมูลกลับเมื่อสำเร็จ
            res.status(201).json({
                message: "สมัคร Rider สำเร็จ",
                rider: {
                    id: this.lastID,
                    phone,
                    name,
                    profile_pic: profilePic,
                    vehicle_pic: vehiclePic,
                    plate_number: plate_number || null
                }
            });
        });

    } catch (error) {
        res.status(500).json({ error: "Server error: " + error.message });
    }
};

// @desc    Authenticate a rider
// @route   POST /riders/login
// @access  Public
const loginRider = (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) {
        return res.status(400).json({ error: "กรุณากรอกเบอร์โทรและรหัสผ่าน" });
    }

    const sql = `SELECT * FROM riders WHERE phone = ?`;
    db.get(sql, [phone], async (err, rider) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rider) return res.status(400).json({ error: "เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง" });

        const match = await bcrypt.compare(password, rider.password);
        if (!match) return res.status(400).json({ error: "เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง" });

        res.json({
            message: "เข้าสู่ระบบ Rider สำเร็จ",
            rider: {
                id: rider.id,
                phone: rider.phone,
                name: rider.name,
                profile_pic: rider.profile_pic,
                vehicle_pic: rider.vehicle_pic,
                plate_number: rider.plate_number
            }
        });
    });
};

module.exports = {
    registerRider,
    loginRider,
};