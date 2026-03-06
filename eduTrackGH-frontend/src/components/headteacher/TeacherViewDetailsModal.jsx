/**
 * View teacher details modal
 */

import { Modal } from '../common';

export default function TeacherViewDetailsModal({ teacher, getAssignedClassrooms, onClose }) {
  if (!teacher) return null;
  const assigned = getAssignedClassrooms(teacher._id || teacher.id);

  return (
    <Modal isOpen={!!teacher} onClose={onClose} title="Teacher Details" size="md">
      <div className="space-y-3 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Full Name</span>
          <p className="font-medium text-gray-900 dark:text-white mt-0.5">{teacher.fullName}</p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Email</span>
          <p className="font-medium text-gray-900 dark:text-white mt-0.5">{teacher.email}</p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Status</span>
          <p className="font-medium text-gray-900 dark:text-white mt-0.5">{teacher.isActive ? 'Active' : 'Inactive'}</p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Assigned Classroom(s)</span>
          <p className="font-medium text-gray-900 dark:text-white mt-0.5">
            {assigned.length > 0 ? assigned.map((c) => `${c.name} (${c.grade})`).join(', ') : 'None'}
          </p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Account Created</span>
          <p className="font-medium text-gray-900 dark:text-white mt-0.5">
            {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : '—'}
          </p>
        </div>
      </div>
    </Modal>
  );
}
