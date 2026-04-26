/**
 * TeacherMessage Controller
 * Teacher -> Headteacher messages (attendance unlock / corrections)
 */

const TeacherMessage = require('../models/TeacherMessage');
const User = require('../models/User');
const School = require('../models/School');
const Classroom = require('../models/Classroom');
const { sendEmail } = require('../utils/sendEmail');
const { emitUnlockRequest } = require('../utils/socketServer');
const { getSchoolDayDecision } = require('../services/calendarRuntime');

// Teacher: create attendance unlock request for headteacher
const createAttendanceUnlockRequest = async (req, res) => {
  try {
    const teacher = req.user;
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Only teachers can create unlock requests' });
    }

    const { classroomId, attendanceDate, message } = req.body;
    if (!classroomId || !attendanceDate || !message) {
      return res.status(400).json({
        success: false,
        message: 'classroomId, attendanceDate and message are required',
      });
    }

    const schoolId = teacher.schoolId;
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'Teacher is not linked to a school' });
    }

    const headteacher = await User.findOne({ role: 'headteacher', school: schoolId, isActive: true });
    if (!headteacher) {
      return res.status(400).json({ success: false, message: 'No headteacher found for your school' });
    }

    const school = await School.findById(schoolId).select('name');
    const classroom = await Classroom.findById(classroomId).select('grade teacherId schoolId').lean();
    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found' });
    }
    if (String(classroom.schoolId) !== String(schoolId)) {
      return res.status(403).json({ success: false, message: 'Classroom does not belong to your school' });
    }
    if (classroom.teacherId && String(classroom.teacherId) !== String(teacher._id)) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this classroom' });
    }

    // Normalize attendance date to UTC day
    let dateOnly;
    if (typeof attendanceDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) {
      const [y, m, d] = attendanceDate.split('-').map((v) => parseInt(v, 10));
      dateOnly = new Date(Date.UTC(y, m - 1, d));
    } else {
      dateOnly = new Date(attendanceDate);
      dateOnly.setUTCHours(0, 0, 0, 0);
    }

    const dayDecision = await getSchoolDayDecision(dateOnly, classroom.grade || '');
    if (!dayDecision.isSchoolDay) {
      const reasonToMessage = {
        weekend: 'Unlock requests are not allowed for weekends.',
        before_resumption: 'Unlock requests are not allowed before school resumption.',
        holiday: 'Unlock requests are not allowed on holidays.',
        term_ended: 'Unlock requests are not allowed outside the active term.',
        vacation: 'Unlock requests are not allowed during vacation.',
        bece: 'Unlock requests are not allowed during BECE days for this class.',
        invalid_date: 'Invalid date selected for unlock request.',
      };
      return res.status(400).json({
        success: false,
        message: reasonToMessage[dayDecision.reason] || 'Unlock requests are not allowed for this date.',
        reason: dayDecision.reason,
      });
    }

    const doc = await TeacherMessage.create({
      teacherId: teacher._id,
      headteacherId: headteacher._id,
      schoolId,
      classroomId,
      attendanceDate: dateOnly,
      message,
      type: 'attendance_unlock',
    });

    // Email notification to headteacher (best effort)
    try {
      const friendlyDate = dateOnly.toISOString().split('T')[0];
      const subject = 'Attendance unlock request';
      const html = `
        <p>Dear ${headteacher.fullName},</p>
        <p>A teacher has requested an attendance unlock/correction:</p>
        <ul>
          <li><strong>Teacher:</strong> ${teacher.fullName} (${teacher.email})</li>
          <li><strong>School:</strong> ${school?.name || 'Unknown school'}</li>
          <li><strong>Date:</strong> ${friendlyDate}</li>
          <li><strong>Classroom ID:</strong> ${classroomId}</li>
        </ul>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <p>Please review this request in EduTrack GH and unlock the attendance if appropriate.</p>
      `;
      await sendEmail({ to: headteacher.email, subject, html });
    } catch (err) {
      console.warn('Failed to send headteacher unlock email:', err.message);
    }

    emitUnlockRequest({ headteacherId: headteacher._id.toString(), teacherId: teacher._id.toString(), schoolId, classroomId, attendanceDate: dateOnly, message });

    res.status(201).json({
      success: true,
      message: 'Unlock request sent to headteacher',
      request: doc,
    });
  } catch (error) {
    console.error('createAttendanceUnlockRequest error:', error);
    res.status(500).json({ success: false, message: 'Failed to send unlock request' });
  }
};

// Headteacher: list unlock requests for their school
const getAttendanceUnlockRequestsForHeadteacher = async (req, res) => {
  try {
    const headteacher = req.user;
    if (!headteacher || headteacher.role !== 'headteacher') {
      return res.status(403).json({ success: false, message: 'Only headteachers can view these messages' });
    }

    const schoolId = headteacher.school;
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'Headteacher is not linked to a school' });
    }

    const messages = await TeacherMessage.find({ headteacherId: headteacher._id, schoolId, status: 'pending' })
      .populate('teacherId', 'fullName email')
      .populate('classroomId', 'name grade')
      .sort({ createdAt: -1 })
      .limit(100);

    const invalidMessageIds = [];
    const filteredMessages = [];

    for (const m of messages) {
      const classLevelRef = m.classroomId?.grade || '';
      const dayDecision = await getSchoolDayDecision(m.attendanceDate, classLevelRef);
      if (!dayDecision.isSchoolDay) {
        invalidMessageIds.push(m._id);
        continue;
      }
      filteredMessages.push(m);
    }

    if (invalidMessageIds.length > 0) {
      await TeacherMessage.updateMany(
        { _id: { $in: invalidMessageIds }, status: 'pending' },
        { $set: { status: 'resolved' } }
      );
    }

    const list = filteredMessages.map((m) => ({
      id: m._id,
      type: m.type,
      status: m.status,
      teacher: m.teacherId?.fullName || 'Teacher',
      teacherEmail: m.teacherId?.email || '',
      classroom: m.classroomId ? `${m.classroomId.name} (${m.classroomId.grade})` : '',
      classroomId: m.classroomId?._id || m.classroomId,
      attendanceDate: m.attendanceDate.toISOString().split('T')[0],
      message: m.message,
      createdAt: m.createdAt,
    }));

    res.json({ success: true, messages: list });
  } catch (error) {
    console.error('getAttendanceUnlockRequestsForHeadteacher error:', error);
    res.status(500).json({ success: false, message: 'Failed to get unlock requests' });
  }
};

module.exports = {
  createAttendanceUnlockRequest,
  getAttendanceUnlockRequestsForHeadteacher,
};

