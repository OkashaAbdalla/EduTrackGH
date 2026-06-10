/**
 * Headteacher Notification Controller
 */

const {
  getNotificationsForHeadteacher,
  markNotificationRead,
  markAllNotificationsRead,
  deleteComplianceNotification,
  deleteStaffNotification,
} = require('../services/headteacherNotificationService');
const {
  markNotificationRead: markStaffNotificationRead,
} = require('../services/staffNotificationService');

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
    const source = req.query.source;
    if (source === 'staff') {
      const notif = await markStaffNotificationRead(req.user._id, req.params.id);
      if (!notif) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }
      return res.json({ success: true });
    }

    let notif = await markNotificationRead(req.user._id, req.params.id);
    if (!notif) {
      notif = await markStaffNotificationRead(req.user._id, req.params.id);
    }
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

const deleteNotification = async (req, res) => {
  try {
    const source = req.query.source;
    let deleted = false;
    if (source === 'staff') {
      deleted = await deleteStaffNotification(req.user._id, req.params.id);
    } else if (source === 'compliance') {
      deleted = await deleteComplianceNotification(req.user._id, req.params.id);
    } else {
      deleted = await deleteComplianceNotification(req.user._id, req.params.id);
      if (!deleted) deleted = await deleteStaffNotification(req.user._id, req.params.id);
    }
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead, deleteNotification };
