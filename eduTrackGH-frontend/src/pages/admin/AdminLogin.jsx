/**
 * Admin Login Page
 * Isolated from public login. URL must not be linked from public pages.
 * Path: /{VITE_ADMIN_LOGIN_PATH} - e.g. /secure-admin-a1b2c3d4
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout, FormInput } from '../../components/common';
import { useToast, useAuthContext } from '../../context';
import { ROUTES } from '../../utils/constants';
import { validateLoginForm } from '../../utils/loginHelpers';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { adminLogin } = useAuthContext();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateLoginForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast('Please fix the errors in the form', 'error');
      return;
    }
    setLoading(true);
    try {
      const result = await adminLogin(formData.email, formData.password);
      if (result.success) {
        showToast('Admin login successful. Redirecting...', 'success');
        setTimeout(() => navigate(ROUTES.ADMIN_DASHBOARD), 800);
      } else {
        showToast(result.message || 'Invalid credentials', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Admin Access</h2>
        <p className="text-gray-600 dark:text-gray-400 text-base">Secure administrator portal. Authorized personnel only.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="admin@edutrack.gh"
          error={errors.email}
          required
        />
        <FormInput
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          error={errors.password}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-800 dark:bg-gray-700 text-white py-3.5 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-gray-600 transition-all disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Sign In'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default AdminLogin;
