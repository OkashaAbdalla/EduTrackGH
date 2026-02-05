/**
 * Teacher Compliance Page (Headteacher)
 * Purpose: Monitor daily attendance marking compliance by teachers
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import { useToast, useAuthContext } from '../../context';

const TeacherCompliance = () => {
  const { showToast } = useToast();
  const { user } = useAuthContext();
  const schoolLevel = user?.schoolLevel; // PRIMARY or JHS
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompliance();
  }, [date]);

  const fetchCompliance = async () => {
    try {
      setLoading(true);
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 800));
      const mockTeachers = [
        {
          id: '1',
          name: 'John Mensah',
          classes: ['Primary 4', 'JHS 1'],
          marked: true,
          markedAt: '2024-01-15T08:30:00',
          complianceRate: 98.5,
        },
        {
          id: '2',
          name: 'Amina Yakubu',
          classes: ['Primary 2', 'Primary 3'],
          marked: true,
          markedAt: '2024-01-15T08:45:00',
          complianceRate: 95.2,
        },
        {
          id: '3',
          name: 'Kwame Asante',
          classes: ['JHS 2', 'JHS 3'],
          marked: false,
          markedAt: null,
          complianceRate: 87.3,
        },
        {
          id: '4',
          name: 'Fatima Alhassan',
          classes: ['Primary 1'],
          marked: true,
          markedAt: '2024-01-15T09:00:00',
          complianceRate: 100,
        },
      ];
      setTeachers(mockTeachers);
    } catch (error) {
      showToast('Failed to load compliance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getComplianceStats = () => {
    const total = teachers.length;
    const marked = teachers.filter(t => t.marked).length;
    const unmarked = total - marked;
    const avgCompliance = teachers.reduce((sum, t) => sum + t.complianceRate, 0) / total || 0;

    return { total, marked, unmarked, avgCompliance };
  };

  const stats = getComplianceStats();

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teacher Compliance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {schoolLevel === 'PRIMARY' 
              ? 'Monitor Primary section teachers\' daily attendance marking'
              : schoolLevel === 'JHS'
              ? 'Monitor JHS section teachers\' daily attendance marking'
              : 'Monitor daily attendance marking compliance'}
          </p>
        </div>

        {/* Date Filter */}
        <Card className="p-6">
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </Card>

        {/* Compliance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Teachers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Marked Today</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.marked}</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Not Marked</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.unmarked}</p>
            </div>
          </Card>
        </div>

        {/* Teachers List */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Teacher Status for {new Date(date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
          <div className="space-y-3">
            {teachers.map(teacher => (
              <div
                key={teacher.id}
                className={`p-4 rounded-lg border ${
                  teacher.marked
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                    : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          teacher.marked
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-red-100 dark:bg-red-900/30'
                        }`}
                      >
                        <span
                          className={`font-semibold ${
                            teacher.marked
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {teacher.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{teacher.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {teacher.classes.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {teacher.marked ? (
                      <div>
                        <span className="inline-block px-3 py-1 bg-green-600 text-white rounded text-sm font-medium mb-1">
                          Marked
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {teacher.markedAt &&
                            new Date(teacher.markedAt).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                        </p>
                      </div>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-red-600 text-white rounded text-sm font-medium">
                        Not Marked
                      </span>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {teacher.complianceRate.toFixed(1)}% compliance
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherCompliance;
