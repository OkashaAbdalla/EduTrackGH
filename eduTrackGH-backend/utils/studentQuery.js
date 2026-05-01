/**
 * Shared Mongo filters so pending teacher proposals stay out of rosters until approved.
 * Pending/rejected: isApproved === false. Legacy docs may omit isApproved (treat as registered).
 */

function approvedOnly() {
  return { isApproved: { $ne: false } };
}

/** Students assigned to a classroom who count on the official roster (approved headteacher). */
function approvedInClassroom(classroomId) {
  return {
    $and: [{ $or: [{ classroomId }, { classroom: classroomId }] }, approvedOnly()],
  };
}

/** Same as approvedInClassroom but for many classrooms (school-level stats). */
function approvedInClassroomIds(classroomIds) {
  if (!classroomIds?.length) return { _id: { $exists: false } };
  return {
    $and: [
      {
        $or: [{ classroomId: { $in: classroomIds } }, { classroom: { $in: classroomIds } }],
      },
      approvedOnly(),
    ],
  };
}

/**
 * Teacher "Manage students" / proposal awareness: official roster plus this teacher's own
 * unapproved rows in that class (pending or rejected), so they can open Edit for corrections.
 * Does not expose other teachers' pending proposals.
 */
function teacherClassroomWithOwnPending(classroomId, teacherObjectId) {
  return {
    $and: [
      { $or: [{ classroomId }, { classroom: classroomId }] },
      {
        $or: [
          approvedOnly(),
          {
            isApproved: false,
            $or: [{ createdBy: teacherObjectId }, { proposedBy: teacherObjectId }],
          },
        ],
      },
    ],
  };
}

module.exports = {
  approvedOnly,
  approvedInClassroom,
  approvedInClassroomIds,
  teacherClassroomWithOwnPending,
};
