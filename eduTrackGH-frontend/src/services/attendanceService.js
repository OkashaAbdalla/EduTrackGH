/**
 * Attendance Service
 * Purpose: API calls for attendance operations (EduTrack GH)
 * Endpoints:
 *   - markDailyAttendance(classroomId, date, attendanceData): POST /api/attendance/mark
 *   - getClassroomAttendanceHistory(classroomId, month): GET /api/attendance/classroom/:classroomId
 *   - getFlaggedStudents(classroomId): GET /api/attendance/flagged
 *   - getChildAttendance(childId): GET /api/attendance/child/:id (for parents)
 */

import apiClient from "./api";

const attendanceService = {
  // Get daily attendance history for a classroom (teacher)
  getClassroomAttendanceHistory: async (classroomId, month) => {
    try {
      const params = month ? { month } : {};
      const response = await apiClient.get(
        `/attendance/classroom/${classroomId}/daily`,
        { params },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching classroom attendance history:", error);
      return { success: false, records: [], message: error.response?.data?.message || error.message };
    }
  },

  // Mark daily attendance for a class (teacher)
  markDailyAttendance: async (classroomId, date, attendanceData) => {
    try {
      const response = await apiClient.post("/attendance/daily", {
        classroomId,
        date,
        attendanceData,
      });
      return response.data;
    } catch (error) {
      console.error("Error marking attendance:", error);
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  // Get flagged students (chronic absenteeism). Backend endpoint TBD.
  getFlaggedStudents: async (classroomId) => {
    try {
      const response = await apiClient.get(`/attendance/classroom/${classroomId}/flagged`).catch(() => ({ data: { success: false, flagged: [] } }));
      return response?.data?.success ? response.data : { success: true, flagged: [] };
    } catch (error) {
      return { success: false, flagged: [], message: error.message };
    }
  },

  // Get child attendance (for parents). Backend endpoint TBD.
  getChildAttendance: async (childId) => {
    try {
      const response = await apiClient.get(`/attendance/child/${childId}`).catch(() => ({ data: { success: false, records: [] } }));
      return response?.data?.success ? response.data : { success: true, records: [], attendanceRate: 0 };
    } catch (error) {
      return { success: false, records: [], attendanceRate: 0 };
    }
  },
};

export default attendanceService;
