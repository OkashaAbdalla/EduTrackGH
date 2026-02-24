/**
 * Student Service
 * Optimized API calls for student registration workflow
 */

import apiClient from './api';

const studentService = {
  // Teacher: Propose new student
  proposeStudent: async (studentData) => {
    const response = await apiClient.post('/students/propose', studentData);
    return response.data;
  },

  // Headteacher: Get pending students
  getPendingStudents: async () => {
    const response = await apiClient.get('/students/pending');
    return response.data;
  },

  // Headteacher: Approve student
  approveStudent: async (studentId) => {
    const response = await apiClient.post(`/students/pending/${studentId}/approve`);
    return response.data;
  },

  // Headteacher: Reject student
  rejectStudent: async (studentId) => {
    const response = await apiClient.post(`/students/pending/${studentId}/reject`);
    return response.data;
  },
};

export default studentService;