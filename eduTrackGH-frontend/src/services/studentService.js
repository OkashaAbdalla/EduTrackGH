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

  // Headteacher: teacher-proposed edits to existing students
  getPendingStudentEdits: async () => {
    const response = await apiClient.get('/students/pending-edits');
    return response.data;
  },

  approveStudentPendingEdit: async (studentId) => {
    const response = await apiClient.patch(`/students/${studentId}/pending-edit/approve`);
    return response.data;
  },

  rejectStudentPendingEdit: async (studentId) => {
    const response = await apiClient.patch(`/students/${studentId}/pending-edit/reject`);
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

  // Headteacher: Directly register a student into their school
  registerStudentAsHeadteacher: async (studentData) => {
    const response = await apiClient.post('/students/register', studentData);
    return response.data;
  },

  // Headteacher: list students (optional ?classroom=id)
  getStudents: async (params = {}) => {
    const response = await apiClient.get('/students', { params });
    return response.data;
  },

  // Teacher/Headteacher: Update student (teacher only for pending proposals they created)
  updateStudent: async (studentId, updates) => {
    const response = await apiClient.patch(`/students/${studentId}`, updates);
    return response.data;
  },
};

export default studentService;