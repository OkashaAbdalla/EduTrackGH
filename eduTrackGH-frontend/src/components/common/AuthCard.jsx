/**
 * Auth Card Component
 * Purpose: Authentication card with login/register options
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

const AuthCard = () => {
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
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-slate-800 text-gray-400">OR CONTINUE WITH</span>
          </div>
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center space-x-2 bg-slate-700/50 border border-slate-600 text-white py-3 rounded-lg hover:bg-slate-700 transition">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-sm">Google</span>
          </button>
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
