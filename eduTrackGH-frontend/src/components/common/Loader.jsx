/**
 * Loading Spinner
 */

const Loader = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return <div className={`ui-spinner ${sizes[size]} ${className}`} role="status" aria-label="Loading" />;
};

export default Loader;
