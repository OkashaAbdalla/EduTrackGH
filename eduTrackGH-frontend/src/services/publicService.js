/**
 * Public API (no authentication)
 */

import apiClient from './api';

const publicService = {
  getSystemStatus: async () => {
    try {
      const response = await apiClient.get('/public/system-status');
      return response.data;
    } catch {
      return { success: false, maintenanceMode: false, allowRegistration: true };
    }
  },
};

export default publicService;
