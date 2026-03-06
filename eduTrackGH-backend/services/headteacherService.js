/**
 * Headteacher service – classroom bootstrap and list
 */

const Classroom = require('../models/Classroom');
const School = require('../models/School');

const DEFAULT_PRIMARY = [
  { grade: 'P1', name: 'P1' },
  { grade: 'P2', name: 'P2' },
  { grade: 'P3', name: 'P3' },
  { grade: 'P4', name: 'P4' },
  { grade: 'P5', name: 'P5' },
  { grade: 'P6', name: 'P6' },
];
const DEFAULT_JHS = [
  { grade: 'JHS 1', name: 'JHS 1' },
  { grade: 'JHS 2', name: 'JHS 2' },
  { grade: 'JHS 3', name: 'JHS 3' },
];

function getDefinitionsForLevel(schoolLevel) {
  let definitions = [];
  if (schoolLevel === 'PRIMARY' || schoolLevel === 'BOTH') definitions = definitions.concat(DEFAULT_PRIMARY);
  if (schoolLevel === 'JHS' || schoolLevel === 'BOTH') definitions = definitions.concat(DEFAULT_JHS);
  return definitions;
}

async function getClassroomsWithBootstrap(schoolId, userSchoolLevel) {
  let classrooms = await Classroom.find({ schoolId, isActive: true })
    .select('_id name grade studentCount teacherId')
    .populate('teacherId', 'fullName');

  if (classrooms.length > 0) return classrooms;

  let schoolLevel = userSchoolLevel;
  if (!schoolLevel) {
    const schoolDoc = await School.findById(schoolId).select('schoolLevel');
    schoolLevel = schoolDoc?.schoolLevel || 'PRIMARY';
  }
  const definitions = getDefinitionsForLevel(schoolLevel);
  if (definitions.length === 0) return classrooms;

  const payload = definitions.map((d) => ({ name: d.name, grade: d.grade, schoolId }));
  await Classroom.insertMany(payload);
  try {
    await School.findByIdAndUpdate(schoolId, { $inc: { totalClassrooms: payload.length } }, { new: false });
  } catch (_) {}

  return Classroom.find({ schoolId, isActive: true })
    .select('_id name grade studentCount teacherId')
    .populate('teacherId', 'fullName');
}

async function seedDefaultClassrooms(schoolId, schoolLevel) {
  const definitions = getDefinitionsForLevel(schoolLevel || 'PRIMARY');
  if (!definitions.length) return { createdCount: 0, classrooms: await listClassrooms(schoolId) };

  const existing = await Classroom.find({ schoolId, grade: { $in: definitions.map((d) => d.grade) } }).select('grade');
  const existingGrades = new Set(existing.map((c) => c.grade));
  const toCreate = definitions.filter((d) => !existingGrades.has(d.grade)).map((d) => ({ name: d.name, grade: d.grade, schoolId }));

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
    .select('_id name grade studentCount teacherId')
    .populate('teacherId', 'fullName');
}

module.exports = {
  getClassroomsWithBootstrap,
  seedDefaultClassrooms,
  listClassrooms,
  getDefinitionsForLevel,
};
