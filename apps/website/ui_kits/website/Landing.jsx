// ─── Beta signup ─────────────────────────────────────────────────
// Replace with your real endpoint (accepts POST { email } as JSON):
//   1. Sign up at https://formspree.io (free tier: 50 submissions/mo)
//   2. Create a form → copy its endpoint (https://formspree.io/f/xxxxxxxx)
//   3. Paste below. Tally, Basin, or your own /api endpoint also work.
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

function Landing({ ds, onNavigate }) {
  const { Button, Card, Badge, Icon, Input } = ds;
  const QUIZ = [
    { q: 'Water vapor rises and cools to form clouds. This process is called:', options: ['Condensation', 'Evaporation', 'Precipitation'], correct: 0 },
    { q: 'Water falls from clouds as rain, snow, or hail. This is:', options: ['Collection', 'Precipitation', 'Runoff'], correct: 1 },
    { q: 'Rivers carry water back to the ocean in the stage called:', options: ['Collection', 'Condensation', 'Transpiration'], correct: 0 },
  ];
  const [step, setStep] = React.useState('blocked');
  const [qi, setQi] = React.useState(0);
  const [picked, setPicked] = React.useState(null);
  const [correctCount, setCorrectCount] = React.useState(0);
  const [timer, setTimer] = React.useState(30 * 60);
  const [email, setEmail] = React.useState('');
  const [formState, setFormState] = React.useState('idle'); // idle | submitting | success | error
  React.useEffect(() => { if (step !== 'earned') return; const id = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000); return () => clearInterval(id); }, [step]);
  const mm = String(Math.floor(timer / 60)).padStart(2, '0'); const ss = String(timer % 60).padStart(2, '0');
  function choose(i) {
    if (picked !== null) return;
    setPicked(i);
    const isRight = i === QUIZ[qi].correct;
    if (isRight) setCorrectCount(c => c + 1);
    setTimeout(() => {
      if (qi < QUIZ.length - 1) { setQi(qi + 1); setPicked(null); }
      else setStep('earned');
    }, 700);
  }
  function restart() { setStep('blocked'); setQi(0); setPicked(null); setCorrectCount(0); setTimer(30 * 60); }
  async function submitBeta(e) {
    e.preventDefault();
    if (!email || formState === 'submitting') return;
    setFormState('submitting');
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, source: 'landing' }),
      });
      setFormState(res.ok ? 'success' : 'error');
    } catch { setFormState('error'); }
  }

  const steps = [
    { icon: 'shield', title: 'One profile per child', body: 'Pick class & board — CBSE, ICSE, homeschool. No uploads, ever.' },
    { icon: 'book-open', title: 'Distraction becomes a quiz', body: "3 questions from today's actual reading. Pass, and earn 30 visible minutes." },
    { icon: 'clock', title: 'One Sunday report', body: 'All kids, what they read, quizzes passed, time earned — plus a one-click worksheet maker.' },
  ];
  const audiences = [
    { who: 'Parents', body: 'Four kids, four classes, one dashboard. Screen time stops being a daily fight.' },
    { who: 'Teacher-parents', body: 'The blocked moment becomes retrieval practice. Any webpage becomes a printable worksheet.' },
    { who: 'Kids', body: 'No spying, no sneaking. Visible rules, honest deal: show you learned it, unlock your time.' },
  ];
  const checklist = [
    'Filtering runs locally',
    'No child accounts anywhere',
    'Personal details scrubbed on-device before anything leaves',
    'No messages, no location, no social monitoring — ever',
    'Works during study hours only; the child can see every rule',
  ];
  const plans = [
    { name: 'Free', price: '₹0 / $0', features: ['Filtering', 'Quiz gate — 5 AI quizzes/mo', '1 profile'] },
    { name: 'Family', price: '$7/mo-equivalent · ₹ pricing for India · founder price for beta', features: ['Unlimited quizzes & worksheets', '5 profiles', 'Weekly digest', 'Ask-to-unlock'] },
    { name: 'Co-op / School', price: '$4/family/mo · 10-family minimum', features: ['Shared allowlists', 'Admin dashboard'] },
  ];
  const miniFaq = [
    { q: 'Is this spyware?', a: 'No — filtering runs on-device, and there is nothing to send: no messages, no location, no social monitoring.' },
    { q: 'Which devices?', a: "Your child's laptop today — Chrome on Windows, Mac, and Chromebook. Chrome on phones can't run extensions, so parents stay in control from their phone." },
    { q: 'Which classes?', a: 'Any CBSE, ICSE, or homeschool syllabus a parent sets up per child profile.' },
  ];

  return React.createElement('div', null,
    React.createElement('div', { style: { backgroundImage: 'var(--ruled-line-bg)', position: 'relative', padding: '72px 48px 96px' } },
      React.createElement('div', { style: { position: 'absolute', left: 48, top: 0, bottom: 0, width: 3, background: 'var(--margin-red)' } }),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, maxWidth: 1200, margin: '0 auto', paddingLeft: 32, alignItems: 'start' } },
        React.createElement('div', null,
          React.createElement('h1', { style: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52, lineHeight: 1.1, color: 'var(--ink-navy)', margin: 0 } }, 'Earn it, ', React.createElement('span', { style: { color: 'var(--earned-green)' } }, 'fair and square'), '.'),
          React.createElement('p', { style: { fontFamily: 'var(--font-body)', fontSize: 17, color: 'var(--muted-ink)', lineHeight: 1.6, marginTop: 20, maxWidth: 520 } }, "The study browser that turns blocked pages into learning — and screen time into a reward. It knows your child's syllabus, allows the schoolwork, and quizzes the distractions. No spying, no shouting."),
          React.createElement('div', { style: { display: 'flex', gap: 14, marginTop: 32 } },
            React.createElement(Button, { variant: 'primary', size: 'lg', onClick: () => document.getElementById('beta')?.scrollIntoView({ behavior: 'smooth' }) }, 'Join the free beta'),
            React.createElement(Button, { variant: 'secondary', size: 'lg', onClick: () => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' }) }, 'How it works'))),
        React.createElement(Card, { shadow: 'hard', style: { padding: 0, overflow: 'hidden' } },
          React.createElement('div', { style: { padding: '14px 20px', borderBottom: '2px solid var(--ruled-blue)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted-ink)' } },
            React.createElement(Icon, { name: 'lock', size: 14 }), 'youtube.com — blocked during study hours'),
          step === 'blocked' && React.createElement('div', { style: { padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' } },
            React.createElement(Icon, { name: 'shield', size: 36, color: 'var(--margin-red)' }),
            React.createElement('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--ink-navy)' } }, 'This page is blocked right now.'),
            React.createElement('div', { style: { fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted-ink)' } }, "Pass a 3-question quiz on today's reading to earn 30 minutes."),
            React.createElement(Button, { variant: 'primary', onClick: () => setStep('quiz') }, 'Start quiz')),
          step === 'quiz' && React.createElement('div', { style: { padding: 28 } },
            React.createElement('div', { style: { fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--margin-red)', marginBottom: 10 } }, `The Water Cycle — Question ${qi + 1} of ${QUIZ.length}`),
            React.createElement('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--ink-navy)', marginBottom: 16 } }, QUIZ[qi].q),
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
              QUIZ[qi].options.map((opt, i) => {
                const isPicked = picked === i; const isCorrect = i === QUIZ[qi].correct;
                let bg = 'var(--white)', border = 'var(--ruled-blue)', color = 'var(--ink-navy)';
                if (picked !== null && isPicked) { bg = isCorrect ? 'var(--earned-green-soft)' : '#FBEAE8'; border = isCorrect ? 'var(--earned-green)' : 'var(--margin-red)'; color = isCorrect ? 'var(--earned-green)' : 'var(--margin-red)'; }
                return React.createElement('button', { key: i, onClick: () => choose(i), style: { textAlign: 'left', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: `2px solid ${border}`, background: bg, color, fontFamily: 'var(--font-body)', fontSize: 15, cursor: picked === null ? 'pointer' : 'default' } }, opt);
              }))),
          step === 'earned' && React.createElement('div', { style: { padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' } },
            React.createElement(Icon, { name: 'check', size: 32, color: 'var(--earned-green)' }),
            React.createElement(Badge, { tone: 'success' }, `${correctCount} of ${QUIZ.length} correct — earned`),
            React.createElement('div', { style: { fontFamily: 'var(--font-mono)', fontSize: 48, fontWeight: 600, color: 'var(--earned-green)' } }, `${mm}:${ss}`),
            React.createElement('div', { style: { fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted-ink)' } }, 'earned screen time, visible and unlocked'),
            React.createElement(Button, { variant: 'ghost', onClick: restart }, 'Replay demo'))))),

    React.createElement('div', { id: 'how', style: { padding: '72px 48px', maxWidth: 1200, margin: '0 auto' } },
      React.createElement('div', { style: { borderLeft: '3px solid var(--margin-red)', paddingLeft: 20, marginBottom: 40 } },
        React.createElement('div', { style: { fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 12, color: 'var(--margin-red)' } }, 'How it works'),
        React.createElement('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color: 'var(--ink-navy)', marginTop: 6 } }, 'Three steps, every school night')),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 } },
        steps.map((s, i) => React.createElement(Card, { key: s.title, shadow: 'hard', style: { display: 'flex', flexDirection: 'column', gap: 12 } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
            React.createElement(Icon, { name: s.icon, size: 24, color: 'var(--margin-red)' }),
            React.createElement('span', { style: { fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted-ink)' } }, `0${i + 1}`)),
          React.createElement('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--ink-navy)' } }, s.title),
          React.createElement('div', { style: { fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted-ink)', lineHeight: 1.5 } }, s.body))))),

    React.createElement('div', { style: { background: 'var(--white)', borderTop: '2px solid var(--ruled-blue)', borderBottom: '2px solid var(--ruled-blue)', padding: '64px 48px' } },
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32, maxWidth: 1200, margin: '0 auto' } },
        audiences.map(a => React.createElement('div', { key: a.who },
          React.createElement(Badge, { tone: 'neutral', style: { marginBottom: 12 } }, a.who),
          React.createElement('div', { style: { fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--ink-navy)', lineHeight: 1.55 } }, a.body))))),

    React.createElement('div', { style: { padding: '64px 48px', display: 'flex', justifyContent: 'center' } },
      React.createElement('div', { style: { borderLeft: '3px solid var(--margin-red)', paddingLeft: 20, fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 20, color: 'var(--ink-navy)', maxWidth: 560 } }, '"Bachcha khud bolega — Papa, maine 30 minute kamaye hain."')),

    React.createElement('div', { style: { padding: '72px 48px', maxWidth: 900, margin: '0 auto' } },
      React.createElement('h2', { style: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color: 'var(--ink-navy)', margin: '0 0 12px' } }, 'Private by architecture, not by promise.'),
      React.createElement('p', { style: { fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--muted-ink)', lineHeight: 1.6, marginBottom: 24, maxWidth: 640 } }, "Most safety tools send your child's browsing to the cloud and ask you to trust them. GuideRail checks pages on the device itself — so there's nothing to trust, because there's nothing to send."),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
        checklist.map(c => React.createElement('div', { key: c, style: { display: 'flex', gap: 10, alignItems: 'flex-start' } },
          React.createElement(Icon, { name: 'check', size: 18, color: 'var(--earned-green)', style: { flexShrink: 0, marginTop: 2 } }),
          React.createElement('span', { style: { fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-navy)' } }, c))))),

    React.createElement('div', { style: { padding: '72px 48px', background: 'var(--white)', borderTop: '2px solid var(--ruled-blue)', borderBottom: '2px solid var(--ruled-blue)' } },
      React.createElement('div', { style: { maxWidth: 1200, margin: '0 auto' } },
        React.createElement('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color: 'var(--ink-navy)', marginBottom: 32, textAlign: 'center' } }, 'Pricing'),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 } },
          plans.map(p => React.createElement(Card, { key: p.name, shadow: p.name === 'Family' ? 'accent' : 'hard', style: { display: 'flex', flexDirection: 'column', gap: 16 } },
            React.createElement('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--ink-navy)' } }, p.name),
            React.createElement('div', { style: { fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--margin-red)' } }, p.price),
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
              p.features.map(f => React.createElement('div', { key: f, style: { fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted-ink)' } }, `· ${f}`)))))))),

    React.createElement('div', { id: 'beta', style: { padding: '80px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' } },
      React.createElement('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color: 'var(--ink-navy)' } }, 'Be a founding family.'),
      formState === 'success'
        ? React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, maxWidth: 420 } },
            React.createElement(Icon, { name: 'check', size: 32, color: 'var(--earned-green)' }),
            React.createElement('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--earned-green)' } }, "You're on the list."),
            React.createElement('div', { style: { fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--muted-ink)', lineHeight: 1.5 } }, "One email when the beta opens, one when pricing launches. That's it."))
        : React.createElement('form', { onSubmit: submitBeta, style: { display: 'flex', gap: 12, maxWidth: 420, width: '100%' } },
            React.createElement(Input, { type: 'email', required: true, placeholder: 'you@example.com', value: email, onChange: e => setEmail(e.target.value), disabled: formState === 'submitting', style: { flex: 1 } }),
            React.createElement(Button, { variant: 'primary', type: 'submit', disabled: formState === 'submitting' }, formState === 'submitting' ? 'Joining…' : 'Join beta')),
      formState === 'error' && React.createElement('div', { style: { fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--margin-red)' } }, "Couldn't send — try again in a moment, or email hello@guiderail.app."),
      formState !== 'success' && React.createElement('div', { style: { fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted-ink)' } }, 'No spam, ever. One email when the beta opens, one when pricing launches.')),

    React.createElement('div', { style: { padding: '64px 48px 88px', maxWidth: 900, margin: '0 auto' } },
      React.createElement('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--ink-navy)', marginBottom: 24 } }, 'A few quick questions'),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 } },
        miniFaq.map(f => React.createElement('div', { key: f.q },
          React.createElement('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--ink-navy)', marginBottom: 4 } }, f.q),
          React.createElement('div', { style: { fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted-ink)', lineHeight: 1.5 } }, f.a)))),
      React.createElement('a', { href: '#', onClick: e => { e.preventDefault(); onNavigate?.('faq'); window.scrollTo(0, 0); }, style: { fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--margin-red)' } }, 'See the full FAQ →')));
}
window.Landing = { Landing };
