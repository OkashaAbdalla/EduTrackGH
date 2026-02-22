/**
 * Register Page - Account registration (teacher, headteacher, parent)
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout, FormInput } from '../../components/common';
import { useToast, useAuthContext } from '../../context';
import { ROUTES } from '../../utils/constants';
import { validateRegisterForm } from '../../utils/registerHelpers';

const Register = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { register } = useAuthContext();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateRegisterForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    setLoading(true);

    try {
      const result = await register(formData);
      
      if (result.success) {
        localStorage.setItem('pendingVerificationEmail', formData.email);
        showToast(result.message || 'Registration successful! Please verify your email.', 'success');
        setTimeout(() => {
          navigate(ROUTES.VERIFY_EMAIL);
        }, 1000);
      } else {
        showToast(result.message || 'Registration failed. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6 flex items-center justify-start">
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
      <div className="mb-5 rounded-3xl border border-slate-200/70 bg-white/80 px-5 py-5 text-center shadow-[0_18px_40px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/5">
        <div className="mb-4 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-600 text-white shadow-[0_12px_24px_rgba(22,163,74,0.35)]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            Edu<span className="text-green-600 dark:text-green-400">Track</span> GH
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Account</h2>
        <p className="text-[11px] text-gray-700 dark:text-gray-300 font-semibold tracking-wide uppercase">
          Join EduTrack GH and help monitor attendance in your basic school.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/5">
        <FormInput
          label="Full Name"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="e.g. Amina Yakubu"
          error={errors.fullName}
          required
        />
        <FormInput
          label="Phone Number (optional)"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="e.g. 0241234567 or +233241234567"
          error={errors.phone}
        />
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
        <FormInput label="Password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="At least 8 characters" error={errors.password} required />
        <FormInput label="Confirm Password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter your password" error={errors.confirmPassword} required />

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-gradient-to-r from-green-600 to-green-700 dark:from-green-600 dark:to-green-700 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 dark:hover:from-green-700 dark:hover:to-green-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/30 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center justify-center space-x-2">
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    
    </AuthLayout>
  );
};

export default Register;
