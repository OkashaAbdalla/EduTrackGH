const Notification = require("../models/Notification");
const User = require("../models/User");
const Student = require("../models/Student");
const DailyAttendance = require("../models/DailyAttendance");
const School = require("../models/School");
const { sendEmail } = require("../utils/sendEmail");
const { linkStudentToParentUser } = require("./parentService");

function isoToUtcDateStart(iso) {
  const [y, m, d] = String(iso).split("-").map((v) => Number(v));
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function dateToIso(dateInput) {
  if (!dateInput) return null;
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return dateInput;
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
}

function buildEmailHtml({ studentName, statusLabel, dateIso, schoolName, message }) {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <div style="max-width: 600px; margin: 0 auto; padding: 16px;">
          <h2 style="color:#006838;margin-bottom:8px;">Attendance Update – EduTrackGH</h2>
          <p>${message}</p>
          <p>
            <strong>Student:</strong> ${studentName}<br/>
            <strong>Date:</strong> ${dateIso}<br/>
            <strong>Status:</strong> ${statusLabel}<br/>
            <strong>School:</strong> ${schoolName || "School"}
          </p>
          <p style="font-size:12px;color:#555;margin-top:24px;">
            EduTrackGH – Intelligent absenteeism monitoring for primary and JHS schools.
          </p>
        </div>
      </body>
    </html>
  `;
}

async function getConsecutiveAbsences(studentId, classroomId, dateIso) {
  const dateOnly = isoToUtcDateStart(dateIso);
  const start = new Date(dateOnly);
  start.setUTCDate(start.getUTCDate() - 14);
  const rows = await DailyAttendance.find({
    studentId,
    classroomId,
    date: { $gte: start, $lte: dateOnly },
  })
    .sort({ date: 1, markedAt: 1 })
    .lean();

  const latestByIso = new Map();
  for (const row of rows) {
    const iso = dateToIso(row.date);
    if (!iso) continue;
    const prev = latestByIso.get(iso);
    const rowTs = new Date(row.markedAt || row.date).getTime();
    const prevTs = prev ? new Date(prev.markedAt || prev.date).getTime() : -1;
    if (!prev || rowTs >= prevTs) latestByIso.set(iso, row);
  }

  const ordered = [...latestByIso.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  let streak = 0;
  for (let i = ordered.length - 1; i >= 0; i -= 1) {
    if (ordered[i][1].status === "absent") streak += 1;
    else break;
  }
  return streak;
}

async function createOrUpdateNotification({
  parentId,
  studentId,
  dateIso,
  type,
  message,
}) {
  const dateOnly = isoToUtcDateStart(dateIso);
  return Notification.findOneAndUpdate(
    { parentId, studentId, date: dateOnly, type },
    {
      $setOnInsert: { parentId, studentId, date: dateOnly, type },
      $set: { message, channel: "both" },
    },
    { upsert: true, new: true }
  );
}

async function sendNotificationEmailIfNeeded({
  notification,
  parentEmail,
  studentName,
  statusLabel,
  schoolName,
  message,
}) {
  if (!parentEmail || notification.emailSentAt) return;
  try {
    const result = await sendEmail({
      to: parentEmail,
      subject: `Attendance ${statusLabel} Alert – EduTrackGH`,
      html: buildEmailHtml({
        studentName,
        statusLabel,
        dateIso: dateToIso(notification.date),
        schoolName,
        message,
      }),
    });
    notification.emailSentAt = new Date();
    notification.emailMessageId = result?.messageId || "";
    await notification.save();
  } catch (err) {
    console.error("sendNotificationEmailIfNeeded error:", err.message);
  }
}

async function queueParentAttendanceAlert({ studentId, classroomId, schoolId, dateIso, status }) {
  if (!studentId || !dateIso || !["present", "absent", "late"].includes(status)) return;

  setImmediate(async () => {
    try {
      const [student, parentUserByChildren, school] = await Promise.all([
        Student.findById(studentId).select("fullName parentEmail").lean(),
        User.findOne({ role: "parent", children: studentId }).select("_id email").lean(),
        School.findById(schoolId).select("name").lean(),
      ]);

      if (!student) return;
      const normalizedParentEmail = student.parentEmail ? String(student.parentEmail).toLowerCase().trim() : "";
      let parentUser = parentUserByChildren;
      if (!parentUser?._id && normalizedParentEmail) {
        parentUser = await linkStudentToParentUser({
          studentId,
          parentEmail: normalizedParentEmail,
        });
      }
      if (!parentUser?._id) return;
      const schoolName = school?.name || "School";
      const studentName = student.fullName || "Student";
      const parentEmail = parentUser.email || student.parentEmail || "";
      const baseType = status === "absent" ? "absence" : status === "late" ? "late" : "present";
      const statusLabel = status === "absent" ? "Absent" : status === "late" ? "Late" : "Present";
      const message = status === "absent"
        ? `${studentName} was marked absent on ${dateIso}.`
        : status === "late"
        ? `${studentName} was marked late on ${dateIso}.`
        : `${studentName} was marked present on ${dateIso}.`;

      const notif = await createOrUpdateNotification({
        parentId: parentUser._id,
        studentId,
        dateIso,
        type: baseType,
        message,
      });
      await sendNotificationEmailIfNeeded({
        notification: notif,
        parentEmail,
        studentName,
        statusLabel,
        schoolName,
        message,
      });

      if (status === "absent") {
        const streak = await getConsecutiveAbsences(studentId, classroomId, dateIso);
        if (streak >= 3) {
          const warningMessage = `Warning: ${studentName} has been absent for ${streak} consecutive school days as of ${dateIso}.`;
          const warningNotif = await createOrUpdateNotification({
            parentId: parentUser._id,
            studentId,
            dateIso,
            type: "warning",
            message: warningMessage,
          });
          await sendNotificationEmailIfNeeded({
            notification: warningNotif,
            parentEmail,
            studentName,
            statusLabel: "Warning",
            schoolName,
            message: warningMessage,
          });
        }
      }
    } catch (err) {
      console.error("queueParentAttendanceAlert error:", err.message);
    }
  });
}

module.exports = {
  queueParentAttendanceAlert,
  dateToIso,
};
