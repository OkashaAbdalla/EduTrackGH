/**
 * School Reports Page
 * Purpose: Comprehensive school-wide attendance reports
 */

import { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import { useAuthContext } from '../../context';

const SchoolReports = () => {
  const { user } = useAuthContext();
  const schoolLevel = user?.schoolLevel; // PRIMARY or JHS
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Mock data - Filter by headteacher's schoolLevel (PRIMARY or JHS)
  const allClassReports = [
    { class: 'Primary 1', level: 'PRIMARY', students: 30, avgRate: 92, flagged: 1 },
    { class: 'Primary 2', level: 'PRIMARY', students: 28, avgRate: 88, flagged: 2 },
    { class: 'Primary 3', level: 'PRIMARY', students: 32, avgRate: 90, flagged: 1 },
    { class: 'Primary 4', level: 'PRIMARY', students: 29, avgRate: 85, flagged: 3 },
    { class: 'Primary 5', level: 'PRIMARY', students: 27, avgRate: 87, flagged: 2 },
    { class: 'Primary 6', level: 'PRIMARY', students: 31, avgRate: 89, flagged: 1 },
    { class: 'JHS 1', level: 'JHS', students: 35, avgRate: 87, flagged: 2 },
    { class: 'JHS 2', level: 'JHS', students: 33, avgRate: 89, flagged: 1 },
    { class: 'JHS 3', level: 'JHS', students: 38, avgRate: 82, flagged: 4 },
  ];

  // Filter classes based on headteacher's level
  const classReports = schoolLevel 
    ? allClassReports.filter(report => report.level === schoolLevel)
    : allClassReports;

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
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition">
            Export Report
          </button>
        </div>

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
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SchoolReports;
