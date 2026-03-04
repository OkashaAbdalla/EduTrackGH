/**
 * Manage Classes Page (Headteacher)
 * Purpose: Manage classrooms/classes and assign teachers
 * Features: View all classes, assign/change teacher assignments
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button } from '../../components/common';
import { useToast, useAuthContext } from '../../context';
import { headteacherService } from '../../services';

const ManageClasses = () => {
  const { showToast } = useToast();
  const { user } = useAuthContext();
  const schoolLevel = user?.schoolLevel; // PRIMARY or JHS
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teachersResult, classroomsResult] = await Promise.all([
        headteacherService.getTeachers(),
        headteacherService.getClassrooms(),
      ]);

      if (teachersResult.success) {
        setTeachers(teachersResult.teachers || []);
      } else {
        showToast(teachersResult.message || 'Failed to load teachers', 'error');
      }

      if (classroomsResult.success) {
        const mapped = (classroomsResult.classrooms || []).map((cls) => ({
          id: cls._id,
          name: cls.name,
          grade: cls.grade,
          teacherId: cls.teacherId?._id || cls.teacherId || '',
          teacherName: cls.teacherId?.fullName || 'Unassigned',
          students: cls.studentCount || 0,
        }));
        setClasses(mapped);
      } else {
        showToast(classroomsResult.message || 'Failed to load classes', 'error');
      }
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeacher = (classItem) => {
    setEditingClass(classItem);
    setSelectedTeacher(classItem.teacherId || '');
  };

  const handleSaveAssignment = async () => {
    if (!selectedTeacher) {
      showToast('Please select a teacher', 'error');
      return;
    }

    setSaving(true);
    try {
      const result = await headteacherService.assignClassTeacher(editingClass.id, selectedTeacher);
      if (result.success) {
        const updated = result.classroom;
        const teacherName = updated.teacherId?.fullName || 'Unassigned';
        setClasses(classes.map(cls =>
          cls.id === editingClass.id
            ? { ...cls, teacherId: updated.teacherId?._id || updated.teacherId, teacherName }
            : cls
        ));

        showToast(`${editingClass.name} assigned to ${teacherName}`, 'success');
        setEditingClass(null);
        setSelectedTeacher('');
      } else {
        showToast(result.message || 'Failed to save assignment', 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save assignment', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingClass(null);
    setSelectedTeacher('');
  };

  const handleSeedDefaultClasses = async () => {
    setSeeding(true);
    try {
      const result = await headteacherService.seedDefaultClassrooms();
      if (result.success) {
        const mapped = (result.classrooms || []).map((cls) => ({
          id: cls._id,
          name: cls.name,
          grade: cls.grade,
          teacherId: cls.teacherId?._id || cls.teacherId || '',
          teacherName: cls.teacherId?.fullName || 'Unassigned',
          students: cls.studentCount || 0,
        }));
        setClasses(mapped);
        const createdCount = result.createdCount || 0;
        const label =
          schoolLevel === 'JHS'
            ? 'JHS 1–3'
            : schoolLevel === 'PRIMARY'
            ? 'P1–P6'
            : 'default classrooms';
        const msg =
          createdCount > 0
            ? `Created ${createdCount} ${label} for your school`
            : `All ${label} already exist for your school`;
        showToast(msg, 'success');
      } else {
        showToast(result.message || 'Failed to create default classes', 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create default classes', 'error');
    } finally {
      setSeeding(false);
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
            Manage your school&apos;s classes and assign teachers
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
                {classes.reduce((sum, c) => sum + (c.students || 0), 0)}
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Average Attendance</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                —
              </p>
            </div>
          </Card>
        </div>

        {/* Classes Table / Empty State */}
        {classes.length === 0 ? (
          <Card className="p-6 flex flex-col items-center text-center space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                No classes yet
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Quickly set up your school&apos;s classes so you can assign teachers.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleSeedDefaultClasses}
              loading={seeding}
            >
              {schoolLevel === 'JHS'
                ? 'Create JHS 1–3 Classes'
                : 'Create P1–P6 Classes'}
            </Button>
          </Card>
        ) : (
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
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
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
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {classItem.teacherName || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-gray-900 dark:text-white">
                        {classItem.students}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                          —
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          Not available
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleEditTeacher(classItem)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition text-sm font-medium"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Assign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Edit Teacher Modal */}
      {editingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 animate-scale-in">
            <div className="space-y-4">
              {/* Header */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Assign Teacher
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Class: <span className="font-semibold">{editingClass.name}</span>
                </p>
              </div>

              {/* Current Teacher Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current Teacher</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {editingClass.teacherName || 'Unassigned'}
                </p>
              </div>

              {/* Teacher Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Select New Teacher
                </label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full bg-white dark:bg-gray-700/80 border-2 border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-500/30 transition"
                >
                  <option value="">-- Select a teacher --</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id || teacher._id} value={teacher.id || teacher._id}>
                      {teacher.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAssignment}
                  disabled={saving || !selectedTeacher}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-green-700 dark:from-green-600 dark:to-green-700 text-white hover:from-green-700 hover:to-green-800 transition font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Assign Teacher</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageClasses;
