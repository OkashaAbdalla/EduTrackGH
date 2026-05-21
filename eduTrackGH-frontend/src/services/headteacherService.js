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

  deleteTeacher: async (teacherId) => {
    const response = await apiClient.delete(`/headteacher/teachers/${teacherId}`);
    return response.data;
  },

  // List classrooms in headteacher's school
  getClassrooms: async () => {
    const response = await apiClient.get('/headteacher/classrooms');
    return response.data;
  },

  /** Class register history (same grid as teacher attendance history) */
  getClassroomRegisterHistory: async (classroomId, monthOrOptions) => {
    try {
      let params = {};
      if (monthOrOptions && typeof monthOrOptions === 'object' && !Array.isArray(monthOrOptions)) {
        if (monthOrOptions.month) params.month = monthOrOptions.month;
        if (monthOrOptions.term) params.term = monthOrOptions.term;
      } else if (monthOrOptions) {
        params = { month: monthOrOptions };
      }
      const response = await apiClient.get(`/headteacher/classrooms/${classroomId}/register`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching class register:', error);
      return {
        success: false,
        historyRows: [],
        message: error.response?.data?.message || error.message,
      };
    }
  },

  // Seed default classrooms (P1–P6 or JHS 1–3) for headteacher's school
  seedDefaultClassrooms: async () => {
    const response = await apiClient.post('/headteacher/classrooms/seed-default');
    return response.data;
  },

  // Assign or unassign teacher to classroom (teacherId: null to unassign)
  assignClassTeacher: async (classroomId, teacherId) => {
    const response = await apiClient.patch(`/headteacher/classrooms/${classroomId}/assign-teacher`, {
      teacherId: teacherId || null,
    });
    return response.data;
  },

  // Unlock attendance for a classroom and date (YYYY-MM-DD)
  unlockAttendance: async (classroomId, date) => {
    const response = await apiClient.patch(`/headteacher/attendance/unlock/${classroomId}/${date}`);
    return response.data;
  },

  // Get teacher compliance for a date (YYYY-MM-DD)
  getCompliance: async (date) => {
    const response = await apiClient.get('/headteacher/compliance', { params: { date } });
    return response.data;
  },

  // Dashboard summary stats for headteacher scope
  getDashboardStats: async () => {
    const response = await apiClient.get('/headteacher/dashboard-stats');
    return response.data;
  },

  getSchoolLocation: async () => {
    const response = await apiClient.get('/headteacher/school-location');
    return response.data;
  },

  setSchoolLocation: async (body) => {
    const response = await apiClient.put('/headteacher/set-location', body);
    return response.data;
  },
};

export default headteacherService;
