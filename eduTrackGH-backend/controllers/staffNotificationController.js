/**
 * Staff notification API (teachers)
 */

const {
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../services/staffNotificationService');

const getMyNotifications = async (req, res) => {
  try {
    const { notifications, unreadCount } = await getNotificationsForUser(req.user._id);
    return res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('getMyNotifications (teacher) error:', error);
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
