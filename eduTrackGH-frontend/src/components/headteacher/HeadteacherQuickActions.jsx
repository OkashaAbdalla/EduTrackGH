/**
 * Quick action cards for Headteacher Dashboard
 */

import { Link } from 'react-router-dom';
import { Card } from '../common';
import { ROUTES } from '../../utils/constants';

export default function HeadteacherQuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <Link to={ROUTES.SCHOOL_REPORTS}>
        <Card variant="action" hover className="p-6 group cursor-pointer">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">School Reports</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">View comprehensive attendance reports</p>
              <div className="mt-3 flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                <span>View reports</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </Card>
      </Link>
      <Link to={ROUTES.HEADTEACHER_MANAGE_STUDENTS}>
        <Card variant="action" hover className="p-6 group cursor-pointer">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Manage Students</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Review and approve student registrations</p>
              <div className="mt-3 flex items-center text-purple-600 dark:text-purple-400 text-sm font-medium">
                <span>Review pending</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </Card>
      </Link>
      <Link to={ROUTES.TEACHER_COMPLIANCE}>
        <Card variant="action" hover className="p-6 group cursor-pointer">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Teacher Compliance</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monitor daily attendance marking compliance</p>
              <div className="mt-3 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                <span>Check compliance</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}
