/**
 * Verify Email Page Component
 * Purpose: Email verification confirmation page
 * 
 * Features:
 *   - Auto-verify when token in URL
 *   - Show verification status
 *   - Resend verification email
 *   - Redirect to login on success
 * 
 * Note: Shown after registration or when clicking email link
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import authService from '../../services/authService';
import Loader from '../../components/common/Loader';
import { useToast } from '../../context/ToastContext';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [status, setStatus] = useState('checking'); // checking, success, error, waiting
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const token = searchParams.get('token');
  const email = localStorage.getItem('pendingVerificationEmail');

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setStatus('waiting');
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await authService.verifyEmail(token);
      setStatus('success');
      setMessage(response.message || 'Email verified successfully!');
      localStorage.removeItem('pendingVerificationEmail');
      setTimeout(() => navigate(ROUTES.LOGIN), 3000);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Verification failed. Invalid or expired token.');
    }
  };

  const handleResend = async () => {
    if (!email) {
      showToast('Email address not found. Please register again.', 'error');
      return;
    }

    setResending(true);
    try {
      const response = await authService.resendVerification(email);
      showToast(response.message || 'Verification email sent!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to resend email', 'error');
    } finally {
      setResending(false);
    }
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to={ROUTES.HOME} className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-green-700 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              EduTrack<span className="text-green-600 dark:text-green-400"> GH</span>
            </span>
          </Link>
        </div>

        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-8 shadow-2xl text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
            status === 'success' ? 'bg-green-500/20' : status === 'error' ? 'bg-red-500/20' : 'bg-blue-500/20'
          }`}>
            <svg className={`w-8 h-8 ${
              status === 'success' ? 'text-green-600 dark:text-green-400' : 
              status === 'error' ? 'text-red-600 dark:text-red-400' : 
              'text-blue-600 dark:text-blue-400'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {status === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : status === 'error' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              )}
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {status === 'success' ? 'Email Verified!' : status === 'error' ? 'Verification Failed' : 'Check Your Email'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {message || 'We\'ve sent a verification link to your email address. Please click the link to verify your account.'}
          </p>

          <div className="space-y-3">
            <Link
              to={ROUTES.LOGIN}
              className="block w-full bg-gradient-to-r from-green-600 to-green-700 dark:from-green-600 dark:to-green-700 text-white py-3.5 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 dark:hover:from-green-700 dark:hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-green-500/30 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center space-x-2">
                <span>{status === 'success' ? 'Redirecting to Login...' : 'Go to Login'}</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
            </Link>

            {status === 'waiting' && email && (
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full bg-white dark:bg-gray-700/50 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3.5 rounded-xl font-semibold hover:border-green-500 dark:hover:border-green-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? 'Sending...' : 'Resend Email'}
              </button>
            )}
          </div>

          {status === 'waiting' && (
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-6">
              Didn't receive the email? Check your spam folder.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
