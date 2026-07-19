function NavBar({ page, onNavigate }) {
  const links = [{ id: 'landing', label: 'Home' }, { id: 'about', label: 'Philosophy' }, { id: 'faq', label: 'FAQ' }];
  return React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', borderBottom: '2px solid var(--ruled-blue)', position: 'sticky', top: 0, background: 'var(--paper)', zIndex: 20 } },
    React.createElement('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, cursor: 'pointer' }, onClick: () => onNavigate('landing') },
      React.createElement('span', { style: { color: 'var(--ink-navy)' } }, 'Guide'), React.createElement('span', { style: { color: 'var(--margin-red)' } }, 'Rail')),
    React.createElement('div', { style: { display: 'flex', gap: 32 } },
      links.map(l => React.createElement('span', {
        key: l.id, onClick: () => onNavigate(l.id),
        style: { fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, cursor: 'pointer', color: page === l.id ? 'var(--margin-red)' : 'var(--ink-navy)', borderBottom: page === l.id ? '2px solid var(--margin-red)' : '2px solid transparent', paddingBottom: 4 },
      }, l.label))));
}
function Footer() {
  return React.createElement('div', { style: { borderTop: '2px solid var(--ruled-blue)', padding: '40px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-body)', color: 'var(--muted-ink)', fontSize: 14 } },
    React.createElement('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 } },
      React.createElement('span', { style: { color: 'var(--ink-navy)' } }, 'Guide'), React.createElement('span', { style: { color: 'var(--margin-red)' } }, 'Rail')),
    React.createElement('div', { style: { fontStyle: 'italic' } }, "Filtering tools don't teach. Teaching tools don't protect. GuideRail does both."));
}
window.Shell = { NavBar, Footer };
