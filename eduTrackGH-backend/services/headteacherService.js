/**
 * Headteacher service – classroom bootstrap and list
 */

const Classroom = require('../models/Classroom');
const School = require('../models/School');

const DEFAULT_PRIMARY = [
  { grade: 'P1', name: 'P1', level: 'Primary' },
  { grade: 'P2', name: 'P2', level: 'Primary' },
  { grade: 'P3', name: 'P3', level: 'Primary' },
  { grade: 'P4', name: 'P4', level: 'Primary' },
  { grade: 'P5', name: 'P5', level: 'Primary' },
  { grade: 'P6', name: 'P6', level: 'Primary' },
];
const DEFAULT_JHS = [
  { grade: 'JHS 1', name: 'JHS 1', level: 'JHS' },
  { grade: 'JHS 2', name: 'JHS 2', level: 'JHS' },
  { grade: 'JHS 3', name: 'JHS 3', level: 'JHS' },
];

function getDefinitionsForLevel(schoolLevel) {
  let definitions = [];
  if (schoolLevel === 'PRIMARY' || schoolLevel === 'BOTH') definitions = definitions.concat(DEFAULT_PRIMARY);
  if (schoolLevel === 'JHS' || schoolLevel === 'BOTH') definitions = definitions.concat(DEFAULT_JHS);
  return definitions;
}

function getClassroomLevelFilter(userSchoolLevel) {
  if (userSchoolLevel === 'PRIMARY') {
    return {
      $or: [
        { level: 'Primary' },
        // legacy rows without `level`
        { level: { $exists: false }, grade: { $regex: /^P/i } },
      ],
    };
  }
  if (userSchoolLevel === 'JHS') {
    return {
      $or: [
        { level: 'JHS' },
        { level: { $exists: false }, grade: { $regex: /^JHS/i } },
      ],
    };
  }
  // fallback: no filter
  return {};
}

async function getClassroomsWithBootstrap(schoolId, userSchoolLevel) {
  const levelFilter = getClassroomLevelFilter(userSchoolLevel);
  let classrooms = await Classroom.find({ schoolId, isActive: true, ...levelFilter })
    .select('_id name grade level studentCount teacherId')
    .populate('teacherId', 'fullName email isActive');

  if (classrooms.length > 0) return classrooms;

  let schoolLevel = userSchoolLevel;
  if (!schoolLevel) {
    const schoolDoc = await School.findById(schoolId).select('schoolLevel');
    schoolLevel = schoolDoc?.schoolLevel || 'PRIMARY';
  }
  const definitions = getDefinitionsForLevel(schoolLevel);
  if (definitions.length === 0) return classrooms;

  const payload = definitions.map((d) => ({ name: d.name, grade: d.grade, level: d.level, schoolId }));
  await Classroom.insertMany(payload);
  try {
    await School.findByIdAndUpdate(schoolId, { $inc: { totalClassrooms: payload.length } }, { new: false });
  } catch (_) {}

  return Classroom.find({ schoolId, isActive: true, ...levelFilter })
    .select('_id name grade level studentCount teacherId')
    .populate('teacherId', 'fullName email isActive');
}

async function seedDefaultClassrooms(schoolId, schoolLevel) {
  const definitions = getDefinitionsForLevel(schoolLevel || 'PRIMARY');
  if (!definitions.length) return { createdCount: 0, classrooms: await listClassrooms(schoolId) };

  const existing = await Classroom.find({ schoolId, grade: { $in: definitions.map((d) => d.grade) } }).select('grade');
  const existingGrades = new Set(existing.map((c) => c.grade));
  const toCreate = definitions
    .filter((d) => !existingGrades.has(d.grade))
    .map((d) => ({ name: d.name, grade: d.grade, level: d.level, schoolId }));

  if (!toCreate.length) {
    return { createdCount: 0, classrooms: await listClassrooms(schoolId) };
  }

  await Classroom.insertMany(toCreate);
  try {
    await School.findByIdAndUpdate(schoolId, { $inc: { totalClassrooms: toCreate.length } }, { new: false });
  } catch (_) {}
  return { createdCount: toCreate.length, classrooms: await listClassrooms(schoolId) };
}

function listClassrooms(schoolId) {
  return Classroom.find({ schoolId, isActive: true })
    .select('_id name grade level studentCount teacherId')
    .populate('teacherId', 'fullName email isActive');
}

module.exports = {
  getClassroomsWithBootstrap,
  seedDefaultClassrooms,
  listClassrooms,
  getDefinitionsForLevel,
  getClassroomLevelFilter,
};
