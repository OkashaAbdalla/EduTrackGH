const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  getAttendanceOverview,
  getChildAttendanceRecords,
} = require("../controllers/parent.monitoring.controller");

const router = express.Router();

router.use(protect);
router.use(authorize("parent"));

router.get("/attendance-overview", getAttendanceOverview);
router.get("/attendance-records", getChildAttendanceRecords);

module.exports = router;
