/**
 * Mark Attendance Page
 * Purpose: Daily attendance marking interface for teachers
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';

const MarkAttendance = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Mock classes - TODO: Replace with API call
  const classes = [
    { id: 1, name: 'Primary 4A', students: 28 },
    { id: 2, name: 'Primary 5B', students: 30 },
    { id: 3, name: 'JHS 2A', students: 27 },
  ];

  // Mock students - TODO: Replace with API call
  const mockStudents = [
    { id: 1, name: 'Kofi Mensah', status: 'present' },
    { id: 2, name: 'Ama Asante', status: 'present' },
    { id: 3, name: 'Kwame Boateng', status: 'absent' },
    { id: 4, name: 'Abena Osei', status: 'present' },
    { id: 5, name: 'Yaw Agyeman', status: 'late' },
  ];

  useEffect(() => {
    if (selectedClass) {
      setLoading(true);
      // TODO: Fetch students for selected class
      setTimeout(() => {
        setStudents(mockStudents);
        setLoading(false);
      }, 500);
    }
  }, [selectedClass]);

  const handleStatusChange = (studentId, status) => {
    setStudents(students.map(s => 
      s.id === studentId ? { ...s, status } : s
    ));
  };

  const handleSubmit = async () => {
    setSaving(true);
    // TODO: Submit attendance to API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    alert('Attendance saved successfully!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'absent': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'late': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    }
  };

  const stats = {
    present: students.filter(s => s.status === 'present').length,
    absent: students.filter(s => s.status === 'absent').length,
    late: students.filter(s => s.status === 'late').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mark Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Record daily attendance for your classes</p>
        </div>

        {/* Class & Date Selection */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Choose a class...</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.students} students)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </Card>

        {/* Stats */}
        {selectedClass && students.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Present</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.present}</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Absent</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.absent}</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Late</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.late}</p>
              </div>
            </Card>
          </div>
        )}

        {/* Students List */}
        {selectedClass && (
          <Card className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
              </div>
            ) : students.length > 0 ? (
              <div className="space-y-3">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{student.name}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleStatusChange(student.id, 'present')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          student.status === 'present'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'late')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          student.status === 'late'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                        }`}
                      >
                        Late
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'absent')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          student.status === 'absent'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30'
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No students found for this class
              </div>
            )}

            {students.length > 0 && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            )}
          </Card>
        )}

        {!selectedClass && (
          <Card className="p-12">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-lg font-medium">Select a class to mark attendance</p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MarkAttendance;
