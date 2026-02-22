/**
 * Create Headteacher Page (Admin)
 * Purpose: Admin form to create new headteacher accounts
 * Can optionally assign to a school during creation
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { FormInput } from '../../components/common';
import { ROUTES } from '../../utils/constants';
import adminService from '../../services/adminService';
import { useToast } from '../../context';

const CreateHeadteacher = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [schools, setSchools] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    schoolId: '',
    schoolLevel: 'PRIMARY',
    tempPassword: '',
  });

  useEffect(() => {
    adminService.getSchools(false).then((res) => {
      if (res.success && res.schools) {
        setSchools(res.schools || []);
      }
    }).catch(() => {});
  }, []);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    // Basic email validation - can be enhanced later
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const generatePassword = () => {
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
    setFormData({ ...formData, tempPassword: password });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const result = await adminService.createHeadteacher({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        schoolId: formData.schoolId || undefined,
        schoolLevel: formData.schoolLevel,
        tempPassword: formData.tempPassword,
      });
      
      if (result.success) {
        setSuccess(`Headteacher account created successfully! Credentials sent to ${formData.email}`);
        showToast('Headteacher created successfully', 'success');
        
        // Reset form
        setTimeout(() => {
          setFormData({ fullName: '', email: '', phone: '', schoolId: '', schoolLevel: 'PRIMARY', tempPassword: '' });
          setSuccess('');
        }, 3000);
      } else {
        setError(result.message || 'Failed to create headteacher account');
        showToast(result.message || 'Failed to create headteacher', 'error');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create headteacher account. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Create Headteacher Account</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Add a new headteacher to manage a school</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-500 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-500 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Amina Yakubu"
              required
            />

            <FormInput
              label="Phone Number (optional)"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0241234567 or +233241234567"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assign to School (Optional)
              </label>
              <select
                name="schoolId"
                value={formData.schoolId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select school (leave empty to assign later)</option>
                {schools
                  .filter(s => s.isActive && !s.headteacher)
                  .map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.schoolLevel})
                    </option>
                  ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Only schools without a headteacher are shown
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                School Level <span className="text-red-500">*</span>
              </label>
              <select
                name="schoolLevel"
                value={formData.schoolLevel}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="PRIMARY">Primary Headteacher (P1-P6)</option>
                <option value="JHS">JHS Headteacher (JHS 1-3)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Select whether this headteacher manages Primary or JHS section
              </p>
            </div>

            <FormInput
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="headteacher@example.com"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Temporary Password
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="tempPassword"
                  value={formData.tempPassword}
                  onChange={handleChange}
                  placeholder="Click generate or enter manually"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={generatePassword}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
                >
                  Generate
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Headteacher will be required to change password on first login
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Headteacher Account'}
              </button>
              <button
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
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

export default CreateHeadteacher;
