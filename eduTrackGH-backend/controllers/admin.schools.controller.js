/**
 * Admin – schools (CRUD, toggle status)
 */

const User = require('../models/User');
const School = require('../models/School');

const normalizeSchoolHeadteachers = async (school) => {
  // Backward-compat: if legacy `headteacher` exists and new fields are empty, infer slot.
  if (!school) return school;
  if (school.headteacher && !school.primaryHeadteacher && !school.jhsHeadteacher) {
    try {
      const ht = await User.findById(school.headteacher).select('schoolLevel role');
      if (ht && ht.role === 'headteacher') {
        if (ht.schoolLevel === 'PRIMARY') school.primaryHeadteacher = school.headteacher;
        if (ht.schoolLevel === 'JHS') school.jhsHeadteacher = school.headteacher;
      }
    } catch {
      // ignore inference failures
    }
  }
  return school;
};

const validateHeadteacherForSchoolLevel = (schoolLevel, headteacher) => {
  if (!headteacher || headteacher.role !== 'headteacher') return { ok: false, message: 'Invalid headteacher' };
  if (!headteacher.schoolLevel || !['PRIMARY', 'JHS'].includes(headteacher.schoolLevel)) {
    return { ok: false, message: 'Headteacher must have a valid schoolLevel (PRIMARY or JHS)' };
  }
  if (schoolLevel === 'BOTH') return { ok: true };
  if (schoolLevel !== headteacher.schoolLevel) {
    return { ok: false, message: `Headteacher level (${headteacher.schoolLevel}) does not match school level (${schoolLevel})` };
  }
  return { ok: true };
};

const getSchools = async (req, res) => {
  try {
    const schools = await School.find()
      .populate('headteacher', 'fullName email phone schoolLevel')
      .populate('primaryHeadteacher', 'fullName email phone schoolLevel')
      .populate('jhsHeadteacher', 'fullName email phone schoolLevel')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: schools.length, schools });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get schools' });
  }
};

const createSchool = async (req, res) => {
  try {
    const { name, schoolLevel, location, contact, headteacherId, primaryHeadteacherId, jhsHeadteacherId } = req.body;
    if (!name || !schoolLevel) return res.status(400).json({ success: false, message: 'School name and level are required' });

    // Support both new-slot assignment and legacy headteacherId.
    let primaryId = primaryHeadteacherId || null;
    let jhsId = jhsHeadteacherId || null;

    if (headteacherId && !primaryId && !jhsId) {
      const ht = await User.findById(headteacherId);
      const v = validateHeadteacherForSchoolLevel(schoolLevel, ht);
      if (!v.ok) return res.status(400).json({ success: false, message: v.message });
      if (ht.schoolLevel === 'PRIMARY') primaryId = headteacherId;
      if (ht.schoolLevel === 'JHS') jhsId = headteacherId;
    }

    if (primaryId) {
      const ht = await User.findById(primaryId);
      const v = validateHeadteacherForSchoolLevel(schoolLevel === 'BOTH' ? 'BOTH' : 'PRIMARY', ht);
      if (!v.ok) return res.status(400).json({ success: false, message: v.message });
    }
    if (jhsId) {
      const ht = await User.findById(jhsId);
      const v = validateHeadteacherForSchoolLevel(schoolLevel === 'BOTH' ? 'BOTH' : 'JHS', ht);
      if (!v.ok) return res.status(400).json({ success: false, message: v.message });
    }

    const school = await School.create({
      name,
      schoolLevel,
      location: location || {},
      contact: contact || {},
      primaryHeadteacher: primaryId,
      jhsHeadteacher: jhsId,
      // keep legacy field for compatibility with older clients
      headteacher: schoolLevel === 'PRIMARY' ? primaryId : schoolLevel === 'JHS' ? jhsId : null,
    });

    if (primaryId) await User.findByIdAndUpdate(primaryId, { school: school._id });
    if (jhsId) await User.findByIdAndUpdate(jhsId, { school: school._id });

    const populatedSchool = await School.findById(school._id)
      .populate('headteacher', 'fullName email phone schoolLevel')
      .populate('primaryHeadteacher', 'fullName email phone schoolLevel')
      .populate('jhsHeadteacher', 'fullName email phone schoolLevel');
    res.status(201).json({ success: true, message: 'School created successfully', school: populatedSchool });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create school' });
  }
};

const updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const { headteacherId, primaryHeadteacherId, jhsHeadteacherId, ...rest } = req.body;
    let school = await School.findById(id);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });

    school = await normalizeSchoolHeadteachers(school);

    const previousPrimaryId = school.primaryHeadteacher?.toString?.() || school.primaryHeadteacher;
    const previousJhsId = school.jhsHeadteacher?.toString?.() || school.jhsHeadteacher;
    const previousHeadteacherId = school.headteacher?.toString?.() || school.headteacher;

    // Legacy path: allow `headteacherId` to still work for single-level schools.
    // For BOTH schools, prefer `primaryHeadteacherId`/`jhsHeadteacherId`.
    let nextPrimaryId = primaryHeadteacherId !== undefined ? (primaryHeadteacherId === '' || primaryHeadteacherId === null ? null : primaryHeadteacherId) : previousPrimaryId || null;
    let nextJhsId = jhsHeadteacherId !== undefined ? (jhsHeadteacherId === '' || jhsHeadteacherId === null ? null : jhsHeadteacherId) : previousJhsId || null;

    if (headteacherId !== undefined && primaryHeadteacherId === undefined && jhsHeadteacherId === undefined) {
      const legacyId = headteacherId === '' || headteacherId === null ? null : headteacherId;
      if (legacyId) {
        const ht = await User.findById(legacyId);
        const v = validateHeadteacherForSchoolLevel(school.schoolLevel, ht);
        if (!v.ok) return res.status(400).json({ success: false, message: v.message });
        if (ht.schoolLevel === 'PRIMARY') nextPrimaryId = legacyId;
        if (ht.schoolLevel === 'JHS') nextJhsId = legacyId;
      } else {
        // unassign legacy
        nextPrimaryId = null;
        nextJhsId = null;
      }
    }

    if (nextPrimaryId) {
      const ht = await User.findById(nextPrimaryId);
      const v = validateHeadteacherForSchoolLevel(school.schoolLevel === 'BOTH' ? 'BOTH' : 'PRIMARY', ht);
      if (!v.ok) return res.status(400).json({ success: false, message: v.message });
      if (ht.school && ht.school.toString() !== id) {
        const prevSchool = await School.findById(ht.school);
        if (prevSchool) {
          if (prevSchool.primaryHeadteacher?.toString?.() === ht._id.toString()) prevSchool.primaryHeadteacher = null;
          if (prevSchool.headteacher?.toString?.() === ht._id.toString()) prevSchool.headteacher = null;
          await prevSchool.save();
        }
      }
    }
    if (nextJhsId) {
      const ht = await User.findById(nextJhsId);
      const v = validateHeadteacherForSchoolLevel(school.schoolLevel === 'BOTH' ? 'BOTH' : 'JHS', ht);
      if (!v.ok) return res.status(400).json({ success: false, message: v.message });
      if (ht.school && ht.school.toString() !== id) {
        const prevSchool = await School.findById(ht.school);
        if (prevSchool) {
          if (prevSchool.jhsHeadteacher?.toString?.() === ht._id.toString()) prevSchool.jhsHeadteacher = null;
          if (prevSchool.headteacher?.toString?.() === ht._id.toString()) prevSchool.headteacher = null;
          await prevSchool.save();
        }
      }
    }

    // unlink previous headteachers no longer assigned
    if (previousPrimaryId && (!nextPrimaryId || String(previousPrimaryId) !== String(nextPrimaryId))) {
      await User.findByIdAndUpdate(previousPrimaryId, { $unset: { school: 1 } });
    }
    if (previousJhsId && (!nextJhsId || String(previousJhsId) !== String(nextJhsId))) {
      await User.findByIdAndUpdate(previousJhsId, { $unset: { school: 1 } });
    }

    if (nextPrimaryId) await User.findByIdAndUpdate(nextPrimaryId, { school: id });
    if (nextJhsId) await User.findByIdAndUpdate(nextJhsId, { school: id });

    school.primaryHeadteacher = nextPrimaryId;
    school.jhsHeadteacher = nextJhsId;
    school.headteacher =
      school.schoolLevel === 'PRIMARY'
        ? nextPrimaryId
        : school.schoolLevel === 'JHS'
          ? nextJhsId
          : null;

    const { location: locUpdate, ...restFields } = rest;
    if (locUpdate && typeof locUpdate === 'object') {
      school.location = school.location || {};
      ['region', 'district', 'address'].forEach((k) => {
        if (locUpdate[k] !== undefined) school.location[k] = locUpdate[k];
      });
    }
    Object.assign(school, restFields);
    await school.save();
    const updatedSchool = await School.findById(id)
      .populate('headteacher', 'fullName email phone schoolLevel')
      .populate('primaryHeadteacher', 'fullName email phone schoolLevel')
      .populate('jhsHeadteacher', 'fullName email phone schoolLevel');
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
