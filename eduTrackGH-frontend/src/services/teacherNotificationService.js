/**
 * Teacher in-app notifications (messages, attendance unlock)
 */

import apiClient from './api';

const teacherNotificationService = {
  getNotifications: async () => {
    try {
      const response = await apiClient.get('/teacher/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher notifications:', error);
      return { success: false, notifications: [], unreadCount: 0, message: error.response?.data?.message || error.message };
    }
  },

  markAsRead: async (id) => {
    try {
      const response = await apiClient.patch(`/teacher/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await apiClient.patch('/teacher/notifications/read-all');
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  deleteNotification: async (id) => {
    try {
      const response = await apiClient.delete(`/teacher/notifications/${id}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },
};

export default teacherNotificationService;
