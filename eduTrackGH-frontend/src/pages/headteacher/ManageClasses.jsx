/**
 * Manage Classes Page (Headteacher) – under 300 lines
 */

import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button } from '../../components/common';
import { useManageClasses } from '../../hooks/useManageClasses';
import AssignTeacherModal from '../../components/headteacher/AssignTeacherModal';
import ClassViewDetailsModal from '../../components/headteacher/ClassViewDetailsModal';

const ManageClasses = () => {
  const {
    classes,
    teachers,
    loading,
    editingClass,
    viewDetailsClass,
    setViewDetailsClass,
    selectedTeacher,
    setSelectedTeacher,
    saving,
    seeding,
    schoolLevel,
    handleEditTeacher,
    handleUnassignTeacher,
    handleSaveAssignment,
    handleCancel,
    handleSeedDefaultClasses,
  } = useManageClasses();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Classes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your school&apos;s classes and assign teachers</p>
        </div>

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
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">—</p>
            </div>
          </Card>
        </div>

        {classes.length === 0 ? (
          <Card className="p-6 flex flex-col items-center text-center space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No classes yet</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Quickly set up your school&apos;s classes so you can assign teachers.</p>
            </div>
            <Button variant="primary" onClick={handleSeedDefaultClasses} loading={seeding}>
              {schoolLevel === 'JHS' ? 'Create JHS 1–3 Classes' : 'Create P1–P6 Classes'}
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
                  {classes.map((classItem) => (
                    <tr key={classItem.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{classItem.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{classItem.teacherName || 'Unassigned'}</td>
                      <td className="py-3 px-4 text-center text-sm text-gray-900 dark:text-white">{classItem.students}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">—</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            classItem.teacherStatus === 'Available'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {classItem.teacherStatus || 'Not available'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center space-x-2">
                        <button
                          onClick={() => setViewDetailsClass(classItem)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm font-medium"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleEditTeacher(classItem)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition text-sm font-medium"
                        >
                          Assign
                        </button>
                        {classItem.teacherId && (
                          <button
                            onClick={() => handleUnassignTeacher(classItem)}
                            disabled={saving}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition text-sm font-medium disabled:opacity-50"
                          >
                            Unassign
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <AssignTeacherModal
          editingClass={editingClass}
          teachers={teachers}
          selectedTeacher={selectedTeacher}
          setSelectedTeacher={setSelectedTeacher}
          saving={saving}
          onSave={handleSaveAssignment}
          onUnassign={(c) => { handleUnassignTeacher(c); handleCancel(); }}
          onCancel={handleCancel}
        />
        <ClassViewDetailsModal
          classItem={viewDetailsClass}
          onClose={() => setViewDetailsClass(null)}
        />
      </div>
    </DashboardLayout>
  );
};

export default ManageClasses;
