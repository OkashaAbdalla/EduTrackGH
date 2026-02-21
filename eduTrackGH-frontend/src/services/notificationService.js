/**
 * Notification Service
 * EduTrack GH: Parent notifications (list, mark read)
 */

import apiClient from './api';

const notificationService = {
  getMyNotifications: async () => {
    try {
      const response = await apiClient.get('/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { success: false, notifications: [], message: error.response?.data?.message || error.message };
    }
  },

  markAsRead: async (id) => {
    try {
      const response = await apiClient.patch(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification read:', error);
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },
};

export default notificationService;
