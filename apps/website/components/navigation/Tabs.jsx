import React from 'react';
export function Tabs({ tabs = [], value, onChange }) {
  return React.createElement('div', { style: { display: 'flex', borderBottom: '2px solid var(--ruled-blue)', gap: 4 } },
    tabs.map(t => React.createElement('button', {
      key: t.value, onClick: () => onChange && onChange(t.value),
      style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, padding: '10px 18px', border: 'none', borderBottom: `3px solid ${value === t.value ? 'var(--margin-red)' : 'transparent'}`, background: 'transparent', color: value === t.value ? 'var(--ink-navy)' : 'var(--muted-ink)', cursor: 'pointer', marginBottom: -2 },
    }, t.label)));
}
