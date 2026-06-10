/**
 * Notification Controller
 * EduTrack GH: Parent notifications (list, mark read)
 */

const Notification = require("../models/Notification");
const Student = require("../models/Student");

const getMyNotifications = async (req, res) => {
  try {
    const parentId = req.user._id;
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ parentId })
      .populate({
        path: "studentId",
        select: "fullName studentIdNumber schoolId",
        populate: { path: "schoolId", select: "name" },
      })
      .sort({ createdAt: -1 })
      .limit(100),
      Notification.countDocuments({ parentId, read: false }),
    ]);

    const list = notifications.map((n) => ({
      id: n._id,
      type: n.type,
      child: n.studentId?.fullName || "Child",
      schoolName: n.studentId?.schoolId?.name || "",
      message: n.message,
      date: n.date.toISOString().split("T")[0],
      read: n.read,
      status:
        n.type === "absence"
          ? "Absent"
          : n.type === "late"
          ? "Late"
          : n.type === "present"
          ? "Present"
          : "Warning",
      createdAt: n.createdAt,
    }));

    res.json({ success: true, notifications: list, unreadCount });
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

const markAllAsRead = async (req, res) => {
  try {
    const parentId = req.user._id;
    await Notification.updateMany({ parentId, read: false }, { $set: { read: true } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update notifications" });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const parentId = req.user._id;
    const result = await Notification.deleteOne({ _id: id, parentId });
    if (!result.deletedCount) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete notification" });
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead, deleteNotification };
