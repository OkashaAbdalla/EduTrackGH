/**
 * /api/calendar — active calendar (read) + admin CRUD
 */

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  getActiveCalendar,
  listCalendars,
  getCalendarById,
  createCalendar,
  updateCalendar,
  deleteCalendar,
  activateAcademicYear,
  seedDefaultCalendar,
} = require("../controllers/calendarController");

router.get("/active", protect, getActiveCalendar);

router.post("/actions/activate-year", protect, authorize("admin"), activateAcademicYear);
router.post("/actions/seed-default", protect, authorize("admin"), seedDefaultCalendar);

router.get("/", protect, authorize("admin"), listCalendars);
router.post("/", protect, authorize("admin"), createCalendar);
router.get("/:id", protect, authorize("admin"), getCalendarById);
router.put("/:id", protect, authorize("admin"), updateCalendar);
router.delete("/:id", protect, authorize("admin"), deleteCalendar);

module.exports = router;
