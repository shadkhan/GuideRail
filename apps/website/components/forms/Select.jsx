import React from 'react';
export function Select({ label, options = [], value, onChange, disabled = false, style }) {
  return React.createElement('label', { style: { display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-body)', width: '100%' } },
    label && React.createElement('span', { style: { fontSize: 13, fontWeight: 600, color: 'var(--ink-navy)' } }, label),
    React.createElement('select', {
      value, onChange, disabled,
      style: { fontFamily: 'var(--font-body)', fontSize: 16, padding: '11px 14px', borderRadius: 'var(--radius-sm)', border: '2px solid var(--ruled-blue)', background: 'var(--white)', color: 'var(--ink-navy)', opacity: disabled ? 0.6 : 1, ...style },
    }, options.map(o => React.createElement('option', { key: o.value ?? o, value: o.value ?? o }, o.label ?? o))));
}
