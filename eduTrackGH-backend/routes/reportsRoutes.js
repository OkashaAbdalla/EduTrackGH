/**
 * Reports Routes
 * /api/reports - Headteacher school reports
 */

const express = require("express");
const router = express.Router();
const { getSchoolReports } = require("../controllers/reportsController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(authorize("headteacher"));

router.get("/school", getSchoolReports);

module.exports = router;
