/**
 * Notifications for acting assistant headteacher (uses linked headteacher scope)
 */

const {
  getNotificationsForHeadteacher,
  markNotificationRead,
  markAllNotificationsRead,
  deleteComplianceNotification,
  deleteStaffNotification,
} = require('../services/headteacherNotificationService');
const {
  getNotificationsForUser: getStaffNotificationsForUser,
  markNotificationRead: markStaffNotificationRead,
} = require('../services/staffNotificationService');
const { getHeadteacherIdForScope } = require('../utils/headteacherActingContext');

const AssistantDelegation = require('../models/AssistantDelegation');

const getMyNotifications = async (req, res) => {
  try {
    const staff = await getStaffNotificationsForUser(req.user._id);
    let compliance = { notifications: [], unreadCount: 0 };

    const active = await AssistantDelegation.findOne({
      assistantId: req.user._id,
      status: 'active',
    }).lean();

    if (active) {
      const headteacherId = getHeadteacherIdForScope(req);
      compliance = await getNotificationsForHeadteacher(headteacherId);
    }

    const notifications = [...compliance.notifications, ...staff.notifications].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    const unreadCount = compliance.unreadCount + staff.unreadCount;
    return res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get notifications' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const source = req.query.source;
    if (source === 'staff') {
      const notif = await markStaffNotificationRead(req.user._id, req.params.id);
      if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
      return res.json({ success: true });
    }
    const headteacherId = getHeadteacherIdForScope(req);
    let notif = await markNotificationRead(headteacherId, req.params.id);
    if (!notif) notif = await markStaffNotificationRead(req.user._id, req.params.id);
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to mark notification read' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const headteacherId = getHeadteacherIdForScope(req);
    await markAllNotificationsRead(headteacherId);
    await require('../services/staffNotificationService').markAllNotificationsRead(req.user._id);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to mark all notifications read' });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const source = req.query.source;
    const headteacherId = getHeadteacherIdForScope(req);
    let deleted = false;
    if (source === 'staff') {
      deleted = await deleteStaffNotification(req.user._id, req.params.id);
    } else if (source === 'compliance') {
      deleted = await deleteComplianceNotification(headteacherId, req.params.id);
    } else {
      deleted = await deleteComplianceNotification(headteacherId, req.params.id);
      if (!deleted) deleted = await deleteStaffNotification(req.user._id, req.params.id);
    }
    if (!deleted) return res.status(404).json({ success: false, message: 'Notification not found' });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead, deleteNotification };
