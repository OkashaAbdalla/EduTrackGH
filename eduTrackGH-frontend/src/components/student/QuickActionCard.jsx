/**
 * Quick Action Card Component
 * Purpose: Navigation cards for main actions
 */

import { Link } from 'react-router-dom';

const QuickActionCard = ({ to, icon, title, description, color = 'green' }) => {
  const colorClasses = {
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
  };

  return (
    <Link
      to={to}
      className={`block bg-gradient-to-br ${colorClasses[color]} text-white rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 group`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
          {icon}
        </div>
        <svg className="w-6 h-6 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-white/80 text-sm">{description}</p>
    </Link>
  );
};

export default QuickActionCard;
