import React from 'react';
export function Dialog({ open, title, children, onClose }) {
  if (!open) return null;
  return React.createElement('div', { style: { position: 'fixed', inset: 0, background: 'rgba(27,42,74,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }, onClick: onClose },
    React.createElement('div', { style: { background: 'var(--paper)', border: '2px solid var(--ink-navy)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-hard-ink)', padding: 'var(--space-6)', maxWidth: 420, width: '90%' }, onClick: e => e.stopPropagation() },
      title && React.createElement('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--ink-navy)', marginBottom: 12 } }, title),
      React.createElement('div', { style: { fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--muted-ink)', lineHeight: 1.5 } }, children)));
}
