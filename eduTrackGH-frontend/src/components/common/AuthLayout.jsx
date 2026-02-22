/**
 * Auth Layout Component
 * Purpose: Shared layout for authentication pages
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900/90 via-slate-900/75 to-slate-950/95 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to={ROUTES.HOME} className="inline-flex items-center space-x-2 group">
            <div className="w-12 h-12 bg-green-700 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:shadow-lg group-hover:shadow-green-500/50 group-hover:scale-110">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-green-600 dark:group-hover:text-green-400">Edu<span className="text-green-600 dark:text-green-400">Track GH</span></span>
          </Link>
        </div>

        {/* Content */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:shadow-green-500/10 hover:shadow-2xl hover:border-green-500/30">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
