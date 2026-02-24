/**
 * Attendance Controller (Under 130 lines)
 */

const User = require("../models/User");
const Classroom = require("../models/Classroom");
const Student = require("../models/Student");
const DailyAttendance = require("../models/DailyAttendance");
const AttendanceFlag = require("../models/AttendanceFlag");
const Notification = require("../models/Notification");
const { sendSms } = require("../utils/sendSms");
const { uploadAttendancePhoto } = require("../utils/cloudinary");

// EduTrack GH: Mark daily attendance (teacher) and notify parents for absent/late
const markDailyAttendance = async (req, res) => {
  try {
    const { classroomId, date, attendanceData } = req.body;
    const teacherId = req.user._id;

    if (!classroomId || !date || !Array.isArray(attendanceData) || attendanceData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "classroomId, date, and attendanceData (array) are required",
      });
    }

    const classroom = await Classroom.findById(classroomId).populate("schoolId");
    if (!classroom) {
      return res.status(404).json({ success: false, message: "Classroom not found" });
    }
    if (classroom.teacherId.toString() !== teacherId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const schoolId = classroom.schoolId?._id || classroom.schoolId;
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    const savedRecords = [];
    const smsEnabled = process.env.SMS_ENABLED === "true";

    for (const row of attendanceData) {
      const { studentId, status } = row;
      if (!studentId || !["present", "late", "absent"].includes(status)) continue;

      const student = await Student.findById(studentId);
      if (!student || student.classroomId?.toString() !== classroomId) continue;

      // Phase 2: Normalize verification fields (backward compat: legacy payload → manual + Legacy entry)
      let verificationType = row.verificationType;
      let manualReason = row.manualReason;
      let photoUrl = row.photoUrl || null;
      if (status === "present") {
        if (!verificationType) {
          verificationType = "manual";
          manualReason = manualReason != null && String(manualReason).trim() ? manualReason : "Legacy entry";
        }
        if (verificationType === "photo" && photoUrl) {
          manualReason = null;
        }
      } else {
        verificationType = "manual";
        manualReason = null;
        photoUrl = null;
      }
      const markedAt = row.markedAt ? new Date(row.markedAt) : new Date();
      const location =
        row.location && (row.location.latitude != null || row.location.longitude != null)
          ? { latitude: row.location.latitude, longitude: row.location.longitude }
          : undefined;

      const existing = await DailyAttendance.findOne({
        classroomId,
        date: dateOnly,
        studentId,
      });
      if (existing) {
        if (existing.isLocked) {
          return res.status(403).json({
            success: false,
            message: "Attendance is locked for this classroom and date. Contact admin to unlock.",
          });
        }
        existing.status = status;
        existing.photoUrl = photoUrl;
        existing.verificationType = verificationType;
        existing.manualReason = manualReason;
        existing.markedAt = markedAt;
        if (location) existing.location = location;
        await existing.save();
        savedRecords.push(existing);
      } else {
        const record = await DailyAttendance.create({
          classroomId,
          schoolId,
          date: dateOnly,
          studentId,
          status,
          markedBy: teacherId,
          photoUrl,
          verificationType,
          manualReason,
          markedAt,
          location,
        });
        savedRecords.push(record);
      }

      if (status === "absent" || status === "late") {
        const parent = await User.findOne({ role: "parent", children: studentId });
        const msg =
          status === "absent"
            ? `${student.fullName} was absent from school on ${dateOnly.toLocaleDateString()}. - EduTrack GH`
            : `${student.fullName} arrived late to school on ${dateOnly.toLocaleDateString()}. - EduTrack GH`;

        if (parent) {
          await Notification.create({
            parentId: parent._id,
            studentId,
            type: status === "absent" ? "absence" : "late",
            message: msg,
            channel: "sms",
            date: dateOnly,
          });
          if (smsEnabled && student.parentPhone) {
            sendSms(student.parentPhone, msg)
              .then((smsResult) => {
                if (!smsResult.success) {
                  console.warn("SMS failed for", student.parentPhone, smsResult.message);
                }
              })
              .catch((err) => {
                console.warn("SMS error for", student.parentPhone, err.message);
              });
          }
        }
      }
    }

    // Phase 3: Lock attendance after submission
    if (savedRecords.length > 0) {
      await DailyAttendance.updateMany(
        { classroomId, date: dateOnly },
        { $set: { isLocked: true } }
      );
    }

    // Phase 8: Suspicious pattern detection (fire-and-forget)
    (async () => {
      try {
        const studentsInClass = await Student.find({ classroomId }).select("_id");
        const studentIdsArr = studentsInClass.map((s) => s._id);
        // Rule 1: All records marked within < 60 seconds
        if (savedRecords.length >= 2) {
          const times = savedRecords.map((r) => r.markedAt?.getTime?.() ?? 0).filter(Boolean);
          if (times.length >= 2) {
            const minT = Math.min(...times);
            const maxT = Math.max(...times);
            if (maxT - minT < 60000) {
              await AttendanceFlag.findOneAndUpdate(
                { classroomId, date: dateOnly, flagType: "rapid_marking" },
                {
                  $set: {
                    classroomId,
                    schoolId,
                    date: dateOnly,
                    flagType: "rapid_marking",
                    details: `All ${savedRecords.length} records marked within ${Math.round((maxT - minT) / 1000)}s`,
                    isResolved: false,
                  },
                },
                { upsert: true, new: true }
              );
            }
          }
        }
        // Rule 2: 100% present for 15 consecutive days
        const today = new Date(dateOnly);
        let consecutive100 = 0;
        for (let d = 0; d < 15; d++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - d);
          checkDate.setHours(0, 0, 0, 0);
          const dayRecords = await DailyAttendance.find({
            classroomId,
            date: checkDate,
            studentId: { $in: studentIdsArr },
          });
          const presentCount = dayRecords.filter((r) => r.status === "present").length;
          if (studentIdsArr.length > 0 && presentCount === studentIdsArr.length) {
            consecutive100++;
          } else {
            break;
          }
        }
        if (consecutive100 >= 15) {
          await AttendanceFlag.findOneAndUpdate(
            { classroomId, date: dateOnly, flagType: "consecutive_100_present" },
            {
              $set: {
                classroomId,
                schoolId,
                date: dateOnly,
                flagType: "consecutive_100_present",
                details: `100% present for ${consecutive100} consecutive days`,
                isResolved: false,
              },
            },
            { upsert: true, new: true }
          );
        }
      } catch (err) {
        console.warn("AttendanceFlag check error:", err.message);
      }
    })();

    res.status(201).json({
      success: true,
      message: "Attendance saved",
      count: savedRecords.length,
    });
  } catch (error) {
    console.error("markDailyAttendance error:", error);
    res.status(500).json({ success: false, message: "Failed to save attendance" });
  }
};

// EduTrack GH: Get classroom daily attendance history (teacher) from DailyAttendance
const getClassroomDailyHistory = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const teacherId = req.user._id;
    const { month } = req.query;

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ success: false, message: "Classroom not found" });
    }
    if (classroom.teacherId.toString() !== teacherId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const students = await Student.find({ classroomId }).select("_id");
    const studentIds = students.map((s) => s._id);

    let query = { classroomId, studentId: { $in: studentIds } };
    if (month) {
      const [y, m] = month.split("-");
      const start = new Date(parseInt(y), parseInt(m, 10) - 1, 1);
      const end = new Date(parseInt(y), parseInt(m, 10), 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }

    const records = await DailyAttendance.find(query)
      .populate("studentId", "fullName studentIdNumber")
      .sort({ date: -1 });

    const byDate = {};
    records.forEach((r) => {
      const d = r.date.toISOString().split("T")[0];
      if (!byDate[d]) {
        byDate[d] = { date: d, present: 0, absent: 0, late: 0, total: studentIds.length };
      }
      byDate[d][r.status]++;
    });
    const grouped = Object.values(byDate).sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      classroomId,
      classroomName: classroom.name,
      records: grouped,
      totalStudents: studentIds.length,
    });
  } catch (error) {
    console.error("getClassroomDailyHistory error:", error);
    res.status(500).json({ success: false, message: "Failed to get attendance history" });
  }
};

// Phase 5: Upload attendance photo (teacher); returns URL for photoUrl
const uploadPhoto = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: "image (base64) is required" });
    }
    const result = await uploadAttendancePhoto(image);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    res.json({ success: true, photoUrl: result.url });
  } catch (error) {
    console.error("uploadPhoto error:", error);
    res.status(500).json({ success: false, message: "Failed to upload photo" });
  }
};

module.exports = {
  markDailyAttendance,
  getClassroomDailyHistory,
  uploadPhoto,
};
