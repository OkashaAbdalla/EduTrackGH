/**
 * Session Controller (Under 130 lines)
 */

const Session = require('../models/Session');
const Attendance = require('../models/Attendance');

const createSession = async (req, res) => {
  try {
    const { courseName, courseCode, duration, location } = req.body;

    const session = await Session.create({
      courseName, courseCode, duration, location,
      lecturerId: req.user._id,
      lecturerName: req.user.fullName,
    });

    res.status(201).json({ success: true, message: 'Session created', session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create session' });
  }
};

const getSessions = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'lecturer') query.lecturerId = req.user._id;
    if (req.user.role === 'student') {
      query.isActive = true;
      query.endTime = { $gt: new Date() };
    }

    const sessions = await Session.find(query)
      .sort({ createdAt: -1 })
      .populate('lecturerId', 'fullName email');

    res.json({ success: true, count: sessions.length, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get sessions' });
  }
};

const getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('lecturerId', 'fullName email');
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get session' });
  }
};

const activateSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.lecturerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    session.isActive = true;
    await session.save();
    res.json({ success: true, message: 'Session activated', session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to activate session' });
  }
};

const deactivateSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.lecturerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    session.isActive = false;
    await session.save();
    res.json({ success: true, message: 'Session deactivated', session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to deactivate session' });
  }
};

const deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.lecturerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Attendance.deleteMany({ sessionId: session._id });
    await session.deleteOne();
    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete session' });
  }
};

module.exports = { createSession, getSessions, getSession, activateSession, deactivateSession, deleteSession };
