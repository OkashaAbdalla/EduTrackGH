/**
 * Flagged Students Page
 * Purpose: View students with chronic absenteeism
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import classroomService from '../../services/classroomService';
import attendanceService from '../../services/attendanceService';
import { useToast } from '../../context';

const FlaggedStudents = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const res = await classroomService.getTeacherClassrooms();
        if (res.success && res.classrooms?.length) {
          setClassrooms(res.classrooms);
          setSelectedClassroom(res.classrooms[0]._id);
        } else {
          showToast('No classrooms assigned. Contact your headteacher.', 'error');
        }
      } catch {
        showToast('Failed to load classrooms', 'error');
      }
    };
    fetchClassrooms();
  }, [showToast]);

  useEffect(() => {
    const fetchFlagged = async () => {
      if (!selectedClassroom) {
        setStudents([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await attendanceService.getFlaggedStudents(selectedClassroom);
        if (res.success) {
          setStudents(res.flagged || []);
        } else {
          showToast(res.message || 'Failed to load flagged students', 'error');
        }
      } catch {
        showToast('Failed to load flagged students', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchFlagged();
  }, [selectedClassroom, showToast]);

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
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Students with chronic absenteeism over the last month
          </p>
        </div>

        {classrooms.length > 0 && (
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Classroom
              </label>
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="sm:flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              >
                {classrooms.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.grade && `(${c.grade})`}
                  </option>
                ))}
              </select>
            </div>
          </Card>
        )}

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
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {student.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {student.studentId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-500">Absences</p>
                      <p className={`text-2xl font-bold ${getSeverityColor(student.absences)}`}>{student.absences}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-500">Attendance</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {student.rate}%
                      </p>
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
