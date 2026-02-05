/**
 * Card Component
 * Purpose: Modern container for content sections with beautiful styling
 * Features: Rounded corners, modern shadows, gradient borders, glassmorphism
 * Usage: Dashboard widgets, attendance records, stats cards
 */

const Card = ({ children, className = '', variant = 'default', hover = false }) => {
  const baseStyles = 'rounded-xl transition-all duration-300';
  
  const variants = {
    default: 'bg-white dark:bg-gray-800/90 border border-gray-200/50 dark:border-gray-700/50 shadow-lg dark:shadow-2xl backdrop-blur-sm',
    stats: 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/95 dark:to-gray-900/95 border border-gray-200/50 dark:border-gray-700/50 shadow-xl dark:shadow-2xl backdrop-blur-sm',
    action: 'bg-white dark:bg-gray-800/90 border border-gray-200/50 dark:border-gray-700/50 shadow-lg dark:shadow-2xl backdrop-blur-sm',
  };

  const hoverStyles = hover 
    ? 'hover:shadow-2xl hover:scale-[1.02] hover:border-green-500/50 dark:hover:border-green-400/50' 
    : '';

  return (
    <div className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
