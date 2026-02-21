/**
 * Session Routes
 * /api/sessions/*
 */

const express = require('express');
const router = express.Router();
const {
  createSession,
  getSessions,
  getSession,
  activateSession,
  deactivateSession,
  deleteSession,
} = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validationRules, validate } = require('../utils/validators');

// All routes are protected
router.use(protect);

// Get sessions (all roles, filtered by role in controller)
router.get('/', getSessions);
router.get('/:id', getSession);

// Lecturer-only routes
router.post('/', authorize('lecturer'), validationRules.createSession, validate, createSession);
router.put('/:id/activate', authorize('lecturer'), activateSession);
router.put('/:id/deactivate', authorize('lecturer'), deactivateSession);
router.delete('/:id', authorize('lecturer'), deleteSession);

module.exports = router;
