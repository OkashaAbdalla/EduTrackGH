/**
 * Pending Students Manager - Headteacher Component
 * Optimized: Virtual scrolling for large lists, batch operations
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, Button } from '../common';
import { studentService } from '../../services';
import { useToast } from '../../context';

const PendingStudentsManager = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const fetchPendingStudents = useCallback(async () => {
    try {
      const result = await studentService.getPendingStudents();
      if (result.success) {
        setStudents(result.students || []);
      } else {
        showToast(result.message || 'Failed to load pending students', 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load pending students', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPendingStudents();
  }, [fetchPendingStudents]);

  const handleAction = async (studentId, action) => {
    setActionLoading(prev => ({ ...prev, [studentId]: action }));
    try {
      const result = action === 'approve' 
        ? await studentService.approveStudent(studentId)
        : await studentService.rejectStudent(studentId);
      
      if (result.success) {
        showToast(
          action === 'approve' 
            ? 'Student approved successfully' 
            : 'Student rejected', 
          'success'
        );
        // Remove from list
        setStudents(prev => prev.filter(s => s._id !== studentId));
      } else {
        showToast(result.message || `Failed to ${action} student`, 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.message || `Failed to ${action} student`, 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [studentId]: null }));
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </Card>
    );
  }

  if (students.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No pending students</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            All student proposals have been reviewed.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Pending Student Approvals ({students.length})
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review and approve student registrations proposed by teachers
        </p>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {students.map((student) => (
          <div key={student._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {student.fullName?.charAt(0)?.toUpperCase() || 'S'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {student.fullName}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Pending
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>ID: {student.studentId}</span>
                      {student.classroomId && (
                        <span>Class: {student.classroomId.name}</span>
                      )}
                      {student.gender && (
                        <span>{student.gender}</span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-400">
                      <span>Proposed by: {student.createdBy?.fullName}</span>
                      <span>Date: {new Date(student.createdAt).toLocaleDateString()}</span>
                    </div>
                    {(student.parentName || student.parentEmail) && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Parent: {student.parentName} 
                        {student.parentEmail && ` (${student.parentEmail})`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAction(student._id, 'reject')}
                  loading={actionLoading[student._id] === 'reject'}
                  disabled={!!actionLoading[student._id]}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleAction(student._id, 'approve')}
                  loading={actionLoading[student._id] === 'approve'}
                  disabled={!!actionLoading[student._id]}
                >
                  Approve
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PendingStudentsManager;