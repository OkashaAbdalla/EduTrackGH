import { useMemo, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthLayout, FormInput } from '../../components/common';
import { ROUTES } from '../../utils/constants';
import { validatePassword } from '../../utils/validators';
import authService from '../../services/authService';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => validatePassword(password), [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Invalid reset link. Request a new one.');
      return;
    }
    if (!strength.isValid) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, and number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.resetPassword({ token, password, confirmPassword });
      if (!response?.success) {
        setError(response?.message || 'Failed to reset password');
        return;
      }
      setSuccess(response.message || 'Password reset successful.');
      setTimeout(() => navigate(ROUTES.LOGIN), 1000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid or expired reset token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">Set a new password for your parent account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="New Password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
          required
        />
        <FormInput
          label="Confirm New Password"
          type="password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          required
        />

        <div className="text-xs text-gray-600 dark:text-gray-400 rounded-lg bg-gray-50 dark:bg-gray-700/40 px-3 py-2">
          <p className={strength.errors.minLength ? 'text-green-600 dark:text-green-400' : ''}>- At least 8 characters</p>
          <p className={strength.errors.hasUpperCase ? 'text-green-600 dark:text-green-400' : ''}>- One uppercase letter</p>
          <p className={strength.errors.hasLowerCase ? 'text-green-600 dark:text-green-400' : ''}>- One lowercase letter</p>
          <p className={strength.errors.hasNumber ? 'text-green-600 dark:text-green-400' : ''}>- One number</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-300">
          {success}
        </div>
      )}

      <p className="mt-5 text-center text-sm text-gray-600 dark:text-gray-400">
        Back to{' '}
        <Link to={ROUTES.LOGIN} className="font-semibold text-green-600 dark:text-green-400 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ResetPassword;
