/**
 * Admin – schools (CRUD, toggle status)
 */

const User = require('../models/User');
const School = require('../models/School');

const getSchools = async (req, res) => {
  try {
    const schools = await School.find().populate('headteacher', 'fullName email phone').sort({ createdAt: -1 });
    res.json({ success: true, count: schools.length, schools });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get schools' });
  }
};

const createSchool = async (req, res) => {
  try {
    const { name, schoolLevel, location, contact, headteacherId } = req.body;
    if (!name || !schoolLevel) return res.status(400).json({ success: false, message: 'School name and level are required' });

    if (headteacherId) {
      const headteacher = await User.findById(headteacherId);
      if (!headteacher || headteacher.role !== 'headteacher') return res.status(400).json({ success: false, message: 'Invalid headteacher' });
    }

    const school = await School.create({ name, schoolLevel, location: location || {}, contact: contact || {}, headteacher: headteacherId || null });
    if (headteacherId) await User.findByIdAndUpdate(headteacherId, { school: school._id });

    const populatedSchool = await School.findById(school._id).populate('headteacher', 'fullName email phone');
    res.status(201).json({ success: true, message: 'School created successfully', school: populatedSchool });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create school' });
  }
};

const updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const { headteacherId, ...rest } = req.body;
    const school = await School.findById(id);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });

    const previousHeadteacherId = school.headteacher?.toString?.() || school.headteacher;

    if (headteacherId !== undefined) {
      const newHeadteacherId = headteacherId === '' || headteacherId === null ? null : headteacherId;

      if (newHeadteacherId) {
        const headteacher = await User.findById(newHeadteacherId);
        if (!headteacher || headteacher.role !== 'headteacher') return res.status(400).json({ success: false, message: 'Invalid headteacher' });
        if (headteacher.school && headteacher.school.toString() !== id) {
          const previousSchool = await School.findById(headteacher.school);
          if (previousSchool && previousSchool.headteacher?.toString() === headteacher._id.toString()) {
            previousSchool.headteacher = null;
            await previousSchool.save();
          }
        }
      }

      if (previousHeadteacherId) await User.findByIdAndUpdate(previousHeadteacherId, { $unset: { school: 1 } });
      if (newHeadteacherId) await User.findByIdAndUpdate(newHeadteacherId, { school: id });
      school.headteacher = newHeadteacherId;
    }

    Object.assign(school, rest);
    await school.save();
    const updatedSchool = await School.findById(id).populate('headteacher', 'fullName email phone');
    res.json({ success: true, message: 'School updated successfully', school: updatedSchool });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update school' });
  }
};

const toggleSchoolStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findById(id);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    school.isActive = !school.isActive;
    await school.save();
    res.json({ success: true, message: `School ${school.isActive ? 'activated' : 'deactivated'} successfully`, school });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to toggle school status' });
  }
};

module.exports = { getSchools, createSchool, updateSchool, toggleSchoolStatus };
