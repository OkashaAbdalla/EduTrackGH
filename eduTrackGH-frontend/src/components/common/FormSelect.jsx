/**
 * Form Select — consistent styling in light and dark mode
 */

const FormSelect = ({
  label,
  value,
  onChange,
  children,
  className = '',
  size = 'md',
  disabled = false,
  required = false,
  id,
  hint = '',
  error = '',
  ...rest
}) => {
  const sizeClass = size === 'sm' ? 'ui-select-sm' : size === 'inline' ? 'ui-select-inline' : '';
  const selectId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);

  return (
    <div className={className.includes('w-') ? '' : 'min-w-0'}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-[color:var(--text-primary)] mb-1.5"
        >
          {label}
          {required && <span className="text-[color:var(--danger)] ml-0.5">*</span>}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`ui-select ${sizeClass} ${className}`.trim()}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="mt-1.5 text-sm text-[color:var(--danger)]">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-[color:var(--text-muted)]">{hint}</p>}
    </div>
  );
};

export default FormSelect;
