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

  // List classrooms in headteacher's school
  getClassrooms: async () => {
    const response = await apiClient.get('/headteacher/classrooms');
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
