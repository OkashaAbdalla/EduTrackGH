/**
 * Student Service
 * Business logic for student registration, proposal, approval.
 */

const Student = require('../models/Student');
const Classroom = require('../models/Classroom');
const Parent = require('../models/Parent');
const { findOrCreateParent, linkStudentToParent } = require('./parentService');

const studentPopulate = [
  { path: 'parent', select: 'fullName email phone' },
  { path: 'classroom', select: 'name grade' },
];

function addStudentToClassroom(classroom, studentId) {
  const idStr = studentId.toString();
  if (classroom.students && classroom.students.some((sid) => sid.toString() === idStr)) return false;
  classroom.students = classroom.students || [];
  classroom.students.push(studentId);
  classroom.studentCount = (classroom.studentCount || 0) + 1;
  return true;
}

/**
 * Propose a new student (teacher). Returns created student populated.
 */
async function proposeStudent({ teacherId, body }) {
  const { fullName, dateOfBirth, gender, classroomId, grade, parentPhone, parentName, parentEmail, studentId, admissionNumber } = body || {};
  const admission = (admissionNumber || studentId || '').trim();

  const classroom = await Classroom.findById(classroomId).populate('schoolId', '_id name');
  if (!classroom) throw { status: 404, message: 'Classroom not found' };
  if (!classroom.teacherId || classroom.teacherId.toString() !== teacherId.toString()) {
    throw { status: 403, message: 'Unauthorized for this classroom' };
  }

  const schoolId = classroom.schoolId?._id || classroom.schoolId;
  const existing = await Student.findOne({ schoolId, admissionNumber: admission });
  if (existing) throw { status: 400, message: 'A student with this admission number already exists in this school' };

  const parent = await findOrCreateParent({ fullName: parentName, email: parentEmail, phone: parentPhone });

  const student = await Student.create({
    studentId: admission.toUpperCase(),
    fullName: fullName.trim(),
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    gender,
    schoolId,
    classroom: classroom._id,
    classroomId: classroom._id,
    grade: grade || classroom.grade,
    parentPhone: parentPhone || '',
    parentName: parentName || '',
    parentEmail: parentEmail || '',
    parent: parent._id,
    admissionNumber: admission,
    status: 'pending',
    isApproved: false,
    isActive: false,
    createdBy: teacherId,
    proposedBy: teacherId,
  });

  await linkStudentToParent(parent._id, student._id);

  return Student.findById(student._id).populate(studentPopulate);
}

/**
 * Register student by headteacher (auto-approved). Returns created student populated.
 */
async function registerStudentByHeadteacher({ headteacherId, schoolId, body }) {
  const { fullName, dateOfBirth, gender, classroomId, grade, parentPhone, parentName, parentEmail, studentId, admissionNumber } = body || {};
  const admission = (admissionNumber || studentId || '').trim();

  const classroom = await Classroom.findById(classroomId);
  if (!classroom) throw { status: 404, message: 'Classroom not found' };
  if (classroom.schoolId.toString() !== schoolId.toString()) {
    throw { status: 403, message: 'Classroom does not belong to your school' };
  }

  const existing = await Student.findOne({ schoolId, admissionNumber: admission });
  if (existing) throw { status: 400, message: 'A student with this admission number already exists in this school' };

  const parent = await findOrCreateParent({ fullName: parentName, email: parentEmail, phone: parentPhone });

  const student = await Student.create({
    studentId: admission.toUpperCase(),
    fullName: fullName.trim(),
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    gender,
    schoolId,
    classroom: classroom._id,
    classroomId: classroom._id,
    grade: grade || classroom.grade,
    parentPhone: parentPhone || '',
    parentName: parentName || '',
    parentEmail: parentEmail || '',
    parent: parent._id,
    admissionNumber: admission,
    status: 'active',
    isApproved: true,
    isActive: true,
    createdBy: headteacherId,
    approvedBy: headteacherId,
    approvedAt: new Date(),
  });

  if (addStudentToClassroom(classroom, student._id)) await classroom.save();
  await linkStudentToParent(parent._id, student._id);

  return Student.findById(student._id).populate(studentPopulate);
}

/**
 * Get approved students for headteacher school, optional classroom filter.
 */
async function getStudentsForHeadteacher(schoolId, classroomId = null) {
  const filter = { schoolId, isApproved: true };
  if (classroomId) filter.classroom = classroomId;
  return Student.find(filter)
    .populate('classroom', 'name grade')
    .populate('parent', 'fullName email phone')
    .populate('proposedBy', 'fullName email')
    .sort({ fullName: 1 });
}

/**
 * Get pending (unapproved) students for headteacher school.
 */
async function getPendingStudentsForHeadteacher(schoolId) {
  return Student.find({ schoolId, isApproved: false })
    .populate('classroom', 'name grade')
    .populate('parent', 'fullName email phone')
    .populate('proposedBy', 'fullName email')
    .sort({ createdAt: -1 });
}

/**
 * Approve a proposed student. Returns updated student.
 */
async function approveStudent({ studentId, headteacherId, schoolId }) {
  const student = await Student.findById(studentId).populate('parent').populate('classroom');
  if (!student) throw { status: 404, message: 'Student not found' };
  if (student.schoolId.toString() !== schoolId.toString()) throw { status: 403, message: 'Student does not belong to your school' };
  if (student.isApproved) throw { status: 400, message: 'Only pending students can be approved' };

  const classroomId = student.classroom?._id || student.classroomId;
  if (!classroomId) throw { status: 400, message: 'Student is not linked to a classroom' };

  const classroom = await Classroom.findById(classroomId);
  if (!classroom) throw { status: 404, message: 'Classroom not found' };
  if (classroom.schoolId.toString() !== schoolId.toString()) throw { status: 403, message: 'Classroom does not belong to your school' };

  if (!student.parent && (student.parentEmail || student.parentPhone || student.parentName)) {
    const parent = await findOrCreateParent({
      fullName: student.parentName || student.fullName + ' Parent',
      email: student.parentEmail,
      phone: student.parentPhone,
    });
    student.parent = parent._id;
    await linkStudentToParent(parent._id, student._id);
  }

  student.status = 'active';
  student.isApproved = true;
  student.isActive = true;
  student.approvedBy = headteacherId;
  student.approvedAt = new Date();
  await student.save();

  if (addStudentToClassroom(classroom, student._id)) await classroom.save();
  const parentId = student.parent && (student.parent._id || student.parent);
  if (parentId) await linkStudentToParent(parentId, student._id);

  return student;
}

/**
 * Reject a proposed student. Returns updated student.
 */
async function rejectStudent({ studentId, headteacherId, schoolId }) {
  const student = await Student.findById(studentId);
  if (!student) throw { status: 404, message: 'Student not found' };
  if (student.schoolId.toString() !== schoolId.toString()) throw { status: 403, message: 'Student does not belong to your school' };
  if (student.isApproved) throw { status: 400, message: 'Only pending students can be rejected' };

  student.status = 'rejected';
  student.isApproved = false;
  student.isActive = false;
  student.approvedBy = headteacherId;
  student.approvedAt = new Date();
  await student.save();
  return student;
}

module.exports = {
  proposeStudent,
  registerStudentByHeadteacher,
  getStudentsForHeadteacher,
  getPendingStudentsForHeadteacher,
  approveStudent,
  rejectStudent,
};
