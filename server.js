const app = require("./app"); // นำเข้า app ที่ตั้งค่าเรียบร้อยแล้ว
const os = require("os");

const port = process.env.PORT || 3000;
const host = "0.0.0.0"; // ให้ bind ทุก IP

// ===== ฟังก์ชันหา IPv4 ของเครื่อง (ย้ายมาไว้ที่นี่) =====
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "127.0.0.1";
}

// ===== Start Server =====
app.listen(port, host, () => {
  const ip = getLocalIP();
  console.log(`🚀 Delivery API running at: http://${ip}:${port}`);
});