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
import { useAuthContext } from '../../context';

const AdminDashboard = () => {
  const { user } = useAuthContext();
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalHeadteachers: 0,
    totalTeachers: 0,
    totalStudents: 0,
    attendanceRate: 0,
    activeSchools: 0,
    inactiveSchools: 0,
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
          setStats((prev) => ({ ...prev, ...response.stats }));
        }

        const overview = await adminService.getSystemOverview();
        if (overview?.overview) {
          setStats((prev) => ({ ...prev, ...overview.overview }));
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
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            Welcome, {user?.name || 'Admin'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            System Administrator
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
            Monitor system performance and manage educational institutions
          </p>
        </div>

        {/* Summary Stats - Moved to Top */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 border-l-4 border-l-green-500">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Overall Attendance Rate</p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.attendanceRate || 0}%</p>
              <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>System-wide</span>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-l-blue-500">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Active Schools</p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeSchools || 0}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                Active
              </span>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-l-orange-500">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Inactive Schools</p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.inactiveSchools || 0}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                Inactive
              </span>
            </div>
          </Card>
        </div>

        {/* Stats Grid - Resized Smaller */}
        {loading && stats.totalSchools === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} variant="stats" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Schools Card */}
            <Card variant="stats" className="!p-4 border-l-4 border-l-blue-500 dark:border-l-blue-400">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Total Schools</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mb-0.5">{stats.totalSchools}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Registered schools</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </Card>

            {/* Headteachers Card */}
            <Card variant="stats" className="!p-4 border-l-4 border-l-green-500 dark:border-l-green-400">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Headteachers</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mb-0.5">{stats.totalHeadteachers}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Primary & JHS</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 flex items-center justify-center shadow-lg shadow-green-500/20">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </Card>

            {/* Total Teachers Card */}
            <Card variant="stats" className="!p-4 border-l-4 border-l-orange-500 dark:border-l-orange-400">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Total Teachers</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mb-0.5">{stats.totalTeachers}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Active teachers</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </Card>

            {/* Total Students Card */}
            <Card variant="stats" className="!p-4 border-l-4 border-l-purple-500 dark:border-l-purple-400">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Total Students</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mb-0.5">{stats.totalStudents}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">All students</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to={ROUTES.CREATE_HEADTEACHER}>
            <Card variant="action" hover className="p-5 group cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-0.5">Create Headteacher</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Add new headteacher account</p>
                  <div className="mt-2 flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                    <span>Get started</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <Link to={ROUTES.MANAGE_SCHOOLS}>
            <Card variant="action" hover className="p-5 group cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-0.5">Manage Schools</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">View and manage schools</p>
                  <div className="mt-2 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
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
