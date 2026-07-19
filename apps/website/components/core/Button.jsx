import React from 'react';
const sizes = {
  sm: { padding: '8px 14px', fontSize: 'var(--text-sm)' },
  md: { padding: '11px 20px', fontSize: 'var(--text-body)' },
  lg: { padding: '14px 26px', fontSize: 'var(--text-md)' },
};
export function Button({ variant = 'primary', size = 'md', disabled = false, children, style, ...rest }) {
  const base = {
    fontFamily: 'var(--font-display)', fontWeight: 700, borderRadius: 'var(--radius-md)',
    border: '2px solid var(--ink-navy)', cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'transform var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
    opacity: disabled ? 0.5 : 1, ...sizes[size],
  };
  const variants = {
    primary: { background: 'var(--margin-red)', color: 'var(--paper)', borderColor: 'var(--ink-navy)', boxShadow: 'var(--shadow-hard-ink)' },
    secondary: { background: 'var(--paper)', color: 'var(--ink-navy)', borderColor: 'var(--ink-navy)', boxShadow: 'var(--shadow-hard)' },
    ghost: { background: 'transparent', color: 'var(--ink-navy)', border: '2px solid transparent', boxShadow: 'none' },
  };
  return React.createElement('button', {
    disabled, style: { ...base, ...variants[variant], ...style },
    'style-hover': disabled ? {} : { transform: 'translate(-2px,-2px)', boxShadow: variant === 'ghost' ? 'none' : '10px 10px 0 var(--ruled-blue)' },
    'style-active': disabled ? {} : { transform: 'translate(2px,2px)', boxShadow: variant === 'ghost' ? 'none' : '2px 2px 0 var(--ruled-blue)' },
    ...rest,
  }, children);
}
