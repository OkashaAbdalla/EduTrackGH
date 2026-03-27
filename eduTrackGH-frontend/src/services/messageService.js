/**
 * Teacher -> Headteacher messages (attendance unlock / corrections)
 */

import apiClient from './api';

const messageService = {
  // Teacher: send attendance unlock/correction request
  sendAttendanceUnlockRequest: async ({ classroomId, attendanceDate, message }) => {
    const response = await apiClient.post('/messages/attendance-unlock', {
      classroomId,
      attendanceDate,
      message,
    });
    return response.data;
  },

  // Headteacher: get unlock requests for their school
  getAttendanceUnlockRequests: async () => {
    const response = await apiClient.get('/messages/attendance-unlock');
    return response.data;
  },
};

export default messageService;

