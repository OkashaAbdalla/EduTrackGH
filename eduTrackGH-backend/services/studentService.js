/**
 * Student Service
 * Business logic for student registration, proposal, approval.
 */

const Student = require('../models/Student');
const Classroom = require('../models/Classroom');
const Parent = require('../models/Parent');
const { findOrCreateParent, linkStudentToParent, linkStudentToParentUser } = require('./parentService');
const crypto = require('crypto');

const studentPopulate = [
  { path: 'parent', select: 'fullName email phone' },
  { path: 'classroom', select: 'name grade' },
  { path: 'pendingEdit.proposedBy', select: 'fullName email' },
];

function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(obj || {}, k)) out[k] = obj[k];
  });
  return out;
}

function normalizeGender(g) {
  if (!g) return g;
  const v = String(g).trim();
  if (!v) return '';
  const up = v.toUpperCase();
  if (up === 'MALE' || up === 'M') return 'MALE';
  if (up === 'FEMALE' || up === 'F') return 'FEMALE';
  return v;
}

const STUDENT_PATCH_KEYS = [
  'fullName',
  'dateOfBirth',
  'gender',
  'classroomId',
  'parentName',
  'parentEmail',
  'parentPhone',
];

/**
 * Mutates student document; does not save. Used for direct updates and applying approved pending edits.
 */
async function applyStudentPatchToDocument(student, body) {
  const allowed = pick(body || {}, STUDENT_PATCH_KEYS);
  if (typeof allowed.fullName === 'string') student.fullName = allowed.fullName.trim();
  if (allowed.dateOfBirth) student.dateOfBirth = new Date(allowed.dateOfBirth);
  if (allowed.gender != null && allowed.gender !== '') student.gender = normalizeGender(allowed.gender);
  if (typeof allowed.parentName === 'string') student.parentName = allowed.parentName.trim();
  if (typeof allowed.parentEmail === 'string') student.parentEmail = allowed.parentEmail.trim().toLowerCase();
  if (typeof allowed.parentPhone === 'string') student.parentPhone = allowed.parentPhone.trim();

  if (allowed.classroomId) {
    const nextClassroom = await Classroom.findById(allowed.classroomId).select('_id schoolId grade');
    if (!nextClassroom) throw { status: 400, message: 'Classroom not found' };
    if (nextClassroom.schoolId?.toString?.() !== student.schoolId?.toString?.()) {
      throw { status: 400, message: 'Classroom does not belong to the same school' };
    }
    student.classroom = nextClassroom._id;
    student.classroomId = nextClassroom._id;
    if (!student.grade && nextClassroom.grade) student.grade = nextClassroom.grade;
  }
}

function addStudentToClassroom(classroom, studentId) {
  const idStr = studentId.toString();
  if (classroom.students && classroom.students.some((sid) => sid.toString() === idStr)) return false;
  classroom.students = classroom.students || [];
  classroom.students.push(studentId);
  classroom.studentCount = (classroom.studentCount || 0) + 1;
  return true;
}

async function generateUniqueAdmissionNumber({ schoolId }) {
  // Short, human-friendly, unique per school. Not exposed as a required UI field.
  // Example: STU-6F3A9C2B
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `STU-${crypto.randomBytes(4).toString('hex')}`.toUpperCase();
    // admissionNumber is unique per school (sparse index). Ensure no collision.
    // eslint-disable-next-line no-await-in-loop
    const exists = await Student.findOne({ schoolId, admissionNumber: candidate }).select('_id').lean();
    if (!exists) return candidate;
  }
  // fallback: timestamp-based
  return `STU-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Propose a new student (teacher). Returns created student populated.
 */
async function proposeStudent({ teacherId, body }) {
  const { fullName, dateOfBirth, gender, classroomId, grade, parentPhone, parentName, parentEmail, studentId, admissionNumber } = body || {};
  const normalizedParentEmail = parentEmail ? String(parentEmail).toLowerCase().trim() : '';

  const classroom = await Classroom.findById(classroomId).populate('schoolId', '_id name');
  if (!classroom) throw { status: 404, message: 'Classroom not found' };
  if (!classroom.teacherId || classroom.teacherId.toString() !== teacherId.toString()) {
    throw { status: 403, message: 'Unauthorized for this classroom' };
  }

  const schoolId = classroom.schoolId?._id || classroom.schoolId;
  const admission = (admissionNumber || studentId || '').trim() || (await generateUniqueAdmissionNumber({ schoolId }));
  const existing = await Student.findOne({ schoolId, admissionNumber: admission });
  if (existing) throw { status: 400, message: 'A student with this admission number already exists in this school' };

  const parent = await findOrCreateParent({ fullName: parentName, email: normalizedParentEmail, phone: parentPhone });

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
    parentEmail: normalizedParentEmail || '',
    parent: parent._id,
    admissionNumber: admission,
    status: 'pending',
    isApproved: false,
    isActive: false,
    createdBy: teacherId,
    proposedBy: teacherId,
  });

  await linkStudentToParent(parent._id, student._id);
  await linkStudentToParentUser({
    studentId: student._id,
    parentEmail: normalizedParentEmail || parent?.email,
    parentPhone: parentPhone || parent?.phone,
  });

  return Student.findById(student._id).populate(studentPopulate);
}

/**
 * Register student by headteacher (auto-approved). Returns created student populated.
 */
async function registerStudentByHeadteacher({ headteacherId, schoolId, body }) {
  const { fullName, dateOfBirth, gender, classroomId, grade, parentPhone, parentName, parentEmail, studentId, admissionNumber } = body || {};
  const normalizedParentEmail = parentEmail ? String(parentEmail).toLowerCase().trim() : '';

  const classroom = await Classroom.findById(classroomId);
  if (!classroom) throw { status: 404, message: 'Classroom not found' };
  if (classroom.schoolId.toString() !== schoolId.toString()) {
    throw { status: 403, message: 'Classroom does not belong to your school' };
  }

  const admission = (admissionNumber || studentId || '').trim() || (await generateUniqueAdmissionNumber({ schoolId }));
  const existing = await Student.findOne({ schoolId, admissionNumber: admission });
  if (existing) throw { status: 400, message: 'A student with this admission number already exists in this school' };

  const parent = await findOrCreateParent({ fullName: parentName, email: normalizedParentEmail, phone: parentPhone });

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
    parentEmail: normalizedParentEmail || '',
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
  await linkStudentToParentUser({
    studentId: student._id,
    parentEmail: normalizedParentEmail || parent?.email,
    parentPhone: parentPhone || parent?.phone,
  });

  return Student.findById(student._id).populate(studentPopulate);
}

/**
 * Get approved students for headteacher school, optional classroom filter.
 */
async function getStudentsForHeadteacher(schoolId, classroomId = null) {
  const filter = { schoolId, isApproved: { $ne: false } };
  if (classroomId) {
    filter.$or = [{ classroom: classroomId }, { classroomId: classroomId }];
  }
  return Student.find(filter)
    .populate('classroom', 'name grade')
    .populate('parent', 'fullName email phone')
    .populate('proposedBy', 'fullName email')
    .populate({ path: 'pendingEdit.proposedBy', select: 'fullName email' })
    .sort({ fullName: 1 });
}

/**
 * Students with a teacher-submitted record change awaiting headteacher approval.
 */
async function getPendingStudentEditsForHeadteacher(schoolId) {
  return Student.find({
    schoolId,
    'pendingEdit.proposedAt': { $exists: true },
  })
    .populate('classroom', 'name grade')
    .populate('parent', 'fullName email phone')
    .populate({ path: 'pendingEdit.proposedBy', select: 'fullName email' })
    .sort({ 'pendingEdit.proposedAt': -1 });
}

async function approvePendingStudentEdit({ studentId, schoolId }) {
  const student = await Student.findById(studentId);
  if (!student) throw { status: 404, message: 'Student not found' };
  if (student.schoolId.toString() !== schoolId.toString()) {
    throw { status: 403, message: 'Student does not belong to your school' };
  }
  if (!student.pendingEdit || !student.pendingEdit.proposedAt) {
    throw { status: 400, message: 'No pending edit to approve' };
  }
  const pe = student.pendingEdit.toObject ? student.pendingEdit.toObject() : { ...student.pendingEdit };
  await applyStudentPatchToDocument(student, pe);
  student.set('pendingEdit', undefined);
  await student.save();
  return Student.findById(student._id).populate(studentPopulate);
}

async function rejectPendingStudentEdit({ studentId, schoolId }) {
  const student = await Student.findById(studentId);
  if (!student) throw { status: 404, message: 'Student not found' };
  if (student.schoolId.toString() !== schoolId.toString()) {
    throw { status: 403, message: 'Student does not belong to your school' };
  }
  if (!student.pendingEdit || !student.pendingEdit.proposedAt) {
    throw { status: 400, message: 'No pending edit to reject' };
  }
  student.set('pendingEdit', undefined);
  await student.save();
  return Student.findById(student._id).populate(studentPopulate);
}

/**
 * Get pending (unapproved) students for headteacher school.
 */
async function getPendingStudentsForHeadteacher(schoolId) {
  return Student.find({
    schoolId,
    isApproved: false,
    status: { $in: ['pending', 'PENDING'] },
  })
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
  await linkStudentToParentUser({
    studentId: student._id,
    parentEmail: student.parentEmail || student.parent?.email,
    parentPhone: student.parentPhone || student.parent?.phone,
  });

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
  getPendingStudentEditsForHeadteacher,
  approvePendingStudentEdit,
  rejectPendingStudentEdit,
  approveStudent,
  rejectStudent,
  applyStudentPatchToDocument,
  STUDENT_PATCH_KEYS,
  pick,
};
