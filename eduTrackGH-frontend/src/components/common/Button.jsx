/**
 * Button — design-system variants (no logic changes)
 */

const Button = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'ui-btn-primary',
    secondary: 'ui-btn-secondary',
    danger: 'ui-btn-danger',
    outline: 'ui-btn-outline',
    ghost: 'ui-btn-ghost',
    blue: 'ui-btn-primary bg-[color:var(--secondary)] hover:opacity-90 focus:ring-blue-500/25',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  };

  const classes = `ui-btn ${variants[variant] || variants.primary} ${sizes[size]} ${className}`.trim();

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;
