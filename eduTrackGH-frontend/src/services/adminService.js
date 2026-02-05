/**
 * Admin Service
 * Purpose: API calls for admin operations
 */

import apiClient from './api';

const adminService = {
  createHeadteacher: async (headteacherData) => {
    const response = await apiClient.post('/admin/headteachers', headteacherData);
    return response.data;
  },

  createTeacher: async (teacherData) => {
    const response = await apiClient.post('/admin/teachers', teacherData);
    return response.data;
  },

  getHeadteachers: async () => {
    const response = await apiClient.get('/admin/headteachers');
    return response.data;
  },

  getTeachers: async () => {
    const response = await apiClient.get('/admin/teachers');
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },
};

export default adminService;
