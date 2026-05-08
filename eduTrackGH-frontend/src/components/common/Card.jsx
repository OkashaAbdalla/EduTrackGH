/**
 * Card Component
 * Purpose: Raised panels on the dashboard canvas (light: white; dark: slate surface)
 */

const Card = ({ children, className = '', variant = 'default', hover = false }) => {
  const baseStyles = 'rounded-xl transition-all duration-200';

  const variants = {
    default:
      'bg-white dark:bg-dashboard-surface border border-slate-200/90 dark:border-slate-700/70 shadow-sm dark:shadow-none',
    stats:
      'bg-white dark:bg-dashboard-surface border border-slate-200/90 dark:border-slate-700/70 shadow-sm dark:shadow-none',
    action:
      'bg-white dark:bg-dashboard-surface border border-slate-200/90 dark:border-slate-700/70 shadow-sm dark:shadow-none',
  };

  const hoverStyles = hover
    ? 'hover:shadow-md dark:hover:border-slate-600/90 hover:border-slate-300/90 dark:hover:bg-[#243447]'
    : '';

  return (
    <div className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
