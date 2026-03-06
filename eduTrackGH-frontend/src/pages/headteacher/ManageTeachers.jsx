/**
 * Manage Teachers Page (Headteacher)
 * Composes hook + presentational components. Kept under 250 lines.
 */

import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button } from '../../components/common';
import { useToast } from '../../context';
import { useManageTeachers } from '../../hooks/useManageTeachers';
import TeacherTable from '../../components/headteacher/TeacherTable';
import CreateTeacherModal from '../../components/headteacher/CreateTeacherModal';
import TeacherViewDetailsModal from '../../components/headteacher/TeacherViewDetailsModal';
import AssignClassroomModal from '../../components/headteacher/AssignClassroomModal';
import PasswordRevealModal from '../../components/headteacher/PasswordRevealModal';

const ManageTeachers = () => {
  const { showToast } = useToast();
  const {
    teachers,
    classrooms,
    loading,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    filteredTeachers,
    showCreateModal,
    saving,
    formData,
    setFormData,
    errors,
    generatedPassword,
    showPasswordModal,
    setShowPasswordModal,
    viewDetailsTeacher,
    setViewDetailsTeacher,
    assignTeacher,
    setAssignTeacher,
    assignClassroomId,
    setAssignClassroomId,
    assigning,
    getAssignedClassrooms,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleSaveTeacher,
    handleToggleStatus,
    handleAssignClassroom,
  } = useManageTeachers();

  const handleAssignOpen = (teacher) => {
    setAssignTeacher(teacher);
    setAssignClassroomId('');
  };
  const handleAssignClose = () => {
    setAssignTeacher(null);
    setAssignClassroomId('');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Manage Teachers</h1>
            <p className="text-gray-600 dark:text-gray-400">Create and view teacher accounts for your school</p>
          </div>
          <Button variant="primary" onClick={handleOpenCreateModal}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Create Teacher
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Teachers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{teachers.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">In your school</p>
            </div>
          </Card>
          <Card className="p-6 bg-green-50 dark:bg-green-900/15 border border-green-100 dark:border-green-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800/60 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Secure onboarding</p>
                <p className="text-xs text-green-700 dark:text-green-300/80">Temporary passwords are generated and can be shared with teachers.</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Teachers</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{teachers.filter((t) => t.isActive).length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Currently active in your school</p>
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </Card>

        <TeacherTable
          filteredTeachers={filteredTeachers}
          loading={loading}
          onOpenCreate={handleOpenCreateModal}
          onToggleStatus={handleToggleStatus}
          onViewDetails={setViewDetailsTeacher}
          onAssignClassroom={handleAssignOpen}
        />
      </div>

      <CreateTeacherModal
        open={showCreateModal}
        onClose={handleCloseCreateModal}
        formData={formData}
        setFormData={setFormData}
        errors={errors}
        saving={saving}
        onSave={handleSaveTeacher}
        showToast={showToast}
      />

      <TeacherViewDetailsModal teacher={viewDetailsTeacher} getAssignedClassrooms={getAssignedClassrooms} onClose={() => setViewDetailsTeacher(null)} />

      <AssignClassroomModal
        teacher={assignTeacher}
        classrooms={classrooms}
        assignClassroomId={assignClassroomId}
        setAssignClassroomId={setAssignClassroomId}
        assigning={assigning}
        onAssign={handleAssignClassroom}
        onClose={handleAssignClose}
      />

      <PasswordRevealModal
        open={showPasswordModal}
        password={generatedPassword}
        onCopy={() => { if (generatedPassword) { navigator.clipboard.writeText(generatedPassword); showToast('Password copied to clipboard', 'success'); } }}
        onClose={() => setShowPasswordModal(false)}
      />
    </DashboardLayout>
  );
};

export default ManageTeachers;
