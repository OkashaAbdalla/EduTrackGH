/**
 * Headteacher – classrooms (list with bootstrap, seed default, assign teacher)
 */

const User = require('../models/User');
const Classroom = require('../models/Classroom');
const { getClassroomsWithBootstrap, seedDefaultClassrooms, getDefinitionsForLevel } = require('../services/headteacherService');

function getSchoolId(req) {
  return req.user?.school || null;
}

const getClassroomsForSchool = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }
    const classrooms = await getClassroomsWithBootstrap(schoolId, req.user.schoolLevel);
    res.json({ success: true, classrooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get classrooms' });
  }
};

const seedDefaultClassroomsForSchool = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const schoolLevel = req.user.schoolLevel || 'PRIMARY';
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }
    if (!getDefinitionsForLevel(schoolLevel).length) {
      return res.status(400).json({ success: false, message: 'No default classroom set defined for your school level' });
    }
    const { createdCount, classrooms } = await seedDefaultClassrooms(schoolId, schoolLevel);
    const message = createdCount > 0 ? 'Default classrooms created successfully' : 'All default classrooms already exist';
    res.status(createdCount > 0 ? 201 : 200).json({
      success: true,
      message,
      createdCount,
      classrooms,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create default classrooms' });
  }
};

const assignClassTeacher = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }
    const { id } = req.params;
    const { teacherId } = req.body;
    if (!teacherId) return res.status(400).json({ success: false, message: 'Teacher ID is required' });

    const teacher = await User.findOne({ _id: teacherId, role: 'teacher', schoolId });
    if (!teacher) return res.status(400).json({ success: false, message: 'Invalid teacher for this school' });

    const classroom = await Classroom.findOneAndUpdate({ _id: id, schoolId }, { teacherId }, { new: true }).populate('teacherId', 'fullName');
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found for your school' });

    res.json({ success: true, message: 'Teacher assigned to classroom successfully', classroom });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to assign teacher' });
  }
};

module.exports = {
  getClassroomsForSchool,
  seedDefaultClassroomsForSchool,
  assignClassTeacher,
};
