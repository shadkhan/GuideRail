const CATS = [
  { id: 'A', title: 'Who is it for', items: [
    { q: 'Which classes and ages does it support?', a: "Class 3 through Class 12 — roughly ages 8 to 17, any child who reads independently, because our quizzes come from the child's own reading. For pre-readers (LKG/UKG/Class 1–2) a simple \"Little Mode\" — filtering and image safety without quizzes — is on our roadmap. College and exam-prep self-control is a different product for a different day; we'd rather do one thing honestly.", hi: '"Class 3 se 12 tak — jo bachcha khud padh sakta hai, uske liye."' },
    { q: 'Which devices does it work on?', a: "The child's protection runs in Chrome on laptops, desktops, and Chromebooks — Chromebooks especially; we engineered for the most affordable ones. Your parent dashboard, approvals, and Sunday report work on any phone. Chrome on Android/iOS cannot run extensions at all (a platform rule for every extension product, not just ours) — so the deal is: child studies on the laptop, you stay in control from your phone. Edge support is coming.", hi: '"Bachche ki padhai laptop pe, aapka control aapke phone pe."' },
    { q: 'Do we have to upload the course or syllabus?', a: "No uploads, no setup projects. You pick your child's class and board — CBSE, ICSE, general homeschool — from a list, and the ready-made curriculum pack activates instantly. We curate packs from the actual board syllabi and keep adding classes; if your class isn't live yet, we'll tell you honestly rather than pretend.", hi: '"Kuch upload nahi karna. Bas class aur board choose karo — syllabus humne pehle se bhara hai."' },
    { q: "I'm a teacher — do I need to create and upload study plans?", a: 'No. GuideRail generates quizzes from what the student actually reads — automatically. Your only optional involvement is curating this week\'s allowed resources in the school version, a one-click bookmark-style action. If an edtech tool gives you homework, it has failed; we designed against that.' },
    { q: 'Does it actually help with teaching, or only blocking?', a: "Both, genuinely. One click on any webpage produces a printable worksheet with an answer key — half of lesson-prep, done. And every distraction attempt becomes retrieval practice on that day's reading — one of the strongest evidence-backed learning techniques, running automatically, all term. The weekly report shows which topics landed and where quiz scores dipped. What it deliberately does NOT do: replace the teacher or the textbook. It works alongside the best teaching content; it doesn't compete with it.", hi: '"Padhata Khan Academy hai; yaad GuideRail karwata hai."' },
  ]},
  { id: 'B', title: 'How it works', items: [
    { q: 'Is this spyware?', a: "No — and we've designed it so it can't quietly become spyware. No message reading, no location tracking, no social-media monitoring. It works during the study hours you set, checks pages on the device itself, and your child can see every rule that applies to them. Transparency isn't a feature; it's the deal that makes the whole product work." },
    { q: 'How much AI does it use, and where?', a: "The filtering uses no AI at all — it's a fast, deterministic engine inside the device, which is why it works offline and why browsing never leaves the computer. AI appears in exactly two places: writing quiz questions and building worksheets, both through one controlled channel. Two guarantees: personal details are scrubbed on the device before any text reaches the AI — it never learns who your child is; and every AI question must carry a verified snippet from the page your child actually read, or it's automatically discarded and a hand-written question takes its place.", hi: '"AI ko bachche ka naam tak nahi pata."' },
    { q: 'Can my kid just bypass it?', a: "A determined teenager can bypass any consumer software — anyone who says otherwise is overclaiming. Our answer is layered: tamper-resistance during study hours, a hardened managed setup for schools, and most importantly a design kids don't want to bypass, because earning time honestly beats sneaking. We document our limits publicly; every boundary we state is a promise we can keep." },
    { q: 'Do schools need to provide their own AI API key?', a: 'No. The subscription includes everything — no API keys, no cloud accounts, no technical setup. All AI flows through our managed, safety-checked channel; that channel is precisely where the privacy scrubbing and question-verification live, so keeping it managed is what keeps it safe.', hi: '"Koi API key, koi technical setup nahi — aap class chuniye, hum sab sambhalte hain."' },
    { q: 'How big and heavy is the app?', a: 'Smaller than a single WhatsApp photo — under 5 MB total. The engine is built in Rust and engineered to add less than one frame (16 milliseconds) of work even on a ₹15,000 Chromebook, so browsing never stutters. And the core protection works fully offline.', hi: '"Poora app ek WhatsApp photo se chhota, aur sasti Chromebook pe bhi ekdum smooth."' },
  ]},
];
function FAQ({ ds }) {
  const { Tag } = ds;
  const [filter, setFilter] = React.useState('all');
  const [openKey, setOpenKey] = React.useState(null);
  const cats = CATS.filter(c => filter === 'all' || c.id === filter);
  return React.createElement('div', { style: { maxWidth: 760, margin: '0 auto', padding: '72px 48px 96px' } },
    React.createElement('div', { style: { fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 12, color: 'var(--margin-red)' } }, 'FAQ'),
    React.createElement('h1', { style: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, color: 'var(--ink-navy)', margin: '10px 0 28px' } }, 'Questions parents ask'),
    React.createElement('div', { style: { display: 'flex', gap: 8, marginBottom: 40 } },
      React.createElement(Tag, { active: filter === 'all', onClick: () => setFilter('all') }, 'All'),
      CATS.map(c => React.createElement(Tag, { key: c.id, active: filter === c.id, onClick: () => setFilter(c.id) }, c.title))),
    cats.map(cat => React.createElement('div', { key: cat.id, style: { marginBottom: 40 } },
      React.createElement('div', { style: { borderLeft: '3px solid var(--margin-red)', paddingLeft: 16, marginBottom: 16 } },
        React.createElement('div', { style: { fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--margin-red)' } }, `Category ${cat.id}`),
        React.createElement('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--ink-navy)' } }, cat.title)),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column' } },
        cat.items.map((item, i) => {
          const key = `${cat.id}${i}`; const isOpen = openKey === key;
          return React.createElement('div', { key, style: { borderBottom: '1px solid var(--ruled-blue)' } },
            React.createElement('div', { onClick: () => setOpenKey(isOpen ? null : key), style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 4px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--ink-navy)', gap: 16 } },
              item.q, React.createElement('span', { style: { color: 'var(--margin-red)', fontSize: 20, flexShrink: 0, transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform var(--duration-fast) var(--ease-standard)' } }, '+')),
            isOpen && React.createElement('div', { style: { padding: '0 4px 22px', display: 'flex', flexDirection: 'column', gap: 14 } },
              React.createElement('div', { style: { fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--muted-ink)', lineHeight: 1.6 } }, item.a),
              item.hi && React.createElement('div', { style: { borderLeft: '3px solid var(--margin-red)', paddingLeft: 16, fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-navy)' } }, item.hi)));
        })))));
}
window.FAQ = { FAQ };
