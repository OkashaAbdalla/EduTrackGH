/**
 * Reports Controller
 * EduTrack GH: Headteacher school reports (aggregate daily attendance by class)
 */

const DailyAttendance = require("../models/DailyAttendance");
const Classroom = require("../models/Classroom");
const Student = require("../models/Student");

const getSchoolReports = async (req, res) => {
  try {
    const headteacherId = req.user._id;
    const { month } = req.query;

    const User = require("../models/User");
    const headteacher = await User.findById(headteacherId).select("school schoolLevel");
    const schoolId = headteacher?.school;
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "Headteacher is not assigned to a school",
      });
    }

    const classrooms = await Classroom.find({ schoolId, isActive: true });
    const startDate = month
      ? (() => {
          const [y, m] = month.split("-");
          return new Date(parseInt(y), parseInt(m, 10) - 1, 1);
        })()
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = month
      ? (() => {
          const [y, m] = month.split("-");
          return new Date(parseInt(y), parseInt(m, 10), 0, 23, 59, 59);
        })()
      : new Date();

    const classReports = [];

    for (const classroom of classrooms) {
      const students = await Student.find({ classroomId: classroom._id, isActive: true });
      const studentIds = students.map((s) => s._id);
      const totalStudents = studentIds.length;

      const records = await DailyAttendance.find({
        classroomId: classroom._id,
        date: { $gte: startDate, $lte: endDate },
        studentId: { $in: studentIds },
      });

      const byDate = {};
      records.forEach((r) => {
        const d = r.date.toISOString().split("T")[0];
        if (!byDate[d]) byDate[d] = { present: 0, absent: 0, late: 0 };
        byDate[d][r.status]++;
      });
      const daysMarked = Object.keys(byDate).length;
      const totalPresent = records.filter((r) => r.status === "present").length;
      const totalAbsent = records.filter((r) => r.status === "absent").length;
      const totalLate = records.filter((r) => r.status === "late").length;
      const expectedDays = totalStudents * Math.max(daysMarked, 1);
      const avgRate =
        expectedDays > 0
          ? Math.round((totalPresent / expectedDays) * 100)
          : 0;
      const flagged = students.filter((s) => s.isFlagged).length;

      classReports.push({
        class: classroom.name,
        level: classroom.grade?.startsWith("JHS") ? "JHS" : "PRIMARY",
        students: totalStudents,
        avgRate,
        flagged,
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate,
        daysMarked: daysMarked,
      });
    }

    res.json({
      success: true,
      schoolId,
      month: month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
      reports: classReports,
    });
  } catch (error) {
    console.error("getSchoolReports error:", error);
    res.status(500).json({ success: false, message: "Failed to get reports" });
  }
};

module.exports = { getSchoolReports };
