import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import adminService from '../../services/adminService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';

const AdminAnalytics = () => {
  const [data, setData] = useState({ trends: [], bestSchools: [], worstSchools: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await adminService.getAnalytics();
        setData(response.analytics || { trends: [], bestSchools: [], worstSchools: [] });
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calculate summary stats
  const bestPerformance = data.bestSchools[0]?.attendanceRate || 0;
  const worstPerformance = data.worstSchools[data.worstSchools.length - 1]?.attendanceRate || 0;
  const avgPerformance = data.trends.length > 0 
    ? Math.round(data.trends.reduce((sum, t) => sum + t.attendanceRate, 0) / data.trends.length)
    : 0;
  const totalRecords = data.trends.reduce((sum, t) => sum + (t.totalRecords || 0), 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-700">
          <p className="text-xs font-medium text-slate-300 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
              {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-slate-300 dark:border-slate-600 border-t-brand rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">Analytics</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Attendance insights and performance metrics</p>
        </div>

        {/* Summary Stats - Top Row */}
        <div className="stats-grid-4">
          {/* Best School Performance */}
          <Card className="stat-tile border-l-4 border-l-green-500 text-left">
            <p className="stat-tile-label uppercase tracking-wide">
              Best School Performance
            </p>
            <p className="stat-tile-value text-slate-900 dark:text-white">
              {bestPerformance}%
            </p>
            <div className="hidden md:flex items-center text-xs text-green-600 dark:text-green-400">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>100.0% from previous period</span>
            </div>
          </Card>

          {/* Average Performance */}
          <Card className="stat-tile border-l-4 border-l-blue-500 text-left">
            <p className="stat-tile-label uppercase tracking-wide">
              Average Performance
            </p>
            <p className="stat-tile-value text-slate-900 dark:text-white">
              {avgPerformance}%
            </p>
            <div className="hidden md:flex items-center text-xs text-blue-600 dark:text-blue-400">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Across all schools</span>
            </div>
          </Card>

          {/* Lowest Performance */}
          <Card className="stat-tile border-l-4 border-l-orange-500 text-left">
            <p className="stat-tile-label uppercase tracking-wide">
              Needs Attention
            </p>
            <p className="stat-tile-value text-slate-900 dark:text-white">
              {worstPerformance}%
            </p>
            <div className="hidden md:flex items-center text-xs text-orange-600 dark:text-orange-400">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
              <span>Requires support</span>
            </div>
          </Card>

          {/* Total Records */}
          <Card className="stat-tile border-l-4 border-l-purple-500 text-left">
            <p className="stat-tile-label uppercase tracking-wide">
              Total Records
            </p>
            <p className="stat-tile-value text-slate-900 dark:text-white">
              {totalRecords}
            </p>
            <div className="hidden md:flex items-center text-xs text-purple-600 dark:text-purple-400">
              <span>Attendance records</span>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Attendance Trends */}
          <Card className="p-5">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Attendance Trends</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Daily attendance rate over selected period
              </p>
            </div>
            {data.trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.trends}>
                  <defs>
                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b"
                    style={{ fontSize: '11px' }}
                    tick={{ fill: '#64748b' }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    style={{ fontSize: '11px' }}
                    domain={[0, 100]}
                    tick={{ fill: '#64748b' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="attendanceRate" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    fill="url(#colorAttendance)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
                No trend data available
              </div>
            )}
          </Card>

          {/* Schools by Performance */}
          <Card className="p-5">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Schools by Performance</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Top 10 schools with highest attendance rate
              </p>
            </div>
            {data.bestSchools.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.bestSchools.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                  <XAxis 
                    dataKey="schoolName" 
                    stroke="#64748b"
                    style={{ fontSize: '10px' }}
                    tick={{ fill: '#64748b' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#64748b"
                    style={{ fontSize: '11px' }}
                    domain={[0, 100]}
                    tick={{ fill: '#64748b' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="attendanceRate" 
                    fill="#f59e0b" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
                No school data available
              </div>
            )}
          </Card>
        </div>

        {/* Best and Worst Schools Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top Performing Schools */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Top Performing Schools</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Highest attendance rates</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              {data.bestSchools.slice(0, 5).map((school, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">#{idx + 1}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{school.schoolName}</span>
                  </div>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400 ml-2">{school.attendanceRate}%</span>
                </div>
              ))}
              {data.bestSchools.length === 0 && (
                <p className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">No data available</p>
              )}
            </div>
          </Card>

          {/* Schools Needing Support */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Schools Needing Support</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Requires attention</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              {data.worstSchools.slice(0, 5).map((school, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{school.schoolName}</span>
                  </div>
                  <span className="text-lg font-bold text-red-600 dark:text-red-400 ml-2">{school.attendanceRate}%</span>
                </div>
              ))}
              {data.worstSchools.length === 0 && (
                <p className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">No data available</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAnalytics;
