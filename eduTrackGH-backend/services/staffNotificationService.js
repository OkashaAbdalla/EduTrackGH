/**
 * In-app staff notifications (teacher <-> headteacher)
 */

const StaffNotification = require('../models/StaffNotification');
const { emitStaffNotification } = require('../utils/socketServer');

function trimPreview(text, max = 120) {
  const s = String(text || '').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function mapNotification(doc) {
  return {
    id: doc._id,
    source: 'staff',
    type: doc.type,
    senderName: doc.senderName || '',
    message: doc.message,
    classroomId: doc.classroomId?.toString?.() || doc.classroomId || null,
    classroomName: doc.classroomName || '',
    attendanceDate: doc.attendanceDate ? doc.attendanceDate.toISOString().split('T')[0] : null,
    otherUserId: doc.otherUserId?.toString?.() || doc.otherUserId || null,
    delegationId: doc.delegationId?.toString?.() || doc.delegationId || null,
    read: doc.read,
    createdAt: doc.createdAt,
  };
}

async function createAndEmit(payload) {
  const doc = await StaffNotification.create(payload);
  const mapped = mapNotification(doc);
  emitStaffNotification({
    recipientId: doc.recipientId.toString(),
    notification: mapped,
  });
  return doc;
}

async function notifyChatMessage({ recipientId, senderId, senderName, schoolId, message, otherUserId }) {
  const preview = trimPreview(message);
  const label = senderName || 'Someone';
  return createAndEmit({
    recipientId,
    schoolId,
    senderId,
    senderName: label,
    type: 'chat_message',
    message: `${label}: ${preview}`,
    otherUserId,
  });
}

async function notifyUnlockRequest({
  headteacherId,
  teacherId,
  teacherName,
  schoolId,
  classroomId,
  classroomName,
  attendanceDate,
  requestMessage,
}) {
  const dateIso = attendanceDate.toISOString().split('T')[0];
  const classLabel = classroomName || 'class';
  return createAndEmit({
    recipientId: headteacherId,
    schoolId,
    senderId: teacherId,
    senderName: teacherName || 'Teacher',
    type: 'unlock_request',
    message: `${teacherName || 'Teacher'} requested unlock for ${classLabel} on ${dateIso}. ${trimPreview(requestMessage, 80)}`,
    classroomId,
    classroomName: classLabel,
    attendanceDate,
    otherUserId: teacherId,
  });
}

async function notifyDelegationRequest({
  assistantId,
  headteacherId,
  headteacherName,
  note,
  delegationId,
  schoolId,
}) {
  const preview = note?.trim() || 'Please take over headteacher duties while I am away.';
  return createAndEmit({
    recipientId: assistantId,
    schoolId,
    senderId: headteacherId,
    senderName: headteacherName || 'Headteacher',
    type: 'delegation_request',
    message: `${headteacherName || 'Headteacher'} requests you to act as Assistant Headteacher. ${preview}`,
    otherUserId: headteacherId,
    delegationId: delegationId || undefined,
  });
}

async function notifyAttendanceUnlocked({
  teacherId,
  headteacherName,
  schoolId,
  classroomId,
  classroomName,
  attendanceDate,
}) {
  const dateIso =
    typeof attendanceDate === 'string'
      ? attendanceDate
      : attendanceDate.toISOString().split('T')[0];
  const classLabel = classroomName || 'your class';
  return createAndEmit({
    recipientId: teacherId,
    schoolId,
    senderName: headteacherName || 'Headteacher',
    type: 'attendance_unlocked',
    message: `Attendance unlocked for ${classLabel} on ${dateIso}. You can make corrections now.`,
    classroomId,
    classroomName: classLabel,
    attendanceDate:
      typeof attendanceDate === 'string'
        ? new Date(`${attendanceDate}T00:00:00.000Z`)
        : attendanceDate,
  });
}

async function getNotificationsForUser(userId) {
  const [notifications, unreadCount] = await Promise.all([
    StaffNotification.find({ recipientId: userId }).sort({ createdAt: -1 }).limit(50).lean(),
    StaffNotification.countDocuments({ recipientId: userId, read: false }),
  ]);
  return {
    notifications: notifications.map(mapNotification),
    unreadCount,
  };
}

async function markNotificationRead(userId, notificationId) {
  const notif = await StaffNotification.findOne({ _id: notificationId, recipientId: userId });
  if (!notif) return null;
  notif.read = true;
  await notif.save();
  return notif;
}

async function markAllNotificationsRead(userId) {
  await StaffNotification.updateMany({ recipientId: userId, read: false }, { $set: { read: true } });
}

async function deleteNotification(userId, notificationId) {
  const result = await StaffNotification.deleteOne({ _id: notificationId, recipientId: userId });
  return result.deletedCount > 0;
}

module.exports = {
  notifyChatMessage,
  notifyUnlockRequest,
  notifyDelegationRequest,
  notifyAttendanceUnlocked,
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  mapNotification,
};
