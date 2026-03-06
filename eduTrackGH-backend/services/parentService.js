/**
 * Parent Service
 * Find or create parent records; keep parent.students in sync.
 */

const Parent = require('../models/Parent');

/**
 * Find existing parent by email or phone, or create new one.
 * @param {{ fullName: string, email?: string, phone?: string }}
 * @returns {Promise<import('../models/Parent')>}
 */
const findOrCreateParent = async ({ fullName, email, phone }) => {
  const trimmedName = fullName && String(fullName).trim();
  const trimmedEmail = email && String(email).toLowerCase().trim();
  const trimmedPhone = phone && String(phone).trim();

  if (!trimmedName) {
    throw new Error('Parent full name is required');
  }

  let parent = null;
  if (trimmedEmail) {
    parent = await Parent.findOne({ email: trimmedEmail });
  }
  if (!parent && trimmedPhone) {
    parent = await Parent.findOne({ phone: trimmedPhone });
  }
  if (!parent) {
    parent = await Parent.create({
      fullName: trimmedName,
      email: trimmedEmail || undefined,
      phone: trimmedPhone || '',
    });
  }
  return parent;
};

/**
 * Add student to parent.students if not already present.
 */
const linkStudentToParent = async (parentId, studentId) => {
  const parent = await Parent.findById(parentId);
  if (!parent) return;
  const idStr = studentId.toString();
  if (parent.students.some((sid) => sid.toString() === idStr)) return;
  parent.students.push(studentId);
  await parent.save();
};

module.exports = {
  findOrCreateParent,
  linkStudentToParent,
};
