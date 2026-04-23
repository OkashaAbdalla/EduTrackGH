/**
 * Parent Service
 * Find or create parent records; keep parent.students in sync.
 */

const Parent = require('../models/Parent');
const User = require('../models/User');
const Student = require('../models/Student');

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

/**
 * Link student to parent User account (role=parent) by email/phone.
 * This bridges legacy Parent model linking with auth-based parent dashboards.
 */
const linkStudentToParentUser = async ({ studentId, parentEmail, parentPhone }) => {
  const normalizedEmail = parentEmail && String(parentEmail).toLowerCase().trim();
  const normalizedPhone = parentPhone && String(parentPhone).trim();
  if (!normalizedEmail && !normalizedPhone) return null;

  let parentUser = null;
  if (normalizedEmail) {
    parentUser = await User.findOne({ role: 'parent', email: normalizedEmail });
  }
  if (!parentUser && !normalizedEmail && normalizedPhone) {
    parentUser = await User.findOne({ role: 'parent', phone: normalizedPhone });
  }
  if (!parentUser) return null;

  const sid = studentId.toString();
  const exists = (parentUser.children || []).some((id) => id.toString() === sid);
  if (!exists) {
    parentUser.children.push(studentId);
    await parentUser.save();
  }
  return parentUser;
};

/**
 * Backfill any missing child links for a parent user using student.parentEmail/parentPhone.
 */
const syncParentUserChildrenByContact = async ({ parentUserId, parentEmail, parentPhone }) => {
  const normalizedEmail = parentEmail && String(parentEmail).toLowerCase().trim();
  const normalizedPhone = parentPhone && String(parentPhone).trim();
  const parentUser = await User.findById(parentUserId).select('children');
  if (!parentUser) return 0;

  let filter = null;
  if (normalizedEmail) {
    filter = { parentEmail: normalizedEmail };
  } else if (normalizedPhone) {
    filter = { parentPhone: normalizedPhone };
  } else {
    return 0;
  }

  const candidates = await Student.find(filter)
    .select('_id')
    .lean();
  const existing = new Set((parentUser.children || []).map((id) => id.toString()));
  let added = 0;
  candidates.forEach((s) => {
    const sid = s._id.toString();
    if (existing.has(sid)) return;
    parentUser.children.push(s._id);
    existing.add(sid);
    added += 1;
  });
  if (added > 0) await parentUser.save();
  return added;
};

/**
 * Enforce parent dashboard links from canonical parentEmail mapping.
 * If parent has an email, only students with matching parentEmail are kept.
 */
const reconcileParentUserChildrenByEmail = async ({ parentUserId, parentEmail }) => {
  const normalizedEmail = parentEmail && String(parentEmail).toLowerCase().trim();
  if (!normalizedEmail) return 0;

  const [parentUser, students] = await Promise.all([
    User.findById(parentUserId).select('children'),
    Student.find({ parentEmail: normalizedEmail }).select('_id').lean(),
  ]);
  if (!parentUser) return 0;

  const targetIds = students.map((s) => s._id.toString());
  const currentIds = (parentUser.children || []).map((id) => id.toString());
  const sameLength = targetIds.length === currentIds.length;
  const sameMembers = sameLength && targetIds.every((id) => currentIds.includes(id));
  if (sameMembers) return 0;

  parentUser.children = students.map((s) => s._id);
  await parentUser.save();
  return 1;
};

module.exports = {
  findOrCreateParent,
  linkStudentToParent,
  linkStudentToParentUser,
  syncParentUserChildrenByContact,
  reconcileParentUserChildrenByEmail,
};
