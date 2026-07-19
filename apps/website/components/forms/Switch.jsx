import React from 'react';
export function Switch({ checked = false, onChange, disabled = false, label, style }) {
  return React.createElement('label', { style: { display: 'inline-flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-navy)', ...style } },
    React.createElement('span', {
      onClick: disabled ? undefined : onChange,
      style: { width: 44, height: 26, borderRadius: 'var(--radius-pill)', background: checked ? 'var(--earned-green)' : 'var(--ruled-blue)', border: '2px solid var(--ink-navy)', position: 'relative', transition: 'background var(--duration-normal) var(--ease-standard)', flexShrink: 0 },
    }, React.createElement('span', { style: { position: 'absolute', top: 2, left: checked ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: 'var(--white)', border: '2px solid var(--ink-navy)', transition: 'left var(--duration-normal) var(--ease-standard)' } })),
    label);
}
