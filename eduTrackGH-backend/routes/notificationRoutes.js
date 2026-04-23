/**
 * Notification Routes
 * /api/notifications - Parent notifications
 */

const express = require("express");
const router = express.Router();
const { getMyNotifications, markAsRead, markAllAsRead } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(authorize("parent"));

router.get("/", getMyNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);

module.exports = router;
