/**
 * Children Attendance Page
 * Purpose: Detailed attendance view for parent's children
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import parentService from '../../services/parentService';

const ChildrenAttendance = () => {
  const { childId } = useParams();
  const [selectedChild, setSelectedChild] = useState(childId || '');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [records, setRecords] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadChildren = async () => {
      try {
        const overview = await parentService.getAttendanceOverview();
        const list = overview?.children || [];
        setChildren(list);
        if (!selectedChild && list.length > 0) {
          setSelectedChild(list[0].studentId);
        }
      } catch (error) {
        setChildren([]);
      }
    };
    loadChildren();
  }, [childId, selectedChild]);

  useEffect(() => {
    if (!selectedChild) return;
    const load = async () => {
      try {
        setLoading(true);
        const response = await parentService.getChildAttendanceRecords({
          studentId: selectedChild,
          month: selectedMonth,
        });
        if (response.success) {
          setRecords(response.records || []);
          setStudentInfo(response.student || null);
        } else {
          setRecords([]);
          setStudentInfo(null);
        }
      } catch (error) {
        setRecords([]);
        setStudentInfo(null);
      } finally {
        setLoading(false);
      }
    };
    load();
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
      <div className="page-stack max-w-5xl mx-auto">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Children Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {studentInfo ? `${studentInfo.name} • ${studentInfo.className}` : 'View detailed attendance records'}
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="card-grid-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="ui-select w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Child</label>
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="ui-select w-full"
              >
                <option value="">Choose a child...</option>
                {children.map((child) => (
                  <option key={child.studentId} value={child.studentId}>
                    {child.studentName} - {child.className}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {selectedChild && records.length > 0 && (
          <>
            <div className="stats-grid-3">
              <Card className="stat-tile">
                <p className="stat-tile-label">Present</p>
                <p className="stat-tile-value text-green-600 dark:text-green-400">{stats.present}</p>
              </Card>
              <Card className="stat-tile">
                <p className="stat-tile-label">Absent</p>
                <p className="stat-tile-value text-red-600 dark:text-red-400">{stats.absent}</p>
              </Card>
              <Card className="stat-tile">
                <p className="stat-tile-label">Late</p>
                <p className="stat-tile-value text-orange-600 dark:text-orange-400">{stats.late}</p>
              </Card>
            </div>

            <Card className="p-6">
              <div className="space-y-3">
                {records.map((record) => (
                  <div key={`${record.date}-${record.status}`} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
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
        {selectedChild && !loading && records.length === 0 && (
          <Card className="p-6">
            <p className="text-gray-600 dark:text-gray-400">No attendance records found for this period.</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ChildrenAttendance;
