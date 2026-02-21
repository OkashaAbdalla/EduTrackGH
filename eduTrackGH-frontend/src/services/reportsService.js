/**
 * Reports Service
 * EduTrack GH: Headteacher school reports
 */

import apiClient from './api';

const reportsService = {
  getSchoolReports: async (month) => {
    try {
      const params = month ? { month } : {};
      const response = await apiClient.get('/reports/school', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching school reports:', error);
      return {
        success: false,
        reports: [],
        message: error.response?.data?.message || error.message,
      };
    }
  },
};

export default reportsService;
