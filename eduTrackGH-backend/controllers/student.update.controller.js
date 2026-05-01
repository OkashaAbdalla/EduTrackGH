/**
 * Student update controller – teacher / headteacher
 * - Teacher, unapproved proposal (registration): direct patch.
 * - Teacher, approved class student: changes stored in pendingEdit until headteacher approves.
 * - Headteacher: direct patch; clears any pendingEdit.
 */

const Student = require('../models/Student');
const Classroom = require('../models/Classroom');
const {
  applyStudentPatchToDocument,
  pick,
  STUDENT_PATCH_KEYS,
} = require('../services/studentService');

const populateUpdateResponse = [
  { path: 'parent', select: 'fullName email phone' },
  { path: 'classroom', select: 'name grade' },
  { path: 'pendingEdit.proposedBy', select: 'fullName email' },
];

async function teacherOwnsStudentClassroom(teacherId, student) {
  const cid = student.classroom || student.classroomId;
  if (!cid) return false;
  const classroom = await Classroom.findById(cid).select('teacherId');
  return classroom?.teacherId?.toString() === teacherId.toString();
}

const updateStudent = async (req, res) => {
  try {
    const user = req.user;
    const studentId = req.params.id;
    if (!studentId) return res.status(400).json({ success: false, message: 'student id is required' });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const allowed = pick(req.body || {}, STUDENT_PATCH_KEYS);

    if (user.role === 'teacher') {
      if (student.isApproved === false) {
        const ownerId = student.createdBy?.toString?.() || student.proposedBy?.toString?.();
        if (!ownerId || ownerId !== user._id.toString()) {
          return res.status(403).json({ success: false, message: 'You can only correct students you proposed' });
        }
        await applyStudentPatchToDocument(student, allowed);
        await student.save();
        const out = await Student.findById(student._id).populate(populateUpdateResponse);
        return res.json({ success: true, message: 'Student updated', student: out });
      }

      const assigned = await teacherOwnsStudentClassroom(user._id, student);
      if (!assigned) {
        return res.status(403).json({
          success: false,
          message: 'You can only submit changes for students in classes assigned to you',
        });
      }

      if (!allowed.fullName || !String(allowed.fullName).trim()) {
        return res.status(400).json({ success: false, message: 'fullName is required' });
      }

      const pending = {
        proposedBy: user._id,
        proposedAt: new Date(),
        fullName: String(allowed.fullName).trim(),
      };
      if (allowed.dateOfBirth) pending.dateOfBirth = new Date(allowed.dateOfBirth);
      if (allowed.gender != null && allowed.gender !== '') pending.gender = allowed.gender;
      if (typeof allowed.parentName === 'string') pending.parentName = allowed.parentName.trim();
      if (typeof allowed.parentEmail === 'string') pending.parentEmail = allowed.parentEmail.trim().toLowerCase();
      if (typeof allowed.parentPhone === 'string') pending.parentPhone = allowed.parentPhone.trim();
      if (allowed.classroomId) pending.classroomId = allowed.classroomId;

      student.pendingEdit = pending;
      await student.save();
      const out = await Student.findById(student._id).populate(populateUpdateResponse);
      return res.json({
        success: true,
        message: 'Changes submitted for headteacher approval',
        pendingApproval: true,
        student: out,
      });
    }

    if (user.role === 'headteacher') {
      const schoolId = user.school?.toString?.();
      if (!schoolId || student.schoolId?.toString?.() !== schoolId) {
        return res.status(403).json({ success: false, message: 'Student does not belong to your school' });
      }
      await applyStudentPatchToDocument(student, allowed);
      student.set('pendingEdit', undefined);
      await student.save();
      const out = await Student.findById(student._id).populate(populateUpdateResponse);
      return res.json({ success: true, message: 'Student updated', student: out });
    }

    return res.status(403).json({ success: false, message: 'Not authorized' });
  } catch (err) {
    console.error('updateStudent error:', err);
    const status = typeof err.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to update student',
    });
  }
};

module.exports = { updateStudent };
