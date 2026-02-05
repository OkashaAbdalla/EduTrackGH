/**
 * Parent Dashboard
 * Purpose: View children's attendance for smartphone parents
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { ROUTES } from '../../utils/constants';
import { Card } from '../../components/common';

const ParentDashboard = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with real API call
    const fetchChildren = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      setChildren([
        { id: 1, name: 'Kofi Mensah', class: 'Primary 4', attendanceRate: 95, recentAbsences: 0 },
        { id: 2, name: 'Ama Mensah', class: 'JHS 2', attendanceRate: 88, recentAbsences: 2 },
      ]);
      setLoading(false);
    };
    fetchChildren();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Parent Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor your children's attendance and receive alerts</p>
        </div>

        {/* Children List */}
        <div className="space-y-4">
          {children.map((child) => (
            <Link key={child.id} to={`${ROUTES.CHILDREN_ATTENDANCE}/${child.id}`}>
              <Card variant="action" hover className="p-6 group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-2xl font-bold text-white">{child.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{child.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{child.class}</p>
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">Attendance Rate</p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">{child.attendanceRate}%</p>
                          </div>
                        </div>
                        {child.recentAbsences > 0 && (
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-500">Recent Absences</p>
                              <p className="text-lg font-bold text-red-600 dark:text-red-400">{child.recentAbsences}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 group-hover:translate-x-1 transition-transform">
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link to={ROUTES.CHILDREN_ATTENDANCE}>
            <Card variant="action" hover className="p-6 group cursor-pointer">
              <div className="flex items-center space-x-5">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">View All Attendance</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">See detailed attendance history</p>
                  <div className="mt-3 flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                    <span>View details</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <Link to={ROUTES.PARENT_NOTIFICATIONS}>
            <Card variant="action" hover className="p-6 group cursor-pointer">
              <div className="flex items-center space-x-5">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Notifications</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">View absence alerts and updates</p>
                  <div className="mt-3 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                    <span>View alerts</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ParentDashboard;
