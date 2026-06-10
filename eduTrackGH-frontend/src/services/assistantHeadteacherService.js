/**
 * Assistant Headteacher API
 */

import apiClient from './api';

const assistantHeadteacherService = {
  getDelegationStatus: async () => {
    const response = await apiClient.get('/assistant-headteacher/delegation/status');
    return response.data;
  },

  activateDelegation: async () => {
    const response = await apiClient.post('/assistant-headteacher/delegation/activate');
    return response.data;
  },

  endDelegation: async () => {
    const response = await apiClient.post('/assistant-headteacher/delegation/end');
    return response.data;
  },

  getAssistantChat: async () => {
    const response = await apiClient.get('/assistant-headteacher/assistant-chat');
    return response.data;
  },

  sendAssistantChat: async (message) => {
    const response = await apiClient.post('/assistant-headteacher/assistant-chat', { message });
    return response.data;
  },

  updateAssistantChatMessage: async (id, message) => {
    const response = await apiClient.patch(`/assistant-headteacher/assistant-chat/${id}`, { message });
    return response.data;
  },

  deleteAssistantChatMessage: async (id) => {
    const response = await apiClient.delete(`/assistant-headteacher/assistant-chat/${id}`);
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await apiClient.get('/assistant-headteacher/dashboard-stats');
    return response.data;
  },

  getCompliance: async (date) => {
    const response = await apiClient.get('/assistant-headteacher/compliance', { params: { date } });
    return response.data;
  },

  getTeachers: async () => {
    const response = await apiClient.get('/assistant-headteacher/teachers');
    return response.data;
  },

  getClassrooms: async () => {
    const response = await apiClient.get('/assistant-headteacher/classrooms');
    return response.data;
  },

  getClassroomRegisterHistory: async (classroomId, monthOrOptions) => {
    let params = {};
    if (monthOrOptions && typeof monthOrOptions === 'object') {
      if (monthOrOptions.month) params.month = monthOrOptions.month;
      if (monthOrOptions.term) params.term = monthOrOptions.term;
    } else if (monthOrOptions) {
      params = { month: monthOrOptions };
    }
    const response = await apiClient.get(`/assistant-headteacher/classrooms/${classroomId}/register`, { params });
    return response.data;
  },

  seedDefaultClassrooms: async () => {
    const response = await apiClient.post('/assistant-headteacher/classrooms/seed-default');
    return response.data;
  },

  assignClassTeacher: async (classroomId, teacherId) => {
    const response = await apiClient.patch(`/assistant-headteacher/classrooms/${classroomId}/assign-teacher`, {
      teacherId: teacherId || null,
    });
    return response.data;
  },

  unlockAttendance: async (classroomId, date) => {
    const response = await apiClient.patch(`/assistant-headteacher/attendance/unlock/${classroomId}/${date}`);
    return response.data;
  },

  getNotifications: async () => {
    const response = await apiClient.get('/assistant-headteacher/notifications');
    return response.data;
  },

  markNotificationRead: async (id, source) => {
    const params = source ? { source } : {};
    const response = await apiClient.patch(`/assistant-headteacher/notifications/${id}/read`, null, { params });
    return response.data;
  },

  deleteNotification: async (id, source) => {
    const params = source ? { source } : {};
    const response = await apiClient.delete(`/assistant-headteacher/notifications/${id}`, { params });
    return response.data;
  },

  getUnlockRequests: async () => {
    const response = await apiClient.get('/assistant-headteacher/unlock-requests');
    return response.data;
  },
};

export default assistantHeadteacherService;
