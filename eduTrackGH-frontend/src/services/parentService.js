import apiClient from './api';

const parentService = {
  getAttendanceOverview: async () => {
    const response = await apiClient.get('/parent/attendance-overview');
    return response.data;
  },

  getChildAttendanceRecords: async ({ studentId, month }) => {
    const response = await apiClient.get('/parent/attendance-records', {
      params: { studentId, month },
    });
    return response.data;
  },
};

export default parentService;
