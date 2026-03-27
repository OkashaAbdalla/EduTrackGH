/**
 * School Reports Page
 * Purpose: Comprehensive school-wide attendance reports
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import { useAuthContext } from '../../context';
import reportsService from '../../services/reportsService';

const SchoolReports = () => {
  const { user } = useAuthContext();
  const schoolLevel = user?.schoolLevel; // PRIMARY or JHS
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await reportsService.getSchoolReports(selectedMonth);
        if (cancelled) return;
        if (response.success && Array.isArray(response.reports)) {
          const filtered = schoolLevel
            ? response.reports.filter((r) => r.level === schoolLevel)
            : response.reports;
          setReports(filtered);
        } else {
          if (!response.success) setError(response.message || 'Failed to load reports');
          setReports([]);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err?.response?.data?.message || err?.message || 'Failed to load reports');
        // Keep previous reports visible on error; only clear if we had no data yet
        setReports((prev) => (prev.length ? prev : []));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchReports();
    return () => { cancelled = true; };
  }, [selectedMonth, schoolLevel]);

  const classReports = reports;

  const handleExportReport = () => {
    if (classReports.length === 0) return;
    const headers = ['Class', 'Students', 'Avg Rate (%)', 'Flagged'];
    const rows = classReports.map((r) => [r.class, r.students, r.avgRate, r.flagged]);
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `school-report-${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const getRateColor = (rate) => {
    if (rate >= 90) return 'text-green-600 dark:text-green-400';
    if (rate >= 80) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">School Reports</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {schoolLevel === 'PRIMARY'
                ? 'Primary Section (P1-P6) - Comprehensive attendance analytics'
                : schoolLevel === 'JHS'
                ? 'JHS Section (JHS 1-3) - Comprehensive attendance analytics'
                : 'Comprehensive attendance analytics'}
            </p>
          </div>
          <button
            onClick={handleExportReport}
            disabled={loading || classReports.length === 0}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
          >
            Export Report
          </button>
        </div>

        {error && (
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </Card>
        )}

        <Card className="p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Month</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full md:w-64 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
          />
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Class Performance</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Class</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Students</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Avg Rate</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Flagged</th>
                </tr>
              </thead>
              <tbody>
                {classReports.map((report, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{report.class}</td>
                    <td className="py-3 px-4 text-center text-sm text-gray-700 dark:text-gray-300">{report.students}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-lg font-bold ${getRateColor(report.avgRate)}`}>{report.avgRate}%</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                        {report.flagged}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SchoolReports;
