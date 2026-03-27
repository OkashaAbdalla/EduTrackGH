/**
 * Modal to view teacher details for a class (Manage Classes)
 */

import { Card } from '../common';

export default function ClassViewDetailsModal({ classItem, onClose }) {
  if (!classItem) return null;

  const hasTeacher = classItem.teacherId && classItem.teacherName !== 'Unassigned';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 animate-scale-in">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Class Details</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Class</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{classItem.name} (Grade {classItem.grade})</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Assigned Teacher</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{classItem.teacherName || 'Unassigned'}</p>
            </div>
            {hasTeacher && (
              <>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Teacher Email</p>
                  <p className="text-sm text-gray-900 dark:text-white">{classItem.teacherEmail || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</p>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      classItem.teacherStatus === 'Available'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {classItem.teacherStatus || 'Not available'}
                  </span>
                </div>
              </>
            )}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Students</p>
              <p className="text-sm text-gray-900 dark:text-white">{classItem.students || 0}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </Card>
    </div>
  );
}
