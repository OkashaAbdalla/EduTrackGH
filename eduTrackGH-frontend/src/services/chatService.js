/**
 * Chat Service
 * API calls for headteacher <-> teacher messaging
 */

import apiClient from './api';

const chatService = {
  sendMessage: async (teacherId, message) => {
    const body = teacherId ? { teacherId, message } : { message };
    const response = await apiClient.post('/chat', body);
    return response.data;
  },

  updateMessage: async (id, message) => {
    const response = await apiClient.patch(`/chat/${id}`, { message });
    return response.data;
  },

  deleteMessage: async (id) => {
    const response = await apiClient.delete(`/chat/${id}`);
    return response.data;
  },

  getConversation: async (otherId) => {
    const response = await apiClient.get(`/chat/conversation/${otherId}`);
    return response.data;
  },

  getConversations: async () => {
    const response = await apiClient.get('/chat/conversations');
    return response.data;
  },
};

export default chatService;
