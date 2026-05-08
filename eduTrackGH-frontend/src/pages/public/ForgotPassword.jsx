import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout, FormInput } from '../../components/common';
import { ROUTES } from '../../utils/constants';
import { validateEmail } from '../../utils/validators';
import authService from '../../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!validateEmail(email)) {
      setError('Enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const response = await authService.forgotPassword(normalizedEmail);
      setMessage(
        response?.message ||
          `If this email exists, a reset link has been sent to ${normalizedEmail}.`
      );
    } catch (err) {
      if (!err.response) {
        setError(
          err?.message?.includes('Network') || err?.code === 'ERR_NETWORK'
            ? 'Network error. Check your connection and backend URL, then try again.'
            : 'Could not reach the server. Please try again.'
        );
        return;
      }
      const status = err.response?.status;
      const data = err.response?.data;
      const code = data?.code;
      if (status === 503 || code === 'EMAIL_SERVICE_UNAVAILABLE') {
        setError(data?.message || 'Email service is unavailable. Please try again later.');
        return;
      }
      if (status === 502 || code === 'EMAIL_DELIVERY_FAILED') {
        setError(data?.message || 'Could not send reset email. Please try again shortly.');
        return;
      }
      setError(data?.message || 'Failed to request reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot Password</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
          Enter the email you use to sign in and we will send reset instructions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          error={error}
          autoComplete="email"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      {message && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-300">
          {message}
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

export default ForgotPassword;
