/**
 * Mark Attendance Page
 * Purpose: Daily attendance marking interface for teachers
 * 
 * Logic:
 * - Fetch teacher's assigned classrooms on load
 * - Show only those classrooms (security)
 * - Auto-select if teacher has only 1 classroom
 * - Fetch students for selected classroom
 * - Save attendance records to backend
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import { StudentAttendanceRow } from '../../components/teacher';
import classroomService from '../../services/classroomService';
import attendanceService from '../../services/attendanceService';
import { useToast } from '../../context';

const MarkAttendance = () => {
  const { showToast } = useToast();
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [classLoading, setClassLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch teacher's assigned classrooms on mount
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        setInitialLoading(true);
        const response = await classroomService.getTeacherClassrooms();

        if (response.success && response.classrooms.length > 0) {
          setClassrooms(response.classrooms);

          // Auto-select if only one classroom
          if (response.classrooms.length === 1) {
            setSelectedClass(response.classrooms[0]._id);
            setError(null);
          }
        } else {
          setError('No classrooms assigned. Contact your headteacher to be assigned a class.');
          setClassrooms([]);
        }
      } catch (err) {
        console.error('Error fetching classrooms:', err);
        setError('Failed to load classrooms. Please try again.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchClassrooms();
  }, []);

  // Fetch students when classroom is selected
  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

  const fetchStudents = async () => {
    try {
      setClassLoading(true);
      setError(null);
      const response = await classroomService.getClassroomStudents(selectedClass);

      if (response.success) {
        // Initialize all students with 'present' status
        const studentsWithStatus = response.students.map(student => ({
          ...student,
          status: 'present',
        }));
        setStudents(studentsWithStatus);
      } else {
        setError('Failed to load students. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Error loading students.');
    } finally {
      setClassLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setStudents(students.map(s =>
      s._id === studentId ? { ...s, status } : s
    ));
  };

  const handleSubmit = async () => {
    if (!selectedClass || students.length === 0) {
      showToast('Please select a class and load students', 'error');
      return;
    }

    setSaving(true);
    try {
      const attendanceData = students.map((s) => ({
        studentId: s._id,
        status: s.status,
      }));

      const response = await attendanceService.markDailyAttendance(
        selectedClass,
        selectedDate,
        attendanceData
      );

      if (response.success) {
        showToast(`Attendance saved for ${response.count ?? students.length} students.`, 'success');
      } else {
        showToast(response.message || 'Failed to save attendance', 'error');
      }
    } catch (err) {
      console.error('Error saving attendance:', err);
      showToast('Failed to save attendance', 'error');
    } finally {
      setSaving(false);
    }
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

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your classrooms...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mark Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Record daily attendance for your class{classrooms.length > 1 ? 'es' : ''}</p>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </Card>
        )}

        {/* Class & Date Selection */}
        {classrooms.length > 0 && (
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Class{classrooms.length > 1 ? 'es' : ''}
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">
                    {classrooms.length === 1 ? 'Auto-selected: ' : 'Choose a class...'}
                  </option>
                  {classrooms.map(cls => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} (Grade {cls.grade})
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
        )}

        {/* Loading students */}
        {classLoading && (
          <Card className="p-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
          </Card>
        )}

        {/* Stats */}
        {selectedClass && students.length > 0 && !classLoading && (
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
        {selectedClass && !classLoading && (
          <Card className="p-6">
            {students.length > 0 ? (
              <div className="space-y-3">
                {students.map((student) => (
                  <StudentAttendanceRow
                    key={student._id}
                    student={student}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                {selectedClass ? 'No students found for this class' : 'Select a class to view students'}
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

        {!selectedClass && classrooms.length > 0 && !classLoading && (
          <Card className="p-12">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-lg font-medium">Select your class to mark attendance</p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MarkAttendance;
