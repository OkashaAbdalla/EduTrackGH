/**
 * Notification Controller
 * EduTrack GH: Parent notifications (list, mark read)
 */

const Notification = require("../models/Notification");
const Student = require("../models/Student");

const getMyNotifications = async (req, res) => {
  try {
    const parentId = req.user._id;
    const notifications = await Notification.find({ parentId })
      .populate("studentId", "fullName studentIdNumber")
      .sort({ createdAt: -1 })
      .limit(100);

    const list = notifications.map((n) => ({
      id: n._id,
      type: n.type,
      child: n.studentId?.fullName || "Child",
      message: n.message,
      date: n.date.toISOString().split("T")[0],
      read: n.read,
      createdAt: n.createdAt,
    }));

    res.json({ success: true, notifications: list });
  } catch (error) {
    console.error("getMyNotifications error:", error);
    res.status(500).json({ success: false, message: "Failed to get notifications" });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const parentId = req.user._id;

    const notif = await Notification.findOne({ _id: id, parentId });
    if (!notif) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    notif.read = true;
    await notif.save();
    res.json({ success: true, notification: notif });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update" });
  }
};

module.exports = { getMyNotifications, markAsRead };
