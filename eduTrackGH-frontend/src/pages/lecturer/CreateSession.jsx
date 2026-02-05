/**
 * Create Session Page (Lecturer)
 * Purpose: Form to create new attendance session
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { FormInput } from '../../components/common';
import { ROUTES } from '../../utils/constants';

const CreateSession = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    courseName: '',
    courseCode: '',
    duration: '60',
    location: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate(ROUTES.MANAGE_SESSIONS, { state: { message: 'Session created successfully!' } });
    } catch (err) {
      setError('Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Create Attendance Session</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Start a new session for students to mark attendance</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-500 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Course Name"
              name="courseName"
              value={formData.courseName}
              onChange={handleChange}
              placeholder="Computer Networks"
              required
            />

            <FormInput
              label="Course Code"
              name="courseCode"
              value={formData.courseCode}
              onChange={handleChange}
              placeholder="CSC 301"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (minutes)
              </label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>

            <FormInput
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Lecture Hall A"
              required
            />

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating Session...' : 'Create & Activate Session'}
              </button>
              <button
                type="button"
                onClick={() => navigate(ROUTES.LECTURER_DASHBOARD)}
                className="px-6 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateSession;
