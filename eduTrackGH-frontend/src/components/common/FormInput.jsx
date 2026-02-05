/**
 * Form Input Component
 * Purpose: Reusable form input with modern styling and error display
 */

const FormInput = ({ label, type = 'text', name, value, onChange, placeholder, required = false, error = '' }) => {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={`w-full bg-white dark:bg-gray-700/80 border-2 ${
            error 
              ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500/30' 
              : 'border-gray-300 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-green-500/30 dark:focus:ring-green-400/30'
          } text-gray-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-4 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200`}
        />
        {!error && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-green-500 opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export default FormInput;
