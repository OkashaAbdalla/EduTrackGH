/**
 * Children Attendance Page
 * Purpose: Detailed attendance view for parent's children
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';

const ChildrenAttendance = () => {
  const { childId } = useParams();
  const [selectedChild, setSelectedChild] = useState(childId || '');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock children
  const children = [
    { id: 1, name: 'Kofi Mensah', class: 'Primary 4' },
    { id: 2, name: 'Ama Mensah', class: 'JHS 2' },
  ];

  // Mock attendance records
  const mockRecords = [
    { date: '2024-02-01', status: 'present' },
    { date: '2024-02-02', status: 'present' },
    { date: '2024-02-03', status: 'absent' },
    { date: '2024-02-04', status: 'present' },
    { date: '2024-02-05', status: 'late' },
  ];

  useEffect(() => {
    if (selectedChild) {
      setLoading(true);
      setTimeout(() => {
        setRecords(mockRecords);
        setLoading(false);
      }, 500);
    }
  }, [selectedChild, selectedMonth]);

  const getStatusBadge = (status) => {
    const styles = {
      present: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      absent: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      late: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    };
    return styles[status] || styles.present;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const stats = {
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Children Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View detailed attendance records</p>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Child</label>
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                <option value="">Choose a child...</option>
                {children.map(child => (
                  <option key={child.id} value={child.id}>{child.name} - {child.class}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </Card>

        {selectedChild && records.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Present</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.present}</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Absent</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.absent}</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Late</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.late}</p>
              </Card>
            </div>

            <Card className="p-6">
              <div className="space-y-3">
                {records.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(record.date)}</span>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize ${getStatusBadge(record.status)}`}>
                      {record.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ChildrenAttendance;
