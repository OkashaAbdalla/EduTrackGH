/**
 * Manage Teachers Page (Headteacher)
 * Composes hook + presentational components. Kept under 250 lines.
 */

import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button } from '../../components/common';
import { useToast } from '../../context';
import { headteacherService } from '../../services';
import { useManageTeachers } from '../../hooks/useManageTeachers';
import TeacherTable from '../../components/headteacher/TeacherTable';
import CreateTeacherModal from '../../components/headteacher/CreateTeacherModal';
import TeacherViewDetailsModal from '../../components/headteacher/TeacherViewDetailsModal';
import AssignClassroomModal from '../../components/headteacher/AssignClassroomModal';
import PasswordRevealModal from '../../components/headteacher/PasswordRevealModal';

const ManageTeachers = ({ apiService = headteacherService, readOnly = false } = {}) => {
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
    handleDeleteTeacher,
    handleAssignClassroom,
    deletingId,
  } = useManageTeachers({ apiService, readOnly });

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
      <div className="page-stack">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {readOnly ? 'View Teachers' : 'Manage Teachers'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {readOnly ? 'View teacher accounts and assign classrooms' : 'Create and view teacher accounts for your school'}
            </p>
          </div>
          {!readOnly && (
          <Button variant="primary" onClick={handleOpenCreateModal} className="w-full sm:w-auto justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Create Teacher
          </Button>
          )}
        </div>

        <div className="stats-grid-3">
          <Card className="stat-tile">
            <p className="stat-tile-label">Total Teachers</p>
            <p className="stat-tile-value text-gray-900 dark:text-white">{teachers.length}</p>
          </Card>
          <Card className="stat-tile col-span-2 md:col-span-1 bg-green-50 dark:bg-green-900/15 border border-green-100 dark:border-green-800 text-left">
            <p className="text-[10px] md:text-sm font-medium text-green-800 dark:text-green-200">Secure onboarding</p>
            <p className="hidden md:block text-xs text-green-700 dark:text-green-300/80 mt-1">Temporary passwords are generated and can be shared with teachers.</p>
          </Card>
          <Card className="stat-tile">
            <p className="stat-tile-label">Active Teachers</p>
            <p className="stat-tile-value text-green-600 dark:text-green-400">{teachers.filter((t) => t.isActive).length}</p>
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
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="ui-select ui-select-inline">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </Card>

        <TeacherTable
          filteredTeachers={filteredTeachers}
          loading={loading}
          readOnly={readOnly}
          onOpenCreate={handleOpenCreateModal}
          onToggleStatus={readOnly ? undefined : handleToggleStatus}
          onViewDetails={setViewDetailsTeacher}
          onAssignClassroom={handleAssignOpen}
          onDeleteTeacher={readOnly ? undefined : handleDeleteTeacher}
          deletingId={deletingId}
        />
      </div>

      {!readOnly && (
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
      )}

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

      {!readOnly && (
      <PasswordRevealModal
        open={showPasswordModal}
        password={generatedPassword}
        onCopy={() => { if (generatedPassword) { navigator.clipboard.writeText(generatedPassword); showToast('Password copied to clipboard', 'success'); } }}
        onClose={() => setShowPasswordModal(false)}
      />
      )}
    </DashboardLayout>
  );
};

export default ManageTeachers;
