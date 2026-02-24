/**
 * Manage Students - Headteacher Page
 * Optimized: Real-time updates, efficient rendering
 */

import DashboardLayout from '../../layouts/DashboardLayout';
import { PendingStudentsManager } from '../../components/headteacher';

const ManageStudents = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and approve student registrations proposed by teachers
          </p>
        </div>

        {/* Pending Students Manager */}
        <PendingStudentsManager />
      </div>
    </DashboardLayout>
  );
};

export default ManageStudents;