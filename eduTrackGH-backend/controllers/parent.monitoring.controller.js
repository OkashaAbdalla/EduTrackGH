const User = require("../models/User");
const Student = require("../models/Student");
const Classroom = require("../models/Classroom");
const DailyAttendance = require("../models/DailyAttendance");
const { getEngine } = require("../services/calendarRuntime");
const { reconcileParentUserChildrenByEmail, syncParentUserChildrenByContact } = require("../services/parentService");

function toIso(d) {
  if (!d) return null;
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return x.toISOString().split("T")[0];
}

function toUtcDate(iso, end = false) {
  const [y, m, d] = iso.split("-").map((v) => Number(v));
  return new Date(Date.UTC(y, m - 1, d, end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0));
}

function getCurrentOrNearestTerm(engine, referenceIso) {
  const terms = [...(engine.terms || [])].sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  const currentName = engine.getTermForDate(referenceIso);
  if (currentName) return terms.find((t) => t.name === currentName) || null;
  return terms.find((t) => referenceIso < t.start) || terms[terms.length - 1] || null;
}

function countSchoolDays(engine, startIso, endIso, level) {
  let cur = new Date(`${startIso}T00:00:00Z`);
  const end = new Date(`${endIso}T00:00:00Z`);
  let total = 0;
  while (cur <= end) {
    const iso = cur.toISOString().split("T")[0];
    if (engine.isSchoolDay(iso, level)) total += 1;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return total;
}

function dedupeLatest(rows) {
  const byDate = new Map();
  rows.forEach((r) => {
    const iso = toIso(r.date);
    if (!iso) return;
    const prev = byDate.get(iso);
    const prevTs = prev ? new Date(prev.markedAt || prev.date).getTime() : -1;
    const thisTs = new Date(r.markedAt || r.date).getTime();
    if (!prev || thisTs >= prevTs) byDate.set(iso, r);
  });
  return [...byDate.values()];
}

const getAttendanceOverview = async (req, res) => {
  try {
    let parent = await User.findById(req.user._id).select("children email phone");
    if (parent?.email) {
      await reconcileParentUserChildrenByEmail({
        parentUserId: req.user._id,
        parentEmail: parent.email,
      });
      parent = await User.findById(req.user._id).select("children email phone");
    }
    let childIds = parent?.children || [];
    if (!childIds.length) {
      await syncParentUserChildrenByContact({
        parentUserId: req.user._id,
        parentEmail: parent?.email,
        parentPhone: parent?.phone,
      });
      parent = await User.findById(req.user._id).select("children");
      childIds = parent?.children || [];
    }
    if (!childIds.length) return res.json({ success: true, children: [], term: null });

    const [students, engine] = await Promise.all([
      Student.find({ _id: { $in: childIds } })
        .select("_id fullName classroom classroomId grade")
        .lean(),
      getEngine(),
    ]);
    const classroomIds = [...new Set(students.map((s) => String(s.classroom || s.classroomId || "")).filter(Boolean))];
    const classrooms = await Classroom.find({ _id: { $in: classroomIds } }).select("_id name grade").lean();
    const classroomMap = new Map(classrooms.map((c) => [String(c._id), c]));

    const todayIso = toIso(new Date());
    const term = getCurrentOrNearestTerm(engine, todayIso);
    if (!term) return res.json({ success: true, children: [], term: null });

    const startIso = term.start;
    const endIso = term.end;
    const dateFrom = toUtcDate(startIso);
    const dateTo = toUtcDate(endIso, true);

    const rows = await DailyAttendance.find({
      studentId: { $in: students.map((s) => s._id) },
      date: { $gte: dateFrom, $lte: dateTo },
    })
      .select("studentId status date markedAt")
      .lean();

    const rowsByStudent = new Map();
    rows.forEach((r) => {
      const k = String(r.studentId);
      if (!rowsByStudent.has(k)) rowsByStudent.set(k, []);
      rowsByStudent.get(k).push(r);
    });

    const summaries = students.map((s) => {
      const sid = String(s._id);
      const level = s.grade || classroomMap.get(String(s.classroom || s.classroomId))?.grade || "";
      const latestRows = dedupeLatest(rowsByStudent.get(sid) || []);
      const present = latestRows.filter((r) => r.status === "present").length;
      const absent = latestRows.filter((r) => r.status === "absent").length;
      const late = latestRows.filter((r) => r.status === "late").length;
      const totalSchoolDays = countSchoolDays(engine, startIso, endIso, level);
      const attendancePercentage =
        totalSchoolDays > 0 ? Math.round(((present + late) / totalSchoolDays) * 100) : 0;

      return {
        studentId: sid,
        studentName: s.fullName,
        className: classroomMap.get(String(s.classroom || s.classroomId))?.name || "Class",
        level,
        present,
        absent,
        late,
        totalSchoolDays,
        attendancePercentage,
        status: attendancePercentage >= 90 ? "Good attendance" : "Needs improvement",
      };
    });

    return res.json({
      success: true,
      term: { name: term.name, start: startIso, end: endIso, academicYear: engine.payload?.academicYear || null },
      todayDecision: engine.getSchoolDayDecision(todayIso, ""),
      children: summaries,
    });
  } catch (error) {
    console.error("getAttendanceOverview error:", error);
    return res.status(500).json({ success: false, message: "Failed to load parent attendance overview" });
  }
};

const getChildAttendanceRecords = async (req, res) => {
  try {
    const { studentId, month } = req.query;
    if (!studentId) return res.status(400).json({ success: false, message: "studentId is required" });

    let parent = await User.findById(req.user._id).select("children email phone");
    if (parent?.email) {
      await reconcileParentUserChildrenByEmail({
        parentUserId: req.user._id,
        parentEmail: parent.email,
      });
      parent = await User.findById(req.user._id).select("children email phone");
    }
    let allowed = (parent?.children || []).some((id) => String(id) === String(studentId));
    if (!allowed) {
      await syncParentUserChildrenByContact({
        parentUserId: req.user._id,
        parentEmail: parent?.email,
        parentPhone: parent?.phone,
      });
      parent = await User.findById(req.user._id).select("children");
      allowed = (parent?.children || []).some((id) => String(id) === String(studentId));
    }
    if (!allowed) return res.status(403).json({ success: false, message: "Not allowed" });

    const student = await Student.findById(studentId).select("_id fullName classroom classroomId grade").lean();
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const classroom = await Classroom.findById(student.classroom || student.classroomId).select("name grade").lean();
    let query = { studentId };
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split("-").map((v) => Number(v));
      query.date = {
        $gte: new Date(Date.UTC(y, m - 1, 1)),
        $lte: new Date(Date.UTC(y, m, 0, 23, 59, 59, 999)),
      };
    }

    const rows = await DailyAttendance.find(query).select("status date markedAt").sort({ date: 1, markedAt: 1 }).lean();
    const latestRows = dedupeLatest(rows);
    const records = latestRows
      .map((r) => ({ date: toIso(r.date), status: r.status }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    return res.json({
      success: true,
      student: {
        id: String(student._id),
        name: student.fullName,
        className: classroom?.name || "Class",
        level: student.grade || classroom?.grade || "",
      },
      records,
    });
  } catch (error) {
    console.error("getChildAttendanceRecords error:", error);
    return res.status(500).json({ success: false, message: "Failed to load child attendance records" });
  }
};

module.exports = {
  getAttendanceOverview,
  getChildAttendanceRecords,
};
