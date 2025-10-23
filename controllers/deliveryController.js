// controllers/deliveryController.js
const db = require('../db/database'); // แก้ไข path ให้ถูก

const createDelivery = (req, res) => {
    // 1. ดึงข้อมูลจาก req.body (ข้อมูล Text)
    const { senderId, receiverId, receiverAddressId, itemDescription } = req.body;

    // 2. ตรวจสอบว่ามีไฟล์รูปแนบมาหรือไม่
    if (!req.file) {
        return res.status(400).json({ error: 'กรุณาแนบรูปภาพพัสดุ (photo_status1)' });
    }
    // 3. ดึงชื่อไฟล์ที่ Multer บันทึกให้
    const photoStatus1 = req.file.filename;

    if (!senderId || !receiverId || !receiverAddressId) {
        return res.status(400).json({ error: 'ข้อมูลผู้ส่ง, ผู้รับ, หรือที่อยู่ ไม่ครบถ้วน' });
    }

    // 4. ใช้ Schema ใหม่ (deliveries)
    const sql = `
        INSERT INTO deliveries 
        (sender_id, receiver_id, receiver_address_id, item_description, photo_status1, status)
        VALUES (?, ?, ?, ?, ?, 1) 
    `; // (status 1 = รอไรเดอร์มารับ)
    
    const params = [
        parseInt(senderId, 10),
        parseInt(receiverId, 10),
        parseInt(receiverAddressId, 10),
        itemDescription || null,
        photoStatus1
    ];

    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        
        res.status(201).json({
            message: 'สร้างรายการส่งของสำเร็จ',
            deliveryId: this.lastID,
            photo_status1: photoStatus1
        });
    });
};

const getSentDeliveries = (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    // เราจะ JOIN ตาราง users เพื่อเอา "ชื่อผู้รับ"
    const sql = `
        SELECT 
            d.id, d.status, d.item_description, 
            u.name as receiver_name 
        FROM deliveries d
        JOIN users u ON d.receiver_id = u.id
        WHERE d.sender_id = ?
        ORDER BY d.id DESC
    `;
    
    db.all(sql, [parseInt(userId, 10)], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(rows);
    });
};

const getReceivedDeliveries = (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    // เราจะ JOIN ตาราง users เพื่อเอา "ชื่อผู้ส่ง"
    const sql = `
        SELECT 
            d.id, d.status, d.item_description,
            u.name as sender_name
        FROM deliveries d
        JOIN users u ON d.sender_id = u.id
        WHERE d.receiver_id = ?
        ORDER BY d.id DESC
    `;

    db.all(sql, [parseInt(userId, 10)], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(rows);
    });
};

const getAvailableDeliveries = (req, res) => {
    // เรา JOIN กับ 'addresses' เพื่อเอาจุดหมายปลายทาง (address)
    // และ JOIN กับ 'users' เพื่อเอาชื่อผู้ส่ง
    const sql = `
        SELECT 
            d.id, d.photo_status1,
            a.address as destination_address,
            u.name as sender_name,
            d.item_description
        FROM deliveries d
        JOIN addresses a ON d.receiver_address_id = a.id
        JOIN users u ON d.sender_id = u.id
        WHERE d.status = 1 AND d.rider_id IS NULL
        ORDER BY d.id DESC
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(rows);
    });
};

const acceptDelivery = (req, res) => {
    const { id } = req.params; // ID ของ Delivery
    const { riderId } = req.body; // ID ของ Rider ที่กดรับ

    if (!riderId) {
        return res.status(400).json({ error: 'Missing riderId' });
    }

    // อัปเดต status เป็น 2 (ไรเดอร์รับงาน) และใส่ rider_id
    // ❗️ เราเช็ค `status = 1 AND rider_id IS NULL` เพื่อป้องกันการรับงานซ้ำซ้อน (Race Condition)
    const sql = `
        UPDATE deliveries 
        SET status = 2, rider_id = ?
        WHERE id = ? AND status = 1 AND rider_id IS NULL
    `;

    db.run(sql, [parseInt(riderId, 10), parseInt(id, 10)], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // ตรวจสอบว่ามีแถวที่ถูกอัปเดตจริงหรือไม่
        if (this.changes === 0) {
            // ถ้าเป็น 0 แปลว่างานนี้ถูกคนอื่นรับไปแล้ว
            return res.status(400).json({ error: 'Job not available or already taken' });
        }
        
        // ถ้ารับสำเร็จ
        res.status(200).json({ 
            message: 'Job accepted successfully', 
            deliveryId: parseInt(id, 10) 
        });
    });
};

module.exports = {
    createDelivery,
    getSentDeliveries,
    getReceivedDeliveries,
    getAvailableDeliveries,
    acceptDelivery
};