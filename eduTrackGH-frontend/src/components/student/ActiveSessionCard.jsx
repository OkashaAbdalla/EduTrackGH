/**
 * Active Session Card Component
 * Purpose: Display individual active session with mark attendance action
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

const ActiveSessionCard = ({ session }) => {
  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = Math.floor((end - now) / 1000 / 60);
    
    if (diff < 0) return 'Expired';
    if (diff < 60) return `${diff} min left`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m left`;
  };

  const timeRemaining = getTimeRemaining(session.endTime);
  const isExpired = timeRemaining === 'Expired';

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{session.courseName}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{session.courseCode}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${isExpired ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
          {isExpired ? 'Expired' : 'Active'}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
          </svg>
          {session.lecturerName}
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
          </svg>
          {timeRemaining}
        </div>
      </div>

      <Link
        to={`${ROUTES.MARK_ATTENDANCE}/${session.id}`}
        className={`block w-full text-center py-2.5 rounded-lg font-medium transition-all duration-300 text-sm ${
          isExpired
            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg'
        }`}
        onClick={(e) => isExpired && e.preventDefault()}
      >
        {session.hasMarked ? 'Attendance Marked ✓' : 'Mark Attendance'}
      </Link>
    </div>
  );
};

export default ActiveSessionCard;
