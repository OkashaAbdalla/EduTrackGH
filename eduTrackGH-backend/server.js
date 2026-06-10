/**
 * EduTrack GH - Backend Server
 * Entry point for Express application
 */

const http = require("http");
const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables before importing modules that read process.env at require-time.
dotenv.config();

const connectDB = require("./config/db");
const errorMiddleware = require("./middleware/errorMiddleware");
const { setupSocketServer } = require("./utils/socketServer");
const { getCorsOrigins } = require("./utils/corsOrigins");
const { isEmailConfigured } = require("./services/emailService");
const {
  assertAdminLoginPathConfigured,
  getAdminLoginApiPath,
} = require("./config/adminLoginPath");
const { isCloudinaryConfigured } = require("./utils/profilePhotoStorage");

assertAdminLoginPathConfigured();

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is not set. Add it to eduTrackGH-backend/.env or your host (Render).");
  process.exit(1);
}

// Initialize Express app
const app = express();
// Render runs behind a proxy/load balancer; trust first proxy so req.ip is the real client IP.
app.set("trust proxy", 1);

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: getCorsOrigins(),
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" })); // For base64 images
app.use(express.urlencoded({ extended: true }));

// Local profile uploads (used when Cloudinary env vars are not set)
app.use(
  "/api/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "7d",
    fallthrough: true,
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}profiles${path.sep}`)) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.setHeader("Pragma", "no-cache");
      }
    },
  }),
);

// Routes - Admin login is registered inside authRoutes at /api/auth/${ADMIN_LOGIN_PATH}
// Rate limiting only applies to failed login attempts, not successful ones
app.use("/api/public", require("./routes/publicRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/classrooms", require("./routes/classroomRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/headteacher", require("./routes/headteacherRoutes"));
app.use("/api/teacher", require("./routes/teacherRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/reports", require("./routes/reportsRoutes"));
app.use("/api/messages", require("./routes/teacherMessageRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/calendar", require("./routes/calendarRoutes"));
app.use("/api/parent", require("./routes/parentRoutes"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "EduTrack GH API is running",
    timestamp: new Date().toISOString(),
    emailConfigured: isEmailConfigured(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
setupSocketServer(server);

// Start server
const PORT = Number(process.env.PORT) || 5000;
const HOST = "0.0.0.0";

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Promise Rejection:", reason);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Bound host: ${HOST}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
  console.log(`🔐 Admin login: POST ${getAdminLoginApiPath()}`);
  if (isCloudinaryConfigured()) {
    console.log("☁️  Cloudinary: configured (profile + attendance photos)");
  } else {
    console.log(
      "☁️  Cloudinary: not configured — profile photos save to uploads/ (add CLOUDINARY_* to .env for cloud storage)",
    );
  }
  if (process.env.GOOGLE_CLIENT_ID) {
    console.log("🔑 Google OAuth: configured");
  } else {
    console.log("🔑 Google OAuth: not configured — add GOOGLE_CLIENT_ID to .env and restart");
  }
});
