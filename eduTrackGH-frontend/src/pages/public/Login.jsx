/**
 * Login Page with Toast Notifications
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout, FormInput } from '../../components/common';
import { useToast, useAuthContext } from '../../context';
import { ROUTES } from '../../utils/constants';
import { validateLoginForm, getRoleRedirectPath } from '../../utils/loginHelpers';

const Login = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { login } = useAuthContext();
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
      const result = await login(formData.email, formData.password);
      console.log('Login result:', result);

      if (result.success) {
        showToast('Login successful! Redirecting...', 'success');
        const redirectPath = getRoleRedirectPath(result.user.role);
        console.log('User role:', result.user.role, 'Redirecting to:', redirectPath);

        setTimeout(() => {
          console.log('Navigating to:', redirectPath);
          navigate(redirectPath);
        }, 1000);
      } else {
        console.warn('Login failed:', result.message);
        showToast(result.message || 'Invalid email or password', 'error');
      }
    } catch (err) {
      console.error('Login exception:', err);
      showToast('Invalid email or password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-3 flex items-center justify-start">
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-white/80"
          aria-label="Back to landing page"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to home
        </Link>
      </div>

      <div className="mb-3 rounded-3xl border border-slate-200/70 bg-white/80 px-4 py-3 text-center shadow-[0_16px_32px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/5">
        <div className="mb-2 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-700 text-white shadow-[0_10px_20px_rgba(22,163,74,0.3)]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            Edu<span className="text-green-600 dark:text-green-400">Track</span> GH
          </span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1.5">Welcome Back</h2>
        <p className="text-[11px] text-gray-700 dark:text-gray-300 font-semibold tracking-wide uppercase">
          Sign in to access your EduTrack GH attendance dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-[0_16px_32px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/5">
        <FormInput
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          error={errors.email}
          required
        />

          <FormInput
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            error={errors.password}
            required
          />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 dark:from-green-600 dark:to-green-700 text-white py-2.5 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 dark:hover:from-green-700 dark:hover:to-green-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/30 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center justify-center space-x-2">
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
        </button>
      </form>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
          Don't have an account?{' '}
          <Link to={ROUTES.REGISTER} className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
