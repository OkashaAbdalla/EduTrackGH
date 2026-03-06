/**
 * Admin Dashboard Page
 * Purpose: Main admin control panel
 * Shows: System stats, recent activities, quick actions
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { Card, Skeleton } from '../../components/common';
import adminService from '../../services/adminService';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalHeadteachers: 0,
    totalTeachers: 0,
    totalStudents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load cached data immediately for instant display
    const loadStats = async () => {
      try {
        // Try to get cached data first (returns immediately if available)
        const cachedResponse = await adminService.getStats(true);
        if (cachedResponse?.stats) {
          setStats(cachedResponse.stats);
          setLoading(false);
        }
        
        // Always fetch fresh data in background
        const response = await adminService.getStats(false);
        if (response.success && response.stats) {
          setStats(response.stats);
        }
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">System overview and management</p>
        </div>

        {/* Stats Grid */}
        {loading && stats.totalSchools === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} variant="stats" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
            <Card variant="stats" className="p-6 border-l-4 border-l-blue-500 dark:border-l-blue-400">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Total Schools</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalSchools}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Registered schools</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card variant="stats" className="p-6 border-l-4 border-l-green-500 dark:border-l-green-400">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Headteachers</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalHeadteachers}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Primary & JHS</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card variant="stats" className="p-6 border-l-4 border-l-orange-500 dark:border-l-orange-400">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Total Teachers</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalTeachers}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Active teachers</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card variant="stats" className="p-6 border-l-4 border-l-purple-500 dark:border-l-purple-400">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">All students</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link to={ROUTES.CREATE_HEADTEACHER}>
            <Card variant="action" hover className="p-6 group cursor-pointer">
              <div className="flex items-center space-x-5">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Create Headteacher</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Add new headteacher account</p>
                  <div className="mt-3 flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                    <span>Create account</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <Link to={ROUTES.MANAGE_TEACHERS}>
            <Card variant="action" hover className="p-6 group cursor-pointer">
              <div className="flex items-center space-x-5">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Manage Teachers</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">View and manage all teachers</p>
                  <div className="mt-3 flex items-center text-orange-600 dark:text-orange-400 text-sm font-medium">
                    <span>Manage teachers</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <Link to={ROUTES.MANAGE_SCHOOLS}>
            <Card variant="action" hover className="p-6 group cursor-pointer">
              <div className="flex items-center space-x-5">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Manage Schools</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">View and manage schools</p>
                  <div className="mt-3 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                    <span>View schools</span>
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

export default AdminDashboard;
