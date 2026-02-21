/**
 * Classroom Service (EduTrack GH)
 * Purpose: API calls for classroom/class management
 * Endpoints:
 *   - getTeacherClassrooms(): GET /api/classrooms
 *   - getClassroomDetails(classroomId): GET /api/classrooms/:id
 *   - getClassroomStudents(classroomId): GET /api/classrooms/:id/students
 */

import apiClient from "./api";

const classroomService = {
  // Get classrooms assigned to current teacher
  getTeacherClassrooms: async () => {
    try {
      const response = await apiClient.get("/classrooms");
      return response.data;
    } catch (error) {
      console.error("Error fetching teacher classrooms:", error);
      return { success: false, classrooms: [], message: error.message };
    }
  },

  // Get classroom details
  getClassroomDetails: async (classroomId) => {
    try {
      const response = await apiClient.get(`/classrooms/${classroomId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching classroom details:", error);
      return { success: false, classroom: null, message: error.message };
    }
  },

  // Get students in a classroom
  getClassroomStudents: async (classroomId) => {
    try {
      const response = await apiClient.get(
        `/classrooms/${classroomId}/students`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching classroom students:", error);
      return { success: false, students: [], message: error.message };
    }
  },
};

export default classroomService;
