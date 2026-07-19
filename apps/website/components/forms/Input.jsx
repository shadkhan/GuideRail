import React from 'react';
export function Input({ label, placeholder, error, disabled = false, type = 'text', style, ...rest }) {
  return React.createElement('label', { style: { display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-body)', width: '100%' } },
    label && React.createElement('span', { style: { fontSize: 13, fontWeight: 600, color: 'var(--ink-navy)' } }, label),
    React.createElement('input', {
      type, placeholder, disabled,
      style: { fontFamily: 'var(--font-body)', fontSize: 16, padding: '11px 14px', borderRadius: 'var(--radius-sm)', border: `2px solid ${error ? 'var(--margin-red)' : 'var(--ruled-blue)'}`, background: disabled ? 'var(--ruled-blue)' : 'var(--white)', color: 'var(--ink-navy)', outline: 'none', opacity: disabled ? 0.6 : 1, ...style },
      'style-focus': { borderColor: 'var(--ink-navy)' },
      ...rest,
    }),
    error && React.createElement('span', { style: { fontSize: 12, color: 'var(--margin-red)', fontFamily: 'var(--font-mono)' } }, error));
}
