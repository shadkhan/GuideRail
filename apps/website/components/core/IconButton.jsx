import React from 'react';
export function IconButton({ icon, label, variant = 'secondary', disabled = false, style, ...rest }) {
  const variants = {
    primary: { background: 'var(--margin-red)', color: 'var(--paper)', border: '2px solid var(--ink-navy)' },
    secondary: { background: 'var(--paper)', color: 'var(--ink-navy)', border: '2px solid var(--ink-navy)' },
    ghost: { background: 'transparent', color: 'var(--ink-navy)', border: '2px solid transparent' },
  };
  return React.createElement('button', {
    'aria-label': label, disabled, title: label,
    style: { width: 40, height: 40, borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'transform var(--duration-fast) var(--ease-standard)', ...variants[variant], ...style },
    'style-hover': disabled ? {} : { transform: 'translate(-1px,-1px)' },
    'style-active': disabled ? {} : { transform: 'translate(1px,1px)' },
    ...rest,
  }, icon);
}
