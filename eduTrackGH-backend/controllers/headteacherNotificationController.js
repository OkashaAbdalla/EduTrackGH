/**
 * Headteacher Notification Controller
 */

const {
  getNotificationsForHeadteacher,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../services/headteacherNotificationService');

const getMyNotifications = async (req, res) => {
  try {
    const { notifications, unreadCount } = await getNotificationsForHeadteacher(req.user);
    return res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('getMyNotifications (headteacher) error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get notifications' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notif = await markNotificationRead(req.user._id, req.params.id);
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await markAllNotificationsRead(req.user._id);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
