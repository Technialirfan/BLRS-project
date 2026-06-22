require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const path = require("path");

const connectDB = require("./config/db");
const { initBlockchain } = require("./config/blockchain");
const { initIPFS } = require("./config/ipfs");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth");
const landRoutes = require("./routes/land");
const disputeRoutes = require("./routes/disputes");
const documentRoutes = require("./routes/documents");
const adminRoutes = require("./routes/admin");
const publicRoutes = require("./routes/public");

const app = express();
app.set("trust proxy", 1);

connectDB();
initBlockchain();
initIPFS();

app.use(helmet());
app.use(cors());

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});
// app.use("/api/auth/login", loginLimiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(mongoSanitize());
app.use(xss());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "BLRS API is running",
    version: "1.0.0",
    system: "Balochistan Land Registry System",
    port: process.env.PORT || 5000,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  return res.json({
    success: true,
    status: "healthy",
    dbState: mongoose.connection.readyState,
    mongoHost: mongoose.connection.host || "none",
    mongoError: global.mongoError || "none",
    uriMasked: process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:([^:@]+)@/, ":***@") : "undefined",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Socket Test Endpoint to bypass mongoose and test raw TCP
app.get("/api/socket-test", (req, res) => {
  const net = require('net');
  const host = "ac-ljjofdy-shard-00-00.stfezbz.mongodb.net";
  const port = 27017;
  
  const client = new net.Socket();
  const startTime = Date.now();
  
  client.setTimeout(10000); // 10s timeout
  
  client.connect(port, host, () => {
    client.destroy(); // kill immediately after connect
    res.json({ success: true, message: `Successfully connected via TCP to ${host} in ${Date.now() - startTime}ms. Firewall is OPEN.` });
  });
  
  client.on('error', (err) => {
    res.json({ success: false, message: `TCP Error: ${err.message}. Firewall is BLOCKED.` });
  });
  
  client.on('timeout', () => {
    client.destroy();
    res.json({ success: false, message: `TCP Timeout after ${Date.now() - startTime}ms. Firewall is BLOCKED or dropping packets.` });
  });
});

app.get("/api/seed", async (req, res) => {
  try {
    const bcrypt = require("bcryptjs");
    const db = mongoose.connection.db;
    
    // Clear old data
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
      await db.dropCollection(col.name);
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash("Officer@2024", 12);
    await db.collection("officers").insertOne({
      fullName: "System Administrator",
      cnic: "0000000000001",
      email: "admin@blrs.gov.pk",
      password: hashedPassword,
      phone: "03001234567",
      role: "admin",
      assignedDistrict: null,
      walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      bio: "",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return res.json({ success: true, message: "Database completely recreated with default admin!" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/land", landRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);

app.use("*", (req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log("\n+------------------------------------------+");
  console.log("|   BLRS Backend API Started               |");
  console.log("+------------------------------------------+");
  console.log(`|   Port:        ${PORT}`);
  console.log(`|   Environment: ${process.env.NODE_ENV}`);
  console.log(`|   URL:         http://localhost:${PORT}`);
  console.log("+------------------------------------------+\n");
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err.message);
  server.close(() => process.exit(1));
});

module.exports = app;