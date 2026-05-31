/**
 * Public routes (no auth)
 */

const express = require("express");
const router = express.Router();
const { getSystemStatus } = require("../controllers/publicController");

router.get("/system-status", getSystemStatus);

module.exports = router;
