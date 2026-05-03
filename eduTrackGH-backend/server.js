/**
 * EduTrack GH - Backend Server
 * Entry point for Express application
 */

const http = require("http");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const errorMiddleware = require("./middleware/errorMiddleware");
const { setupSocketServer } = require("./utils/socketServer");
const { getCorsOrigins } = require("./utils/corsOrigins");
const { isEmailConfigured } = require("./config/email");

// Load environment variables
dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is not set. Add it to eduTrackGH-backend/.env or your host (Render).");
  process.exit(1);
}

// Initialize Express app
const app = express();

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

// Routes - Admin login is registered inside authRoutes at /api/auth/${ADMIN_LOGIN_PATH}
// Rate limiting only applies to failed login attempts, not successful ones
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/classrooms", require("./routes/classroomRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/headteacher", require("./routes/headteacherRoutes"));
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
  console.log("🔐 Admin login path configured");
});
