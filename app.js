// ===== Import Dependencies =====
const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors"); // (ถ้ามีใช้)

// ===== Import Logic & Routes =====
const db = require("./db/database"); // นำเข้า DB connection
const userRoutes = require("./routes/userRoute");
const riderRoutes = require("./routes/riderRoute");
const uploadRoutes = require('./routes/uploadRoute');
const deliveryRoutes = require('./routes/deliveryRoute');

// ===== สร้าง Express App =====
const app = express();

// ===== Middleware =====
app.use(cors()); // (แนะนำให้ใส่ cors เพื่อให้ Flutter เรียก API ได้)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Routing =====
app.use("/users", userRoutes);
app.use("/riders", riderRoutes);
app.use("/deliveries", deliveryRoutes);

app.use('/uploads', express.static('uploads'));
app.use('/upload', uploadRoutes);

// ===== Export ตัวแปร app ออกไป =====
module.exports = app;