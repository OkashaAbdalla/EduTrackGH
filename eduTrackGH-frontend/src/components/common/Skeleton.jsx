/**
 * Skeleton Loader Component
 * Purpose: Show loading placeholders instead of spinners
 */

const Skeleton = ({ className = '', variant = 'default' }) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';
  
  if (variant === 'card') {
    return (
      <div className={`${baseClasses} ${className} p-6`}>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
      </div>
    );
  }

  if (variant === 'stats') {
    return (
      <div className={`${baseClasses} ${className} p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-3"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          </div>
          <div className="w-14 h-14 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return <div className={`${baseClasses} ${className}`}></div>;
};

export default Skeleton;
