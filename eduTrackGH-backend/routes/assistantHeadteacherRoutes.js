/**
 * Assistant Headteacher Routes
 * /api/assistant-headteacher/*
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { requireActiveDelegation } = require('../middleware/assistantDelegationMiddleware');
const {
  getStatus,
  activateDelegationHandler,
  endDelegationHandler,
} = require('../controllers/delegationController');
const {
  getConversation,
  sendMessage,
  editMessage,
  deleteMessage,
} = require('../controllers/assistantChatController');
const {
  getTeachersForSchool,
} = require('../controllers/headteacher.teachers.controller');
const {
  getClassroomsForSchool,
  assignClassTeacher,
  seedDefaultClassroomsForSchool,
  unlockAttendanceForHeadteacher,
  getClassroomRegisterHistory,
} = require('../controllers/headteacher.classrooms.controller');
const { getTeachersCompliance } = require('../controllers/headteacher.compliance.controller');
const { getDashboardStats } = require('../controllers/headteacher.dashboard.controller');
const {
  getMyNotifications: getAssistantNotifications,
  markAsRead: markAssistantNotificationRead,
  markAllAsRead: markAllAssistantNotificationsRead,
  deleteNotification: deleteAssistantNotification,
} = require('../controllers/assistantNotificationController');
const { getAttendanceUnlockRequestsForHeadteacher } = require('../controllers/teacherMessageController');

router.use(protect);
router.use(authorize('assistant_headteacher'));

// Delegation + chat (available while inactive)
router.get('/delegation/status', getStatus);
router.post('/delegation/activate', activateDelegationHandler);
router.post('/delegation/end', endDelegationHandler);
router.get('/assistant-chat', getConversation);
router.post('/assistant-chat', sendMessage);
router.patch('/assistant-chat/:id', editMessage);
router.delete('/assistant-chat/:id', deleteMessage);
router.get('/notifications', getAssistantNotifications);
router.patch('/notifications/read-all', markAllAssistantNotificationsRead);
router.patch('/notifications/:id/read', markAssistantNotificationRead);
router.delete('/notifications/:id', deleteAssistantNotification);

// Operational routes (require active delegation)
router.use(requireActiveDelegation);

router.get('/dashboard-stats', getDashboardStats);
router.get('/compliance', getTeachersCompliance);
router.get('/teachers', getTeachersForSchool);
router.get('/classrooms', getClassroomsForSchool);
router.get('/classrooms/:classroomId/register', getClassroomRegisterHistory);
router.patch('/classrooms/:id/assign-teacher', assignClassTeacher);
router.post('/classrooms/seed-default', seedDefaultClassroomsForSchool);
router.patch('/attendance/unlock/:classroomId/:date', unlockAttendanceForHeadteacher);
router.get('/unlock-requests', getAttendanceUnlockRequestsForHeadteacher);

module.exports = router;
