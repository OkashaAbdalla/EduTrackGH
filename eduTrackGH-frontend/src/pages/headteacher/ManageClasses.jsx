/**
 * Manage Classes Page (Headteacher)
 * Purpose: Manage classrooms/classes in the school
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import { useToast, useAuthContext } from '../../context';

const ManageClasses = () => {
  const { showToast } = useToast();
  const { user } = useAuthContext();
  const schoolLevel = user?.schoolLevel; // PRIMARY or JHS
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 800));
      // All classes - will be filtered by schoolLevel
      const allClasses = [
        { id: '1', name: 'Primary 1', level: 'PRIMARY', teacher: 'Fatima Alhassan', students: 45, attendanceRate: 92.3 },
        { id: '2', name: 'Primary 2', level: 'PRIMARY', teacher: 'Amina Yakubu', students: 48, attendanceRate: 89.1 },
        { id: '3', name: 'Primary 3', level: 'PRIMARY', teacher: 'Amina Yakubu', students: 42, attendanceRate: 88.5 },
        { id: '4', name: 'Primary 4', level: 'PRIMARY', teacher: 'John Mensah', students: 40, attendanceRate: 85.2 },
        { id: '5', name: 'Primary 5', level: 'PRIMARY', teacher: 'Kwame Asante', students: 38, attendanceRate: 86.7 },
        { id: '6', name: 'Primary 6', level: 'PRIMARY', teacher: 'Yaw Boateng', students: 35, attendanceRate: 84.9 },
        { id: '7', name: 'JHS 1', level: 'JHS', teacher: 'John Mensah', students: 52, attendanceRate: 88.2 },
        { id: '8', name: 'JHS 2', level: 'JHS', teacher: 'Kwame Asante', students: 50, attendanceRate: 87.8 },
        { id: '9', name: 'JHS 3', level: 'JHS', teacher: 'Kwame Asante', students: 60, attendanceRate: 82.1 },
      ];
      
      // Filter classes based on headteacher's level
      const filteredClasses = schoolLevel 
        ? allClasses.filter(cls => cls.level === schoolLevel)
        : allClasses;
      setClasses(filteredClasses);
    } catch (error) {
      showToast('Failed to load classes', 'error');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Classes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {schoolLevel === 'PRIMARY' 
              ? 'View and manage Primary classes (P1-P6)'
              : schoolLevel === 'JHS'
              ? 'View and manage JHS classes (JHS 1-3)'
              : 'View and manage all classes in your school'}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Classes</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{classes.length}</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Students</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {classes.reduce((sum, c) => sum + c.students, 0)}
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Average Attendance</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {(
                  classes.reduce((sum, c) => sum + c.attendanceRate, 0) / classes.length || 0
                ).toFixed(1)}%
              </p>
            </div>
          </Card>
        </div>

        {/* Classes Table */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">All Classes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Class</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Teacher</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Students</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Attendance</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(classItem => (
                  <tr
                    key={classItem.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                      {classItem.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{classItem.teacher}</td>
                    <td className="py-3 px-4 text-center text-sm text-gray-900 dark:text-white">
                      {classItem.students}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {classItem.attendanceRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          classItem.attendanceRate >= 90
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : classItem.attendanceRate >= 75
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}
                      >
                        {classItem.attendanceRate >= 90
                          ? 'Excellent'
                          : classItem.attendanceRate >= 75
                          ? 'Good'
                          : 'Needs Attention'}
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

export default ManageClasses;
