/**
 * StudentAttendanceRow
 * Presentational row for marking one student's attendance (present/late/absent).
 * Receives student and onStatusChange callback.
 */

function StudentAttendanceRow({ student, onStatusChange }) {
  const initials = student.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2);
  const status = student.status || 'present';

  const buttonClass = (s) =>
    status === s
      ? s === 'present'
        ? 'bg-green-600 text-white'
        : s === 'late'
        ? 'bg-orange-600 text-white'
        : 'bg-red-600 text-white'
      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30';

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{initials}</span>
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{student.fullName}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{student.studentId || student.studentIdNumber}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {['present', 'late', 'absent'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onStatusChange(student._id, s)}
            className={`px-4 py-2 rounded-lg font-medium transition capitalize ${buttonClass(s)}`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export default StudentAttendanceRow;
