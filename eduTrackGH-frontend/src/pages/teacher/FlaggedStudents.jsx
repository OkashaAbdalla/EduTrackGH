/**
 * Flagged Students Page
 * Purpose: View students with chronic absenteeism
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';

const FlaggedStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock flagged students
  const mockStudents = [
    { id: 1, name: 'Kwame Boateng', class: 'Primary 4A', absences: 5, rate: 75, lastAbsent: '2024-02-03' },
    { id: 2, name: 'Akosua Mensah', class: 'Primary 5B', absences: 4, rate: 80, lastAbsent: '2024-02-02' },
    { id: 3, name: 'Yaw Agyeman', class: 'JHS 2A', absences: 6, rate: 70, lastAbsent: '2024-02-05' },
  ];

  useEffect(() => {
    // TODO: Fetch flagged students from API
    setTimeout(() => {
      setStudents(mockStudents);
      setLoading(false);
    }, 800);
  }, []);

  const getSeverityColor = (absences) => {
    if (absences >= 6) return 'text-red-600 dark:text-red-400';
    if (absences >= 4) return 'text-orange-600 dark:text-orange-400';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Flagged Students</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Students with chronic absenteeism</p>
        </div>

        {loading ? (
          <Card className="p-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
          </Card>
        ) : students.length > 0 ? (
          <div className="space-y-4">
            {students.map((student) => (
              <Card key={student.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{student.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{student.class}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-500">Absences</p>
                      <p className={`text-2xl font-bold ${getSeverityColor(student.absences)}`}>{student.absences}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-500">Rate</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{student.rate}%</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium">No flagged students</p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FlaggedStudents;
