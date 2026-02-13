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
  // Get attendance history for a specific classroom
  getClassroomAttendanceHistory: async (classroomId, month) => {
    try {
      const params = new URLSearchParams();
      if (month) {
        params.append("month", month);
      }
      const response = await apiClient.get(
        `/attendance/classroom/${classroomId}?${params}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching classroom attendance history:", error);
      return { success: false, records: [], message: error.message };
    }
  },

  // Mark daily attendance for a class
  markDailyAttendance: async (classroomId, date, attendanceData) => {
    try {
      const response = await apiClient.post("/attendance/mark", {
        classroomId,
        date,
        attendanceData,
      });
      return response.data;
    } catch (error) {
      console.error("Error marking attendance:", error);
      return { success: false, message: error.message };
    }
  },

  // Get flagged students (chronic absenteeism)
  getFlaggedStudents: async (classroomId) => {
    try {
      // TODO: Implement backend endpoint
      return {
        success: true,
        flagged: [],
      };
    } catch (error) {
      console.error("Error fetching flagged students:", error);
      return { success: false, flagged: [] };
    }
  },

  // Get child attendance (for parents)
  getChildAttendance: async (childId) => {
    try {
      // TODO: Implement backend endpoint
      return {
        success: true,
        records: [],
        attendanceRate: 0,
      };
    } catch (error) {
      console.error("Error fetching child attendance:", error);
      return { success: false, records: [] };
    }
  },
};

export default attendanceService;
