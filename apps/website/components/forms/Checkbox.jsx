import React from 'react';
export function Checkbox({ label, checked = false, onChange, disabled = false, style, ...rest }) {
  return React.createElement('label', { style: { display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-navy)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, ...style } },
    React.createElement('span', {
      style: { width: 20, height: 20, borderRadius: 6, border: '2px solid var(--ink-navy)', background: checked ? 'var(--earned-green)' : 'var(--white)', borderColor: checked ? 'var(--earned-green)' : 'var(--ink-navy)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    }, checked && React.createElement('svg', { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'var(--paper)', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }, React.createElement('path', { d: 'M20 6 9 17l-5-5' }))),
    React.createElement('input', { type: 'checkbox', checked, onChange, disabled, style: { display: 'none' }, ...rest }),
    label);
}
