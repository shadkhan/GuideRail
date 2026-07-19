import React from 'react';
export function Tag({ active = false, children, onClick, style, ...rest }) {
  return React.createElement('button', {
    onClick,
    style: { fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, padding: '6px 14px', borderRadius: 'var(--radius-pill)', border: `1px solid ${active ? 'var(--margin-red)' : 'var(--ruled-blue)'}`, background: active ? 'var(--margin-red)' : 'transparent', color: active ? 'var(--paper)' : 'var(--ink-navy)', cursor: 'pointer', transition: 'background var(--duration-fast) var(--ease-standard)', ...style },
    'style-hover': active ? {} : { background: 'var(--ruled-blue)' },
    ...rest,
  }, children);
}
