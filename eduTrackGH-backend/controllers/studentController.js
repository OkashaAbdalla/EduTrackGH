/**
 * Student Controller
 * Teacher proposes students; headteacher approves and links to parents.
 */

const Student = require('../models/Student');
const Classroom = require('../models/Classroom');
const User = require('../models/User');

// Teacher: propose a new student for their classroom
const proposeStudent = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const {
      studentId,
      fullName,
      dateOfBirth,
      gender,
      classroomId,
      grade,
      parentPhone,
      parentName,
      parentEmail,
    } = req.body || {};

    if (!studentId || !fullName || !classroomId) {
      return res.status(400).json({
        success: false,
        message: 'studentId, fullName and classroomId are required',
      });
    }

    // Verify classroom belongs to this teacher
    const classroom = await Classroom.findById(classroomId).populate('schoolId', '_id name');
    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found' });
    }
    if (!classroom.teacherId || classroom.teacherId.toString() !== teacherId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized for this classroom' });
    }

    // Ensure studentId is unique
    const existing = await Student.findOne({ studentId: studentId.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A student with this ID already exists',
      });
    }

    const student = await Student.create({
      studentId: studentId.toUpperCase().trim(),
      fullName: fullName.trim(),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      schoolId: classroom.schoolId._id || classroom.schoolId,
      classroomId: classroom._id,
      grade: grade || classroom.grade,
      parentPhone: parentPhone || '',
      parentName: parentName || '',
      parentEmail: parentEmail || '',
      status: 'PENDING',
      isActive: false,
      createdBy: teacherId,
    });

    res.status(201).json({
      success: true,
      message: 'Student proposed successfully. Awaiting headteacher approval.',
      student,
    });
  } catch (error) {
    console.error('proposeStudent error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to propose student',
    });
  }
};

// Headteacher: get all pending students for their school
const getPendingStudentsForHeadteacher = async (req, res) => {
  try {
    const headteacher = await User.findById(req.user._id);
    if (!headteacher || headteacher.role !== 'headteacher' || !headteacher.school) {
      return res.status(403).json({
        success: false,
        message: 'Headteacher with assigned school required',
      });
    }

    const pending = await Student.find({
      schoolId: headteacher.school,
      status: 'PENDING',
    })
      .populate('classroomId', 'name grade')
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pending.length,
      students: pending,
    });
  } catch (error) {
    console.error('getPendingStudentsForHeadteacher error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load pending students',
    });
  }
};

// Headteacher: approve a proposed student
const approveStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const headteacher = await User.findById(req.user._id);
    if (!headteacher || headteacher.role !== 'headteacher' || !headteacher.school) {
      return res.status(403).json({
        success: false,
        message: 'Headteacher with assigned school required',
      });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (student.schoolId.toString() !== headteacher.school.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Student does not belong to your school',
      });
    }

    if (student.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending students can be approved',
      });
    }

    student.status = 'ACTIVE';
    student.isActive = true;
    student.approvedBy = headteacher._id;
    student.approvedAt = new Date();
    await student.save();

    // Link to parent account if exists (by email or phone)
    if (student.parentEmail || student.parentPhone) {
      const parentQuery = {
        role: 'parent',
        $or: [],
      };
      if (student.parentEmail) {
        parentQuery.$or.push({ email: student.parentEmail.toLowerCase().trim() });
      }
      if (student.parentPhone) {
        parentQuery.$or.push({ phone: student.parentPhone.trim() });
      }

      if (parentQuery.$or.length > 0) {
        const parent = await User.findOne(parentQuery);
        if (parent) {
          const alreadyLinked = parent.children?.some(
            (c) => c.toString() === student._id.toString()
          );
          if (!alreadyLinked) {
            parent.children = parent.children || [];
            parent.children.push(student._id);
            await parent.save();
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Student approved successfully',
      student,
    });
  } catch (error) {
    console.error('approveStudent error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve student',
    });
  }
};

// Headteacher: reject a proposed student
const rejectStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const headteacher = await User.findById(req.user._id);
    if (!headteacher || headteacher.role !== 'headteacher' || !headteacher.school) {
      return res.status(403).json({
        success: false,
        message: 'Headteacher with assigned school required',
      });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (student.schoolId.toString() !== headteacher.school.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Student does not belong to your school',
      });
    }

    if (student.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending students can be rejected',
      });
    }

    student.status = 'REJECTED';
    student.isActive = false;
    student.approvedBy = headteacher._id;
    student.approvedAt = new Date();
    await student.save();

    res.json({
      success: true,
      message: 'Student rejected',
      student,
    });
  } catch (error) {
    console.error('rejectStudent error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject student',
    });
  }
};

module.exports = {
  proposeStudent,
  getPendingStudentsForHeadteacher,
  approveStudent,
  rejectStudent,
};

