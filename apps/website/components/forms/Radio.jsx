import React from 'react';
export function Radio({ label, checked = false, onChange, disabled = false, style, ...rest }) {
  return React.createElement('label', { style: { display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-navy)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, ...style } },
    React.createElement('span', {
      style: { width: 20, height: 20, borderRadius: '50%', border: `2px solid ${checked ? 'var(--margin-red)' : 'var(--ink-navy)'}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    }, checked && React.createElement('span', { style: { width: 10, height: 10, borderRadius: '50%', background: 'var(--margin-red)' } })),
    React.createElement('input', { type: 'radio', checked, onChange, disabled, style: { display: 'none' }, ...rest }),
    label);
}
