// app/components/Input.jsx
'use client';

export function Input({ className = '', style = {}, ...props }) {
  return (
    <input
      style={{
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: '10px',
        border: '1px solid #d2d2d7',
        background: '#ffffff',
        color: '#1d1d1f',
        fontSize: '0.9375rem',
        fontFamily: 'inherit',
        letterSpacing: '-0.01em',
        outline: 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#0071e3';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 113, 227, 0.15)';
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = '#d2d2d7';
        e.currentTarget.style.boxShadow = 'none';
        props.onBlur?.(e);
      }}
      className={className}
      {...props}
    />
  );
}
