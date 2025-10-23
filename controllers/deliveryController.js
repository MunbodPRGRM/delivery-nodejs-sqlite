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

const updateDeliveryStatus = async (req, res) => {
    const { id } = req.params; // Delivery ID
    const { newStatus, riderId, latitude, longitude } = req.body; // ข้อมูลที่ส่งมา
    const photoFile = req.file; // ไฟล์รูปที่อัปโหลด

    // ตรวจสอบข้อมูลเบื้องต้น
    if (!newStatus || !riderId || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Missing required fields (newStatus, riderId, latitude, longitude)' });
    }
    if (newStatus !== '3' && newStatus !== '4') {
        return res.status(400).json({ error: 'Invalid newStatus (must be 3 or 4)' });
    }
    if (!photoFile && (newStatus === '3' || newStatus === '4')) {
        return res.status(400).json({ error: 'Missing photo for status 3 or 4' });
    }

    const deliveryIdInt = parseInt(id, 10);
    const riderIdInt = parseInt(riderId, 10);
    const riderLat = parseFloat(latitude);
    const riderLng = parseFloat(longitude);

    try {
        // --- ดึงข้อมูล Delivery ปัจจุบัน และพิกัดจุดรับ/ส่ง ---
        const deliveryDetails = await getDeliveryLocationDetails(deliveryIdInt);
        if (!deliveryDetails) {
            return res.status(404).json({ error: 'Delivery not found' });
        }

        // --- ตรวจสอบสถานะปัจจุบัน ---
        if (newStatus === '3' && deliveryDetails.status !== 2) {
             return res.status(400).json({ error: 'Cannot update to status 3 from current status' });
        }
        if (newStatus === '4' && deliveryDetails.status !== 3) {
             return res.status(400).json({ error: 'Cannot update to status 4 from current status' });
        }
        
        // --- ตรวจสอบระยะทาง 20 เมตร ---
        let targetLat, targetLng;
        if (newStatus === '3') { // กำลังจะรับของ -> เช็คระยะจาก "จุดรับ"
            targetLat = deliveryDetails.sender_latitude;
            targetLng = deliveryDetails.sender_longitude;
        } else { // newStatus === '4' กำลังจะส่งของ -> เช็คระยะจาก "จุดส่ง"
            targetLat = deliveryDetails.receiver_latitude;
            targetLng = deliveryDetails.receiver_longitude;
        }

        if (targetLat == null || targetLng == null) {
            return res.status(500).json({ error: 'Missing location data for validation' });
        }

        const distance = getDistance(
            { latitude: riderLat, longitude: riderLng },
            { latitude: targetLat, longitude: targetLng }
        );

        if (distance > 20) { // ถ้าเกิน 20 เมตร
             return res.status(400).json({ error: `You must be within 20 meters of the location (Current distance: ${distance}m)` });
        }
        
        // --- ถ้าผ่านหมด: อัปเดตฐานข้อมูล ---
        let photoColumn, photoValue;
        if (newStatus === '3') {
            photoColumn = 'photo_status3';
            photoValue = photoFile.filename;
        } else { // newStatus === '4'
            photoColumn = 'photo_status4';
            photoValue = photoFile.filename;
        }

        const sqlUpdate = `
            UPDATE deliveries 
            SET status = ?, ${photoColumn} = ?
            WHERE id = ? AND rider_id = ? 
        `; // (เช็ค rider_id ด้วยเพื่อความปลอดภัย)

        db.run(sqlUpdate, [parseInt(newStatus, 10), photoValue, deliveryIdInt, riderIdInt], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database update error: ' + err.message });
            }
            if (this.changes === 0) {
                 return res.status(400).json({ error: 'Update failed, possibly wrong rider or delivery ID' });
            }
            
            // ส่งข้อมูลสำเร็จกลับไป
            res.status(200).json({ 
                message: `Status updated to ${newStatus} successfully`,
                deliveryId: deliveryIdInt,
                [photoColumn]: photoValue // ส่งชื่อไฟล์รูปกลับไปด้วย
            });
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

function getDeliveryLocationDetails(deliveryId) {
    return new Promise((resolve, reject) => {
        // JOIN 3 ตาราง: deliveries, addresses (จุดส่ง), addresses (จุดรับ - ต้องหาจาก sender_id)
         const sql = `
            SELECT 
                d.status,
                sender_addr.latitude as sender_latitude, 
                sender_addr.longitude as sender_longitude,
                receiver_addr.latitude as receiver_latitude, 
                receiver_addr.longitude as receiver_longitude
            FROM deliveries d
            JOIN addresses receiver_addr ON d.receiver_address_id = receiver_addr.id
            JOIN users sender ON d.sender_id = sender.id
            LEFT JOIN addresses sender_addr ON sender.id = sender_addr.user_id -- (อาจต้องปรับปรุงถ้า sender มีหลายที่อยู่)
            WHERE d.id = ? 
            LIMIT 1 -- (เพื่อให้ได้จุดรับแค่จุดเดียว - ต้องปรับปรุง Logic ถ้า sender มีหลายที่อยู่)
        `;
        db.get(sql, [deliveryId], (err, row) => {
            if (err) return reject(new Error('DB Error: ' + err.message));
            resolve(row);
        });
    });
}

const getDeliveryDetails = (req, res) => {
    const { id } = req.params;
    const deliveryIdInt = parseInt(id, 10);

     const sql = `
        SELECT 
            d.id, d.status, d.item_description,
            d.photo_status1, d.photo_status3, d.photo_status4,
            sender.name as sender_name, sender.phone as sender_phone,
            receiver.name as receiver_name, receiver.phone as receiver_phone,
            sender_addr.address as sender_address_text,
            sender_addr.latitude as sender_latitude, 
            sender_addr.longitude as sender_longitude,
            receiver_addr.address as receiver_address_text,
            receiver_addr.latitude as receiver_latitude, 
            receiver_addr.longitude as receiver_longitude,
            r.id as rider_id, r.name as rider_name, r.phone as rider_phone,
            r.profile_pic as rider_profile_pic, r.vehicle_pic as rider_vehicle_pic,
            r.plate_number as rider_plate_number
        FROM deliveries d
        JOIN users sender ON d.sender_id = sender.id
        JOIN users receiver ON d.receiver_id = receiver.id
        JOIN addresses receiver_addr ON d.receiver_address_id = receiver_addr.id
        LEFT JOIN addresses sender_addr ON sender.id = sender_addr.user_id -- (ต้องปรับปรุงถ้า sender มีหลายที่อยู่)
        LEFT JOIN riders r ON d.rider_id = r.id
        WHERE d.id = ?
        LIMIT 1 -- (ต้องปรับปรุงถ้า sender มีหลายที่อยู่)
    `;

    db.get(sql, [deliveryIdInt], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Delivery not found' });
        res.status(200).json(row);
    });
};

module.exports = {
    createDelivery,
    getSentDeliveries,
    getReceivedDeliveries,
    getAvailableDeliveries,
    acceptDelivery, 
    updateDeliveryStatus,
    getDeliveryDetails
};