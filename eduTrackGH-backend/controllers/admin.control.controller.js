const User = require('../models/User');
const Student = require('../models/Student');
const Classroom = require('../models/Classroom');
const School = require('../models/School');
const DailyAttendance = require('../models/DailyAttendance');
const AttendanceFlag = require('../models/AttendanceFlag');
const Notification = require('../models/Notification');
const AdminConfig = require('../models/AdminConfig');
const AuthAuditLog = require('../models/AuthAuditLog');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

const DEFAULT_GPS_SETTINGS = { defaultRadius: 100, maxRadius: 300, gpsEnforced: true };
const DEFAULT_NOTIFICATION_SETTINGS = { emailEnabled: true, smsEnabled: false, absenceThreshold: 3 };

const toIso = (d) => {
  if (!d) return null;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return x.toISOString().split('T')[0];
};

const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const toRad = (n) => (n * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

async function getConfig(key, fallback) {
  const row = await AdminConfig.findOne({ key }).lean();
  return row?.value ?? fallback;
}

async function setConfig(key, value) {
  await AdminConfig.findOneAndUpdate({ key }, { $set: { value } }, { upsert: true, new: true });
  return value;
}

const getGpsSettings = async (_req, res) => {
  try {
    const settings = await getConfig('gps_settings', DEFAULT_GPS_SETTINGS);
    return res.json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get GPS settings' });
  }
};

const updateGpsSettings = async (req, res) => {
  try {
    const next = {
      defaultRadius: Number(req.body?.defaultRadius ?? DEFAULT_GPS_SETTINGS.defaultRadius),
      maxRadius: Number(req.body?.maxRadius ?? DEFAULT_GPS_SETTINGS.maxRadius),
      gpsEnforced: req.body?.gpsEnforced !== false,
    };
    if (!Number.isFinite(next.defaultRadius) || !Number.isFinite(next.maxRadius) || next.maxRadius < 10) {
      return res.status(400).json({ success: false, message: 'Invalid GPS settings payload' });
    }
    if (next.defaultRadius > next.maxRadius) {
      return res.status(400).json({ success: false, message: 'defaultRadius cannot exceed maxRadius' });
    }
    await setConfig('gps_settings', next);
    return res.json({ success: true, settings: next });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update GPS settings' });
  }
};

const getGpsLogs = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 300, 1000);
    const records = await DailyAttendance.find({
      'location.latitude': { $ne: null },
      'location.longitude': { $ne: null },
    })
      .populate('schoolId', 'name location')
      .populate('classroomId', 'name grade')
      .populate('markedBy', 'fullName email')
      .sort({ date: -1, markedAt: -1 })
      .limit(limit)
      .lean();

    const logs = records
      .map((r) => {
        const schoolLoc = r.schoolId?.location;
        if (
          !schoolLoc ||
          typeof schoolLoc.latitude !== 'number' ||
          typeof schoolLoc.longitude !== 'number' ||
          typeof schoolLoc.radius !== 'number'
        ) {
          return null;
        }
        const teacherLat = Number(r.location?.latitude);
        const teacherLng = Number(r.location?.longitude);
        if (!Number.isFinite(teacherLat) || !Number.isFinite(teacherLng)) return null;
        const distance = Math.round(
          haversineMeters(teacherLat, teacherLng, Number(schoolLoc.latitude), Number(schoolLoc.longitude))
        );
        return {
          id: String(r._id),
          date: toIso(r.date),
          school: r.schoolId?.name || 'School',
          classroom: r.classroomId?.name || 'Classroom',
          teacher: r.markedBy?.fullName || 'Teacher',
          status: r.status,
          gpsData: {
            teacherLat,
            teacherLng,
            schoolLat: Number(schoolLoc.latitude),
            schoolLng: Number(schoolLoc.longitude),
            distance,
            radius: Number(schoolLoc.radius),
            withinRadius: distance <= Number(schoolLoc.radius),
          },
        };
      })
      .filter(Boolean);

    return res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get GPS logs' });
  }
};

const getAdminAlerts = async (_req, res) => {
  try {
    const [flags, gpsRows] = await Promise.all([
      AttendanceFlag.find({ isResolved: false })
        .populate('schoolId', 'name')
        .populate('classroomId', 'name grade')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      DailyAttendance.find({
        'location.latitude': { $ne: null },
        'location.longitude': { $ne: null },
      })
        .populate('schoolId', 'name location')
        .populate('classroomId', 'name')
        .populate('markedBy', 'fullName')
        .sort({ date: -1, markedAt: -1 })
        .limit(500)
        .lean(),
    ]);

    const gpsAlerts = gpsRows
      .map((r) => {
        const loc = r.schoolId?.location;
        if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number' || typeof loc.radius !== 'number') {
          return null;
        }
        const dist = haversineMeters(
          Number(r.location?.latitude),
          Number(r.location?.longitude),
          Number(loc.latitude),
          Number(loc.longitude)
        );
        if (!Number.isFinite(dist) || dist <= Number(loc.radius)) return null;
        return {
          type: 'gps_out_of_radius',
          createdAt: r.markedAt || r.createdAt,
          message: `${r.markedBy?.fullName || 'Teacher'} marked attendance outside allowed radius.`,
          school: r.schoolId?.name || 'School',
          classroom: r.classroomId?.name || 'Classroom',
          distance: Math.round(dist),
          radius: Number(loc.radius),
        };
      })
      .filter(Boolean);

    const flagAlerts = flags.map((f) => ({
      type: f.flagType,
      createdAt: f.createdAt,
      message: f.details || f.flagType,
      school: f.schoolId?.name || 'School',
      classroom: f.classroomId?.name || 'Classroom',
    }));

    const alerts = [...gpsAlerts, ...flagAlerts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 200);

    return res.json({ success: true, count: alerts.length, alerts });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get alerts' });
  }
};

const getAdminUsers = async (req, res) => {
  try {
    const role = req.query.role ? String(req.query.role).toLowerCase() : null;
    const q = role ? { role } : {};
    const users = await User.find(q)
      .select('fullName email phone role isActive isVerified createdAt')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, count: users.length, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get users' });
  }
};

const updateAdminUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, action } = req.body || {};
    const user = await User.findById(id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (action === 'reset_password') {
      if (!req.body?.tempPassword || String(req.body.tempPassword).length < 8) {
        return res.status(400).json({ success: false, message: 'tempPassword (min 8 chars) is required' });
      }
      user.password = String(req.body.tempPassword);
      await user.save();
      if (user.email) {
        sendEmail({
          to: user.email,
          subject: 'EduTrack GH Password Reset by Admin',
          html: emailTemplates.accountWelcome({
            name: user.fullName,
            email: user.email,
            tempPassword: req.body.tempPassword,
            loginUrl: process.env.FRONTEND_URL || '',
            accountType: user.role,
            createdByText: 'super admin',
          }),
        }).catch(() => {});
      }
      return res.json({ success: true, message: 'User password reset successfully' });
    }

    await user.save();
    return res.json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
};

const getAdminStudents = async (req, res) => {
  try {
    const { schoolId, classroomId, grade } = req.query;
    const q = {};
    if (schoolId) q.schoolId = schoolId;
    if (classroomId) q.$or = [{ classroom: classroomId }, { classroomId }];
    if (grade) q.grade = grade;

    const students = await Student.find(q)
      .populate('schoolId', 'name')
      .populate('classroom', 'name grade')
      .populate('classroomId', 'name grade')
      .select('fullName admissionNumber studentId grade parentName parentEmail parentPhone isFlagged flaggedReason isActive')
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();
    const ids = students.map((s) => s._id);

    const attendanceRows = await DailyAttendance.aggregate([
      { $match: { studentId: { $in: ids } } },
      { $group: { _id: '$studentId', total: { $sum: 1 }, presentOrLate: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } } } },
    ]);
    const attendanceMap = new Map(attendanceRows.map((r) => [String(r._id), r]));

    const out = students.map((s) => {
      const agg = attendanceMap.get(String(s._id));
      const attendancePercentage = agg?.total ? Math.round((agg.presentOrLate / agg.total) * 100) : 0;
      return {
        id: String(s._id),
        fullName: s.fullName,
        admissionNumber: s.admissionNumber || s.studentId || '',
        grade: s.grade,
        school: s.schoolId?.name || '',
        classroom: s.classroom?.name || s.classroomId?.name || '',
        parent: { name: s.parentName || '', email: s.parentEmail || '', phone: s.parentPhone || '' },
        isFlagged: !!s.isFlagged,
        flaggedReason: s.flaggedReason || '',
        attendancePercentage,
      };
    });

    return res.json({ success: true, count: out.length, students: out });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get students' });
  }
};

const getAdminStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('schoolId', 'name')
      .populate('classroom', 'name grade')
      .populate('classroomId', 'name grade')
      .lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const agg = await DailyAttendance.aggregate([
      { $match: { studentId: student._id } },
      { $group: { _id: '$studentId', total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }, absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } }, late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } } } },
    ]);
    const s = agg[0] || { total: 0, present: 0, absent: 0, late: 0 };
    return res.json({
      success: true,
      student: {
        id: String(student._id),
        fullName: student.fullName,
        admissionNumber: student.admissionNumber || student.studentId || '',
        grade: student.grade,
        school: student.schoolId?.name || '',
        classroom: student.classroom?.name || student.classroomId?.name || '',
        parent: { name: student.parentName || '', email: student.parentEmail || '', phone: student.parentPhone || '' },
        attendance: s,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get student details' });
  }
};

const getAdminClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find({})
      .populate('schoolId', 'name')
      .populate('teacherId', 'fullName email')
      .select('name grade schoolId teacherId studentCount isActive')
      .sort({ createdAt: -1 })
      .lean();
    const ids = classrooms.map((c) => c._id);
    const att = await DailyAttendance.aggregate([
      { $match: { classroomId: { $in: ids } } },
      { $group: { _id: '$classroomId', total: { $sum: 1 }, presentOrLate: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } } } },
    ]);
    const map = new Map(att.map((a) => [String(a._id), a]));
    const out = classrooms.map((c) => {
      const a = map.get(String(c._id));
      return {
        id: String(c._id),
        name: c.name,
        grade: c.grade,
        school: c.schoolId?.name || '',
        teacher: c.teacherId?.fullName || '',
        studentCount: c.studentCount || c.students?.length || 0,
        attendanceRate: a?.total ? Math.round((a.presentOrLate / a.total) * 100) : 0,
        isActive: !!c.isActive,
      };
    });
    return res.json({ success: true, count: out.length, classrooms: out });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get classrooms' });
  }
};

const getAdminClassroomById = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate('schoolId', 'name')
      .populate('teacherId', 'fullName email')
      .lean();
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found' });
    const students = await Student.find({ $or: [{ classroom: classroom._id }, { classroomId: classroom._id }] })
      .select('fullName admissionNumber studentId')
      .sort({ fullName: 1 })
      .lean();
    return res.json({
      success: true,
      classroom: {
        id: String(classroom._id),
        name: classroom.name,
        grade: classroom.grade,
        school: classroom.schoolId?.name || '',
        teacher: classroom.teacherId?.fullName || '',
        studentCount: students.length,
        students: students.map((s) => ({ id: String(s._id), fullName: s.fullName, admissionNumber: s.admissionNumber || s.studentId || '' })),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get classroom details' });
  }
};

const getSystemOverview = async (_req, res) => {
  try {
    const [totalSchools, activeSchools, totalUsers, totalStudents, att] = await Promise.all([
      School.countDocuments({}),
      School.countDocuments({ isActive: true }),
      User.countDocuments({}),
      Student.countDocuments({}),
      DailyAttendance.aggregate([
        { $group: { _id: null, total: { $sum: 1 }, presentOrLate: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } } } },
      ]),
    ]);
    const attendanceRate = att[0]?.total ? Math.round((att[0].presentOrLate / att[0].total) * 100) : 0;
    return res.json({
      success: true,
      overview: {
        totalSchools,
        totalUsers,
        totalStudents,
        attendanceRate,
        activeSchools,
        inactiveSchools: Math.max(totalSchools - activeSchools, 0),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get system overview' });
  }
};

const getAuditLogs = async (_req, res) => {
  try {
    const [adminCreates, attendance] = await Promise.all([
      User.find({ role: { $in: ['headteacher', 'teacher'] } })
        .select('fullName email role createdAt')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      DailyAttendance.find({})
        .populate('markedBy', 'fullName role')
        .populate('schoolId', 'name')
        .select('status date markedAt createdAt markedBy schoolId')
        .sort({ createdAt: -1 })
        .limit(200)
        .lean(),
    ]);
    const logs = [
      ...adminCreates.map((u) => ({
        type: 'user_created',
        actor: 'admin',
        target: `${u.role}: ${u.fullName}`,
        school: '',
        at: u.createdAt,
      })),
      ...attendance.map((a) => ({
        type: 'attendance_submitted',
        actor: a.markedBy?.fullName || 'teacher',
        target: a.status,
        school: a.schoolId?.name || '',
        at: a.markedAt || a.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 300);
    return res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get audit logs' });
  }
};

const getAnalytics = async (_req, res) => {
  try {
    const schools = await School.find({}).select('_id name').lean();
    const schoolIds = schools.map((s) => s._id);
    const agg = await DailyAttendance.aggregate([
      { $match: { schoolId: { $in: schoolIds } } },
      {
        $group: {
          _id: '$schoolId',
          total: { $sum: 1 },
          presentOrLate: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
        },
      },
    ]);
    const map = new Map(agg.map((r) => [String(r._id), r]));
    const schoolPerformance = schools.map((s) => {
      const r = map.get(String(s._id));
      return {
        schoolId: String(s._id),
        schoolName: s.name,
        attendanceRate: r?.total ? Math.round((r.presentOrLate / r.total) * 100) : 0,
        totalRecords: r?.total || 0,
      };
    });
    const ranked = [...schoolPerformance].sort((a, b) => b.attendanceRate - a.attendanceRate);
    const trendsAgg = await DailyAttendance.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          total: { $sum: 1 },
          presentOrLate: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const trends = trendsAgg.map((t) => ({
      month: t._id,
      attendanceRate: t.total ? Math.round((t.presentOrLate / t.total) * 100) : 0,
      totalRecords: t.total,
    }));
    return res.json({
      success: true,
      analytics: {
        trends,
        bestSchools: ranked.slice(0, 5),
        worstSchools: ranked.slice(-5).reverse(),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get analytics' });
  }
};

const updateNotificationSettings = async (req, res) => {
  try {
    const payload = {
      emailEnabled: req.body?.emailEnabled !== false,
      smsEnabled: req.body?.smsEnabled === true,
      absenceThreshold: Number(req.body?.absenceThreshold || DEFAULT_NOTIFICATION_SETTINGS.absenceThreshold),
    };
    await setConfig('notification_settings', payload);
    return res.json({ success: true, settings: payload });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update notification settings' });
  }
};

const getNotificationSettings = async (_req, res) => {
  try {
    const settings = await getConfig('notification_settings', DEFAULT_NOTIFICATION_SETTINGS);
    return res.json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get notification settings' });
  }
};

const getAdminExport = async (_req, res) => {
  try {
    const [users, schools, students, classrooms] = await Promise.all([
      User.countDocuments({}),
      School.countDocuments({}),
      Student.countDocuments({}),
      Classroom.countDocuments({}),
    ]);
    return res.json({
      success: true,
      exportedAt: new Date().toISOString(),
      summary: { users, schools, students, classrooms },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to export data' });
  }
};

const getAuthLogs = async (req, res) => {
  try {
    const role = req.query.role ? String(req.query.role).toLowerCase().trim() : '';
    const action = req.query.action ? String(req.query.action).toUpperCase().trim() : '';
    const search = req.query.search ? String(req.query.search).toLowerCase().trim() : '';
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
    const skip = (page - 1) * limit;

    const query = {};
    if (role) query.role = role;
    if (action) query.action = action;
    if (search) query.email = { $regex: search, $options: 'i' };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate && !Number.isNaN(startDate.getTime())) query.timestamp.$gte = startDate;
      if (endDate && !Number.isNaN(endDate.getTime())) query.timestamp.$lte = endDate;
    }

    const [total, logs] = await Promise.all([
      AuthAuditLog.countDocuments(query),
      AuthAuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.json({ success: true, total, page, limit, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get auth logs' });
  }
};

const getViewAsProfile = async (req, res) => {
  try {
    const { role, id } = req.params;
    const normalizedRole = String(role || '').toLowerCase().trim();
    if (!['teacher', 'headteacher', 'parent'].includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role for view-as' });
    }
    const candidate = await User.findById(id).select('role');
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (String(candidate.role || '').toLowerCase() !== normalizedRole) {
      return res.status(400).json({
        success: false,
        message: `Role mismatch: selected "${normalizedRole}" but user is "${candidate.role}".`,
      });
    }

    const user = await User.findOne({ _id: id, role: normalizedRole })
      .select('fullName email phone role isActive isVerified school schoolId classroomIds children createdAt')
      .populate('school', 'name schoolLevel')
      .populate('schoolId', 'name schoolLevel')
      .populate('classroomIds', 'name grade')
      .lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, readOnly: true, banner: `Viewing as ${normalizedRole} (Read-Only Mode)`, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load view-as profile' });
  }
};

const getViewAsDashboard = async (req, res) => {
  try {
    const { role, id } = req.params;
    const normalizedRole = String(role || '').toLowerCase().trim();
    if (!['teacher', 'headteacher', 'parent'].includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role for view-as dashboard' });
    }

    const user = await User.findOne({ _id: id, role: normalizedRole })
      .select('fullName email role school schoolId classroomIds children')
      .populate('school', 'name schoolLevel')
      .populate('schoolId', 'name schoolLevel')
      .lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (normalizedRole === 'teacher') {
      const classroomIds = user.classroomIds || [];
      const classrooms = await Classroom.find({ _id: { $in: classroomIds } })
        .select('name grade students schoolId')
        .populate('schoolId', 'name')
        .lean();
      const classroomIdList = classrooms.map((c) => c._id);
      const [attendanceAgg, recentAttendance] = await Promise.all([
        DailyAttendance.aggregate([
          { $match: { classroomId: { $in: classroomIdList } } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),
        DailyAttendance.find({ classroomId: { $in: classroomIdList } })
          .select('date status classroomId studentId')
          .populate('classroomId', 'name grade')
          .populate('studentId', 'fullName admissionNumber')
          .sort({ date: -1, createdAt: -1 })
          .limit(15)
          .lean(),
      ]);
      return res.json({
        success: true,
        role: normalizedRole,
        readOnly: true,
        dashboard: {
          summary: {
            classrooms: classrooms.length,
            students: classrooms.reduce((acc, c) => acc + (Array.isArray(c.students) ? c.students.length : 0), 0),
            attendanceByStatus: attendanceAgg,
          },
          classrooms: classrooms.map((c) => ({
            id: String(c._id),
            name: c.name,
            grade: c.grade,
            school: c.schoolId?.name || '',
            studentCount: Array.isArray(c.students) ? c.students.length : 0,
          })),
          recentAttendance,
        },
      });
    }

    if (normalizedRole === 'headteacher') {
      const schoolId = user.school || user.schoolId;
      if (!schoolId) {
        return res.json({
          success: true,
          role: normalizedRole,
          readOnly: true,
          dashboard: { summary: { classrooms: 0, teachers: 0, students: 0, attendanceRate: 0 }, recentAttendance: [] },
        });
      }
      const [classrooms, teachersCount, studentsCount, attendanceAgg, recentAttendance] = await Promise.all([
        Classroom.find({ schoolId }).select('name grade students teacherId').populate('teacherId', 'fullName').lean(),
        User.countDocuments({ role: 'teacher', schoolId, isActive: true }),
        Student.countDocuments({ schoolId, isActive: true }),
        DailyAttendance.aggregate([
          { $match: { schoolId } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              presentOrLate: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
            },
          },
        ]),
        DailyAttendance.find({ schoolId })
          .select('date status classroomId studentId markedBy')
          .populate('classroomId', 'name grade')
          .populate('studentId', 'fullName admissionNumber')
          .populate('markedBy', 'fullName')
          .sort({ date: -1, createdAt: -1 })
          .limit(20)
          .lean(),
      ]);
      const total = attendanceAgg?.[0]?.total || 0;
      const attendanceRate = total ? Math.round(((attendanceAgg[0]?.presentOrLate || 0) / total) * 100) : 0;
      return res.json({
        success: true,
        role: normalizedRole,
        readOnly: true,
        dashboard: {
          summary: {
            classrooms: classrooms.length,
            teachers: teachersCount,
            students: studentsCount,
            attendanceRate,
          },
          classrooms: classrooms.map((c) => ({
            id: String(c._id),
            name: c.name,
            grade: c.grade,
            teacher: c.teacherId?.fullName || '',
            studentCount: Array.isArray(c.students) ? c.students.length : 0,
          })),
          recentAttendance,
        },
      });
    }

    const children = user.children || [];
    const [students, notifications, attendanceAgg] = await Promise.all([
      Student.find({ _id: { $in: children } })
        .select('fullName admissionNumber grade classroom schoolId')
        .populate('classroom', 'name grade')
        .populate('schoolId', 'name')
        .lean(),
      Notification.find({ parentId: user._id })
        .select('type message date read createdAt studentId')
        .populate('studentId', 'fullName')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      DailyAttendance.aggregate([
        { $match: { studentId: { $in: children } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return res.json({
      success: true,
      role: normalizedRole,
      readOnly: true,
      dashboard: {
        summary: {
          children: students.length,
          unreadNotifications: notifications.filter((n) => !n.read).length,
          attendanceByStatus: attendanceAgg,
        },
        children: students.map((s) => ({
          id: String(s._id),
          fullName: s.fullName,
          admissionNumber: s.admissionNumber || '',
          grade: s.grade || s.classroom?.grade || '',
          classroom: s.classroom?.name || '',
          school: s.schoolId?.name || '',
        })),
        notifications,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load view-as dashboard' });
  }
};

module.exports = {
  getGpsSettings,
  updateGpsSettings,
  getGpsLogs,
  getAdminAlerts,
  getAdminUsers,
  updateAdminUserStatus,
  getAdminStudents,
  getAdminStudentById,
  getAdminClassrooms,
  getAdminClassroomById,
  getSystemOverview,
  getAuditLogs,
  getAnalytics,
  getNotificationSettings,
  updateNotificationSettings,
  getAdminExport,
  getAuthLogs,
  getViewAsProfile,
  getViewAsDashboard,
};
