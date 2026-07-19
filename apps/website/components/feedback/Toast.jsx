import React from 'react';
export function Toast({ tone = 'success', children }) {
  const tones = {
    success: { background: 'var(--earned-green-soft)', border: 'var(--earned-green)', color: 'var(--earned-green)' },
    info: { background: 'var(--white)', border: 'var(--ink-navy)', color: 'var(--ink-navy)' },
  };
  const t = tones[tone];
  return React.createElement('div', { style: { display: 'inline-flex', alignItems: 'center', gap: 10, background: t.background, border: `2px solid ${t.border}`, borderRadius: 'var(--radius-md)', padding: '12px 18px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: t.color, boxShadow: 'var(--shadow-hard-sm)' } }, children);
}
