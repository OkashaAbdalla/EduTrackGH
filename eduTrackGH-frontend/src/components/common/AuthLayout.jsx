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
        {/* Content */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:shadow-green-500/10 hover:shadow-2xl hover:border-green-500/30">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
