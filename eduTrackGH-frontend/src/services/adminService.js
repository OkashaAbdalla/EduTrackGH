/**
 * Admin Service
 * Purpose: API calls for admin operations
 */

import apiClient from './api';
import cacheService from '../utils/cache';

const adminService = {
  createHeadteacher: async (headteacherData) => {
    const response = await apiClient.post('/admin/headteachers', headteacherData);
    return response.data;
  },

  createTeacher: async (teacherData) => {
    const response = await apiClient.post('/admin/teachers', teacherData);
    return response.data;
  },

  getHeadteachers: async (useCache = true) => {
    if (useCache) {
      const cached = cacheService.get('/admin/headteachers');
      if (cached) {
        apiClient.get('/admin/headteachers').then(response => {
          cacheService.set('/admin/headteachers', {}, response.data);
        }).catch(() => {});
        return cached;
      }
    }

    const response = await apiClient.get('/admin/headteachers');
    cacheService.set('/admin/headteachers', {}, response.data);
    return response.data;
  },

  getTeachers: async () => {
    const response = await apiClient.get('/admin/teachers');
    return response.data;
  },

  getStats: async (useCache = true) => {
    // Check cache first
    if (useCache) {
      const cached = cacheService.get('/admin/stats');
      if (cached) {
        // Return cached data immediately, but still fetch fresh data in background
        apiClient.get('/admin/stats').then(response => {
          cacheService.set('/admin/stats', {}, response.data);
        }).catch(() => {});
        return cached;
      }
    }

    const response = await apiClient.get('/admin/stats');
    cacheService.set('/admin/stats', {}, response.data);
    return response.data;
  },

  // School management
  getSchools: async (useCache = true) => {
    if (useCache) {
      const cached = cacheService.get('/admin/schools');
      if (cached) {
        apiClient.get('/admin/schools').then(response => {
          cacheService.set('/admin/schools', {}, response.data);
        }).catch(() => {});
        return cached;
      }
    }

    const response = await apiClient.get('/admin/schools');
    cacheService.set('/admin/schools', {}, response.data);
    return response.data;
  },

  createSchool: async (schoolData) => {
    const response = await apiClient.post('/admin/schools', schoolData);
    // Invalidate cache
    cacheService.invalidate('/admin/schools');
    cacheService.invalidate('/admin/stats');
    return response.data;
  },

  updateSchool: async (id, schoolData) => {
    const response = await apiClient.put(`/admin/schools/${id}`, schoolData);
    // Invalidate cache
    cacheService.invalidate('/admin/schools');
    cacheService.invalidate('/admin/stats');
    return response.data;
  },

  toggleSchoolStatus: async (id) => {
    const response = await apiClient.patch(`/admin/schools/${id}/toggle-status`);
    // Invalidate cache
    cacheService.invalidate('/admin/schools');
    cacheService.invalidate('/admin/stats');
    return response.data;
  },

  // System settings
  getSystemSettings: async (useCache = true) => {
    if (useCache) {
      const cached = cacheService.get('/admin/settings');
      if (cached) {
        apiClient.get('/admin/settings').then(response => {
          cacheService.set('/admin/settings', {}, response.data);
        }).catch(() => {});
        return cached;
      }
    }

    const response = await apiClient.get('/admin/settings');
    cacheService.set('/admin/settings', {}, response.data);
    return response.data;
  },

  updateSystemSettings: async (settings) => {
    const response = await apiClient.put('/admin/settings', { settings });
    return response.data;
  },
};

export default adminService;
