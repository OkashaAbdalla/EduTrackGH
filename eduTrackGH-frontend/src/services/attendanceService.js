/**
 * Attendance Service
 * Purpose: API calls for attendance operations (EduTrack GH)
 * Endpoints:
 *   - markDailyAttendance(classroomId, date, attendanceData): POST /api/attendance/mark
 *   - getClassroomAttendanceHistory(classroomId, month | { month?, term? }): GET .../daily
 *   - getFlaggedStudents(classroomId): GET /api/attendance/flagged
 *   - getChildAttendance(childId): GET /api/attendance/child/:id (for parents)
 */

import apiClient from "./api";

const attendanceService = {
  // Get daily attendance history for a classroom (teacher)
  /** @param {string} [month] legacy: YYYY-MM — or pass options `{ month }` or `{ term: 'TERM_1'|'TERM_2'|'TERM_3' }` */
  getClassroomAttendanceHistory: async (classroomId, monthOrOptions) => {
    try {
      let params = {};
      if (monthOrOptions && typeof monthOrOptions === "object" && !Array.isArray(monthOrOptions)) {
        if (monthOrOptions.month) params.month = monthOrOptions.month;
        if (monthOrOptions.term) params.term = monthOrOptions.term;
      } else if (monthOrOptions) {
        params = { month: monthOrOptions };
      }
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

  // Phase 5: Upload photo for attendance verification (longer timeout for Cloudinary)
  uploadPhoto: async (base64Image) => {
    try {
      const response = await apiClient.post('/attendance/upload-photo', { image: base64Image }, { timeout: 30000 });
      return response.data;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  // Check if attendance for classroom+date is locked (teacher)
  getAttendanceLockStatus: async (classroomId, date) => {
    try {
      const response = await apiClient.get(`/attendance/daily/status/${classroomId}/${date}`);
      return response.data;
    } catch (error) {
      return { success: false, locked: false, message: error.response?.data?.message || error.message };
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

  // Delete a whole week of attendance (teacher)
  deleteAttendanceWeek: async (classroomId, weekStartDate) => {
    try {
      const response = await apiClient.delete(`/attendance/classroom/${classroomId}/week/${weekStartDate}`);
      return response.data;
    } catch (error) {
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
