/**
 * Manage Students - Headteacher Page
 * Headteacher can:
 *  - Directly register students (current school roster)
 *  - Review and approve/reject students proposed by teachers
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button } from '../../components/common';
import { PendingStudentsManager, HeadteacherRegisterStudentForm } from '../../components/headteacher';
import { headteacherService } from '../../services';
import { useToast } from '../../context';

const ManageStudents = () => {
  const { showToast } = useToast();
  const [classrooms, setClassrooms] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    const loadClassrooms = async () => {
      try {
        const res = await headteacherService.getClassrooms();
        if (res.success) {
          setClassrooms(res.classrooms || []);
        } else {
          showToast(res.message || 'Failed to load classrooms', 'error');
        }
      } catch (error) {
        showToast(error.response?.data?.message || 'Failed to load classrooms', 'error');
      } finally {
        setLoadingClasses(false);
      }
    };
    loadClassrooms();
  }, [showToast]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Register current students directly and approve new students proposed by teachers.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              variant="primary"
              onClick={() => setShowRegisterModal(true)}
              disabled={loadingClasses || classrooms.length === 0}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Register Student
            </Button>
          </div>
        </div>

        {/* Info card about flows */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-100">
            Headteachers can register current students directly into the school. Class teachers only assist with
            newly admitted students by proposing them; those proposals will appear below for your approval.
          </p>
        </Card>

        {/* Pending Students Manager (teacher proposals) */}
        <PendingStudentsManager />
      </div>

      {/* Headteacher Register Student Modal */}
      <HeadteacherRegisterStudentForm
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        classrooms={classrooms}
        onSuccess={() => {}}
      />
    </DashboardLayout>
  );
};

export default ManageStudents;