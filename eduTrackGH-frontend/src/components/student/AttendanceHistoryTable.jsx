/**
 * Attendance History Table Component
 * Purpose: Display student's past attendance records
 */

const AttendanceHistoryTable = ({ records }) => {
  const getStatusBadge = (status) => {
    const styles = {
      present: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
      absent: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
      late: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getConfidenceBadge = (confidence) => {
    const value = Math.round(confidence * 100);
    const color = value >= 80 ? 'text-green-600 dark:text-green-400' : value >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
    return <span className={`font-medium ${color}`}>{value}%</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Date</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Course</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Time</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Status</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Confidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {records.map((record) => (
            <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
              <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{record.date}</td>
              <td className="px-3 py-2">
                <div className="font-medium text-gray-900 dark:text-gray-100">{record.courseCode}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{record.courseName}</div>
              </td>
              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{record.time}</td>
              <td className="px-3 py-2">{getStatusBadge(record.status)}</td>
              <td className="px-3 py-2">{record.confidence ? getConfidenceBadge(record.confidence) : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceHistoryTable;
