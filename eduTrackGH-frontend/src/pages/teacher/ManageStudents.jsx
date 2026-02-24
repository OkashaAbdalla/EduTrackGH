/**
 * Manage Students - Teacher Page
 * Optimized: Lazy loading, efficient state management
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button } from '../../components/common';
import { ProposeStudentForm } from '../../components/teacher';
import { classroomService } from '../../services';
import { useToast } from '../../context';

const ManageStudents = () => {
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        // Assuming teacher has access to their classrooms
        const result = await classroomService.getTeacherClassrooms();
        if (result.success) {
          setClassrooms(result.classrooms || []);
        }
      } catch (error) {
        showToast('Failed to load classrooms', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, [showToast]);

  const handleFormSuccess = () => {
    // Refresh or update any student lists if needed
    showToast('Student proposal submitted successfully', 'success');
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Students</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Propose new students for headteacher approval
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              variant="primary"
              onClick={() => setShowForm(true)}
              disabled={classrooms.length === 0}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Propose Student
            </Button>
          </div>
        </div>

        {/* Classrooms Overview */}
        {classrooms.length === 0 ? (
          <Card className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No classrooms assigned</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Contact your headteacher to get assigned to classrooms.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((classroom) => (
              <Card key={classroom._id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {classroom.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {classroom.grade}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {classroom.studentCount || 0} students
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Student Registration Process
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  1. Propose students using the form above<br />
                  2. Headteacher reviews and approves/rejects proposals<br />
                  3. Approved students become active and can be marked for attendance<br />
                  4. Parents are automatically linked if email/phone matches existing accounts
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Propose Student Form Modal */}
      <ProposeStudentForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        classrooms={classrooms}
        onSuccess={handleFormSuccess}
      />
    </DashboardLayout>
  );
};

export default ManageStudents;