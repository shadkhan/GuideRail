import React from 'react';
export function Card({ children, shadow = 'hard', style, ...rest }) {
  const shadows = { hard: 'var(--shadow-hard)', accent: 'var(--shadow-hard-accent)', none: 'none' };
  return React.createElement('div', {
    style: { background: 'var(--white)', border: '2px solid var(--ink-navy)', borderRadius: 'var(--radius-lg)', boxShadow: shadows[shadow], padding: 'var(--space-5)', ...style }, ...rest,
  }, children);
}
