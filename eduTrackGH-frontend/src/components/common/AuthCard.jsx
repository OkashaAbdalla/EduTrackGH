/**
 * Auth Card Component
 * Purpose: Authentication card with login/register options
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import GoogleSignInButton from './GoogleSignInButton';
import { useGoogleLoginHandler } from '../../hooks/useGoogleLoginHandler';

const AuthCard = () => {
  const { handleGoogleCredential, handleGoogleError } = useGoogleLoginHandler();

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:shadow-green-500/10 hover:shadow-2xl hover:border-green-500/30 group max-w-md mx-auto lg:mx-0">
      <div className="space-y-5">
        {/* Header */}
        <div className="text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 relative group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
            EduTrack GH
          </h2>
          <p className="text-gray-600 dark:text-gray-400 relative">
            Digital absenteeism tracking for Primary and JHS schools.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link to={ROUTES.LOGIN} className="block w-full bg-gradient-to-r from-green-600 to-green-700 dark:from-green-600 dark:to-green-700 text-white py-3.5 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 dark:hover:from-green-700 dark:hover:to-green-800 transition-all duration-300 text-center shadow-lg hover:shadow-green-500/30 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
            <div className="flex items-center justify-center space-x-2 relative z-10">
              <span>Log In</span>
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>
          <Link to={ROUTES.REGISTER} className="block w-full bg-white dark:bg-gray-700/50 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white py-3.5 rounded-xl font-semibold hover:border-green-500 dark:hover:border-green-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 text-center hover:shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/50 dark:via-gray-600/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
            <span className="relative z-10">Create Account</span>
          </Link>
        </div>

        {/* Divider */}
        <div className="relative my-2 h-5">
          <div className="absolute inset-0 flex items-center pointer-events-none">
            <div className="w-full border-t border-slate-600" />
          </div>
          <div className="relative flex h-full items-center justify-center text-sm">
            <span className="px-4 bg-gray-800/90 text-gray-400 dark:bg-gray-800/90">OR CONTINUE WITH</span>
          </div>
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-2 gap-3">
          <GoogleSignInButton
            fullWidth
            onCredential={handleGoogleCredential}
            onError={handleGoogleError}
          />
          <button className="flex items-center justify-center space-x-2 bg-slate-700/50 border border-slate-600 text-white py-3 rounded-lg hover:bg-slate-700 transition">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3Z" fill="#22c55e" stroke="#16a34a" strokeWidth="1"/>
              <path d="M12 12.5L6 9.5L12 6.5L18 9.5L12 12.5Z" fill="#16a34a"/>
              <path d="M12 19L7 16.5V12.5L12 15L17 12.5V16.5L12 19Z" fill="#16a34a"/>
            </svg>
            <span className="text-sm">School ID</span>
          </button>
        </div>

        {/* Security Badges */}
        <div className="flex items-center justify-center space-x-6 pt-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>SSL SECURE</span>
          </div>
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>AES-256</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCard;
