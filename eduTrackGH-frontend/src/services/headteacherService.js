/**
 * Headteacher Service
 * API calls for headteacher-scoped operations (school only)
 */

import apiClient from './api';

const headteacherService = {
  // List teachers in headteacher's school
  getTeachers: async () => {
    const response = await apiClient.get('/headteacher/teachers');
    return response.data;
  },

  // Create teacher for headteacher's school (schoolId set by backend)
  createTeacher: async (data) => {
    const response = await apiClient.post('/headteacher/teachers', data);
    return response.data;
  },

  // Toggle teacher active status within headteacher's school
  toggleTeacherStatus: async (teacherId) => {
    const response = await apiClient.patch(`/headteacher/teachers/${teacherId}/toggle-status`);
    return response.data;
  },

  // List classrooms in headteacher's school
  getClassrooms: async () => {
    const response = await apiClient.get('/headteacher/classrooms');
    return response.data;
  },

  // Seed default classrooms (P1–P6 or JHS 1–3) for headteacher's school
  seedDefaultClassrooms: async () => {
    const response = await apiClient.post('/headteacher/classrooms/seed-default');
    return response.data;
  },

  // Assign teacher to classroom
  assignClassTeacher: async (classroomId, teacherId) => {
    const response = await apiClient.patch(`/headteacher/classrooms/${classroomId}/assign-teacher`, {
      teacherId,
    });
    return response.data;
  },
};

export default headteacherService;
