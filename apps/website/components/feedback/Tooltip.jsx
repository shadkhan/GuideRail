import React from 'react';
export function Tooltip({ label, children }) {
  const [show, setShow] = React.useState(false);
  return React.createElement('span', { style: { position: 'relative', display: 'inline-block' }, onMouseEnter: () => setShow(true), onMouseLeave: () => setShow(false) },
    children,
    show && React.createElement('span', { style: { position: 'absolute', bottom: '125%', left: '50%', transform: 'translateX(-50%)', background: 'var(--ink-navy)', color: 'var(--paper)', fontFamily: 'var(--font-mono)', fontSize: 11, padding: '6px 10px', borderRadius: 6, whiteSpace: 'nowrap', zIndex: 10 } }, label));
}
