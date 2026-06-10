/**
 * Manage Classes Page (Headteacher) – under 300 lines
 */

import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button } from '../../components/common';
import { useManageClasses } from '../../hooks/useManageClasses';
import { headteacherService } from '../../services';
import AssignTeacherModal from '../../components/headteacher/AssignTeacherModal';

const AssignIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const UnassignIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
  </svg>
);

const ManageClasses = ({ apiService = headteacherService } = {}) => {
  const {
    classes,
    teachers,
    loading,
    editingClass,
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
  } = useManageClasses(apiService);

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
      <div className="page-stack">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Manage Classes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your school&apos;s classes and assign teachers</p>
        </div>

        <div className="stats-grid-3">
          <Card className="stat-tile">
            <p className="stat-tile-label">Total Classes</p>
            <p className="stat-tile-value text-gray-900 dark:text-white">{classes.length}</p>
          </Card>
          <Card className="stat-tile">
            <p className="stat-tile-label">Total Students</p>
            <p className="stat-tile-value text-blue-600 dark:text-blue-400">
              {classes.reduce((sum, c) => sum + (c.students || 0), 0)}
            </p>
          </Card>
          <Card className="stat-tile">
            <p className="stat-tile-label">Average Attendance</p>
            <p className="stat-tile-value text-green-600 dark:text-green-400">—</p>
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
            <div className="overflow-x-auto table-scroll">
              <table className="w-full min-w-[560px]">
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
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditTeacher(classItem)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition text-xs font-semibold shadow-sm"
                          >
                            <AssignIcon />
                            {classItem.teacherId ? 'Reassign' : 'Assign'}
                          </button>
                          {classItem.teacherId && (
                            <button
                              type="button"
                              onClick={() => handleUnassignTeacher(classItem)}
                              disabled={saving}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800 bg-white dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition text-xs font-semibold disabled:opacity-50"
                            >
                              <UnassignIcon />
                              Unassign
                            </button>
                          )}
                        </div>
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
      </div>
    </DashboardLayout>
  );
};

export default ManageClasses;
