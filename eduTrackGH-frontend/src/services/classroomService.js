/**
 * Classroom Service (EduTrack GH)
 * Purpose: API calls for classroom/class management
 * Endpoints (mocked for now):
 *   - getClassrooms(teacherId): GET /classrooms
 *   - getClassroomDetails(classroomId): GET /classrooms/:id
 *   - getStudentsInClass(classroomId): GET /classrooms/:id/students
 * Returns: Mock responses matching expected backend structure
 */

import apiClient from './api';

const classroomService = {
  // Get classrooms assigned to a teacher
  getClassrooms: async (teacherId) => {
    // Mock implementation
    return { 
      success: true, 
      classrooms: [] 
    };
  },

  // Get classroom details
  getClassroomDetails: async (classroomId) => {
    // Mock implementation
    return { 
      success: true, 
      classroom: null 
    };
  },

  // Get students in a classroom
  getStudentsInClass: async (classroomId) => {
    // Mock implementation
    return { 
      success: true, 
      students: [] 
    };
  },
};

export default classroomService;
