import React from 'react';
export function Badge({ tone = 'neutral', children, style, ...rest }) {
  const tones = {
    neutral: { background: 'var(--white)', color: 'var(--ink-navy)', border: '1px solid var(--ruled-blue)' },
    success: { background: 'var(--earned-green-soft)', color: 'var(--earned-green)', border: '1px solid var(--earned-green)' },
    accent: { background: 'var(--paper)', color: 'var(--margin-red)', border: '1px solid var(--margin-red)' },
  };
  return React.createElement('span', {
    style: { display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.04em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 'var(--radius-pill)', ...tones[tone], ...style }, ...rest,
  }, children);
}
