/**
 * Teacher Routes — /api/teacher/*
 */

const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteMyNotification,
} = require('../controllers/staffNotificationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('teacher'));

router.get('/notifications', getMyNotifications);
router.patch('/notifications/read-all', markAllAsRead);
router.patch('/notifications/:id/read', markAsRead);
router.delete('/notifications/:id', deleteMyNotification);

module.exports = router;
