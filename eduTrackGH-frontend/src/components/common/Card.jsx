/**
 * Card — glass panels (default) or elevated solid variant
 */

const Card = ({ children, className = '', variant = 'default', hover = false }) => {
  const variantClass =
    variant === 'solid'
      ? 'ui-card-solid'
      : variant === 'stats'
        ? 'ui-card-stats'
        : variant === 'action'
          ? 'ui-card ui-card-hover'
          : 'ui-card';
  const hoverClass = hover ? 'ui-card-hover' : '';

  return <div className={`${variantClass} ${hoverClass} ${className}`.trim()}>{children}</div>;
};

export default Card;
