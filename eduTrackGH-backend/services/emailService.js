const Student = require('../models/Student');
const Classroom = require('../models/Classroom');
const Parent = require('../models/Parent');
const DailyAttendance = require('../models/DailyAttendance');
const { sendEmail } = require('../utils/sendEmail');

const buildAbsenceEmailHtml = (studentName, classroomName, dateLabel, stronger) => {
  const intro = stronger
    ? `Your child has been marked absent for <strong>two consecutive school days</strong>.`
    : `Your child was marked <strong>absent</strong> from school today.`;

  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <div style="max-width: 600px; margin: 0 auto; padding: 16px;">
          <h2 style="color:#006838;margin-bottom:8px;">Absence Notification – EduTrackGH</h2>
          <p>${intro}</p>
          <p>
            <strong>Student:</strong> ${studentName}<br/>
            <strong>Classroom:</strong> ${classroomName}<br/>
            <strong>Date:</strong> ${dateLabel}
          </p>
          <p style="margin-top:16px;">
            This alert is generated automatically by EduTrackGH to help schools and parents monitor student attendance.
          </p>
          <p style="font-size:12px;color:#555;margin-top:24px;">
            EduTrackGH – Intelligent absenteeism monitoring for primary and JHS schools.
          </p>
        </div>
      </body>
    </html>
  `;
};

// Send absence email for a given student/date if parent email exists.
// - 1st day absent: standard message
// - 2nd consecutive day absent: stronger message
const handleAbsenceNotification = async ({ studentId, classroomId, date }) => {
  try {
    const student = await Student.findById(studentId)
      .populate('parent', 'fullName email phone')
      .populate('classroom', 'name grade')
      .lean();
    if (!student) return;

    const parentDoc = student.parent || null;
    const parentEmail = parentDoc?.email || student.parentEmail;
    if (!parentEmail) return;

    const classroom =
      student.classroom ||
      (await Classroom.findById(classroomId).select('name grade').lean());
    const classroomName = classroom
      ? `${classroom.name}${classroom.grade ? ` (${classroom.grade})` : ''}`
      : 'Classroom';

    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    const dateLabel = dateOnly.toLocaleDateString();

    // Check last two days including today for consecutive absences
    const start = new Date(dateOnly);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);

    const recent = await DailyAttendance.find({
      studentId,
      classroomId,
      date: { $gte: start, $lte: dateOnly },
    })
      .sort({ date: 1 })
      .lean();

    let consecutiveAbsent = 0;
    for (let i = recent.length - 1; i >= 0; i -= 1) {
      if (recent[i].status === 'absent') consecutiveAbsent += 1;
      else break;
    }

    const stronger = consecutiveAbsent >= 2;
    const html = buildAbsenceEmailHtml(
      student.fullName,
      classroomName,
      dateLabel,
      stronger
    );

    await sendEmail({
      to: parentEmail,
      subject: 'Absence Notification – EduTrackGH',
      html,
    });
  } catch (err) {
    // Do not crash on email failures
    console.error('handleAbsenceNotification error:', err.message);
  }
};

module.exports = {
  handleAbsenceNotification,
};

