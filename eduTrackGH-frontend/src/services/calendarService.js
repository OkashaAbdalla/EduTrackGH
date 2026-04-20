/**
 * GES Calendar API
 */

import apiClient from './api';

const calendarService = {
  getActiveCalendar: () => apiClient.get('/calendar/active'),

  listCalendars: () => apiClient.get('/calendar'),

  getCalendarById: (id) => apiClient.get(`/calendar/${id}`),

  createCalendar: (body) => apiClient.post('/calendar', body),

  updateCalendar: (id, body) => apiClient.put(`/calendar/${id}`, body),

  deleteCalendar: (id) => apiClient.delete(`/calendar/${id}`),

  activateAcademicYear: (academicYear) =>
    apiClient.post('/calendar/actions/activate-year', { academicYear }),

  seedDefault: () => apiClient.post('/calendar/actions/seed-default', {}),
};

export default calendarService;
