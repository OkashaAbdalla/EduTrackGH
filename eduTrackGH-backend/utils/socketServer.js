/**
 * Socket.IO server setup with JWT auth
 * Events: attendance_submitted, attendance_unlocked, unlock_request, compliance_updated, chat_message
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getCorsOrigins } = require('./corsOrigins');

let io = null;

function setupSocketServer(httpServer) {
  const { Server } = require('socket.io');
  io = new Server(httpServer, {
    cors: { origin: getCorsOrigins(), credentials: true },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace?.('Bearer ', '');
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id role school schoolId isActive isVerified');
      if (!user || user.isActive === false) return next(new Error('Invalid user'));
      if (!user.isVerified) return next(new Error('Email verification required'));
      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.schoolId = (user.school || user.schoolId)?.toString();
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const room = `user:${socket.userId}`;
    socket.join(room);
    if (socket.schoolId) socket.join(`school:${socket.schoolId}`);
    socket.on('disconnect', () => {});
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

function emitAttendanceSubmitted(data) {
  if (io) io.to(`school:${data.schoolId}`).emit('attendance_submitted', data);
}

function emitUnlockRequest(data) {
  if (io) io.to(`user:${data.headteacherId}`).emit('unlock_request', data);
}

function emitAttendanceUnlocked(data) {
  if (io && data?.teacherId) {
    io.to(`user:${data.teacherId}`).emit('attendance_unlocked', data);
  }
}

function emitComplianceUpdated(data) {
  if (io) io.to(`school:${data.schoolId}`).emit('compliance_updated', data);
}

function emitChatMessage(data) {
  const { headteacherId, teacherId } = data;
  if (io) {
    io.to(`user:${headteacherId}`).emit('chat_message', data);
    io.to(`user:${teacherId}`).emit('chat_message', data);
  }
}

function emitChatMessageDeleted(data) {
  const { headteacherId, teacherId } = data;
  if (io) {
    io.to(`user:${headteacherId}`).emit('chat_message_deleted', data);
    io.to(`user:${teacherId}`).emit('chat_message_deleted', data);
  }
}

function emitHeadteacherNotification(data) {
  if (io && data?.headteacherId) {
    io.to(`user:${data.headteacherId}`).emit('headteacher_notification', data);
  }
}

function emitStaffNotification(data) {
  if (io && data?.recipientId) {
    io.to(`user:${data.recipientId}`).emit('staff_notification', data);
  }
}

module.exports = {
  setupSocketServer,
  getIO,
  emitAttendanceSubmitted,
  emitUnlockRequest,
  emitAttendanceUnlocked,
  emitComplianceUpdated,
  emitChatMessage,
  emitChatMessageDeleted,
  emitHeadteacherNotification,
  emitStaffNotification,
};
