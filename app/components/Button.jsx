// app/components/Button.jsx
'use client';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '980px',
    fontFamily: 'inherit',
    fontWeight: 500,
    letterSpacing: '-0.01em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    opacity: disabled ? 0.5 : 1,
    textDecoration: 'none',
  };

  const sizes = {
    sm: { padding: '0.375rem 0.875rem', fontSize: '0.8125rem' },
    md: { padding: '0.625rem 1.25rem', fontSize: '0.9375rem' },
    lg: { padding: '0.875rem 1.75rem', fontSize: '1.0625rem' },
  };

  const variants = {
    primary: {
      background: '#0071e3',
      color: '#ffffff',
    },
    secondary: {
      background: '#e8e8ed',
      color: '#1d1d1f',
    },
    danger: {
      background: 'rgba(255, 69, 58, 0.1)',
      color: '#ff453a',
    },
    ghost: {
      background: 'transparent',
      color: '#0071e3',
    },
  };

  const style = { ...base, ...sizes[size], ...variants[variant] };

  return (
    <button
      style={style}
      disabled={disabled}
      className={className}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === 'primary') e.currentTarget.style.background = '#0077ed';
        if (variant === 'secondary') e.currentTarget.style.background = '#d2d2d7';
        if (variant === 'danger') e.currentTarget.style.background = 'rgba(255, 69, 58, 0.18)';
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        if (variant === 'primary') e.currentTarget.style.background = '#0071e3';
        if (variant === 'secondary') e.currentTarget.style.background = '#e8e8ed';
        if (variant === 'danger') e.currentTarget.style.background = 'rgba(255, 69, 58, 0.1)';
      }}
      {...props}
    >
      {children}
    </button>
  );
}
