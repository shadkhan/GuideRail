# GuideRail Website — Content & Design Brief
**Purpose:** Complete handoff package for Claude Design. Copy is LOCKED (edit here, not in design). Design has freedom within the brand system below.
**Pages:** Landing · About (Philosophy) · FAQ. Single-nav site, mobile-first.

---

# PART 1 — BRAND SYSTEM (paste this into every Claude Design session)

## Name & essence
- **GuideRail** — guardrails that *guide*, not gates that block. Logo treatment: "Guide" in ink, "Rail" in margin-red.
- One-line essence: *The study browser that turns blocked pages into learning — and screen time into a reward.*
- Universal closing line: *Filtering tools don't teach. Teaching tools don't protect. GuideRail does both.*

## Visual language — "the school exercise book"
The entire visual world comes from an Indian school exercise notebook: pale blue ruled lines, ONE vertical red margin rule, pencil annotations, earned green tick-marks. Not newspaper, not corporate SaaS, not neon edtech.

## Tokens
- Ink navy `#1B2A4A` (text, headers) · Ruled blue `#C7D6EA` (lines, borders) · Margin red `#D64541` (accents, the signature rule) · Paper `#FBFBF6` (background) · Earned green `#2E7D4F` + soft `#E7F3EC` (success, timers, ticks) · Muted ink `#5A6A8A` (secondary text)
- Type: **Bricolage Grotesque** (display/headlines, 600–800) · **Karla** (body, 400–700) · **IBM Plex Mono** (timers, labels, eyebrows)
- Radius 8–12px, soft. Shadows: hard offset (8px 8px 0 ruled-blue), never blurry drop shadows.
- Signature motifs: the red margin rule on section headings; ruled-line backgrounds on hero areas; the mono countdown timer in earned-green; hand-drawn-style ticks.

## Voice rules
- Honest before impressive: every big claim sits next to its boundary ("tamper-resistant, residual risks documented" — never "un-bypassable").
- The child's word is **"earn"**, never "allow/permission". The parent's promise is **"no spying, no shouting"**.
- Hinglish lines appear as styled pull-quotes (italic, margin-red left rule) for the India audience — they are flavor, not translation; the site is English-primary.
- No stock photos of smiling children at laptops. Illustration style: notebook-margin doodles if anything.

---

# PART 2 — LANDING PAGE (structure + locked copy)

Reference implementation exists (guiderail-landing.html) — Claude Design should ELEVATE it, keeping: the interactive quiz-gate demo as hero signature, the section order, and all copy below.

## Sections in order
1. **Hero** — H1: "Earn it, *fair and square.*" (fair and square in earned-green). Sub: "The study browser that turns blocked pages into learning — and screen time into a reward. It knows your child's syllabus, allows the schoolwork, and quizzes the distractions. No spying, no shouting." CTAs: "Join the free beta" / "How it works". Right side: the interactive demo (blocked youtube → 3 water-cycle questions → 30:00 earned timer). Keep the demo functional — it is the single highest-converting element.
2. **How it works** — 3 steps: One profile per child (pick class & board — CBSE, ICSE, homeschool; no uploads ever) → Distraction becomes a quiz (3 questions from today's actual reading; pass = earn 30 visible minutes) → One Sunday report (all kids, what they read, quizzes passed, time earned; plus one-click worksheet maker).
3. **Audience strip** — Parents: "Four kids, four classes, one dashboard. Screen time stops being a daily fight." / Teacher-parents: "The blocked moment becomes retrieval practice. Any webpage becomes a printable worksheet." / Kids: "No spying, no sneaking. Visible rules, honest deal: show you learned it, unlock your time."
   Hinglish pull-quote: *"Bachcha khud bolega — Papa, maine 30 minute kamaye hain."*
4. **Privacy block** — Head: "Private by architecture, not by promise." Body: "Most safety tools send your child's browsing to the cloud and ask you to trust them. GuideRail checks pages on the device itself — so there's nothing to trust, because there's nothing to send." Checklist: filtering runs locally · no child accounts anywhere · personal details scrubbed on-device before anything leaves · no messages, no location, no social monitoring — ever · works during study hours only; the child can see every rule.
5. **Pricing preview** — Free ₹0/$0 (filtering, quiz gate w/ 5 AI quizzes/mo, 1 profile) · Family $7/mo-equivalent, ₹ pricing for India, founder price for beta families (unlimited quizzes & worksheets, 5 profiles, digest, ask-to-unlock) · Co-op/School $4/family/mo, 10-family minimum (shared allowlists, admin dashboard).
6. **Beta signup** — "Be a founding family." Email capture. Promise: "No spam, ever. One email when the beta opens, one when pricing launches."
7. **Mini-FAQ teaser** — 3 items from FAQ page (Is this spyware? / Which devices? / Which classes?) + link to full FAQ.

---

# PART 3 — ABOUT PAGE: "Our Philosophy"

Head: **Why we built a filter that teaches**
Layout note: essay format, generous whitespace, red-margin rule down the left like a notebook page. Hinglish pull-quotes as marginalia.

## The essay (locked copy)

Every parent knows the moment. You hand your child a laptop for schoolwork, and ten minutes later it's YouTube. So you install a blocker — and now it blocks the biology chapter too, because to a crude filter, the human body and the wrong kind of website look the same. The child is angry, the parent is exhausted, and somewhere in the middle, the actual studying stopped being the point.

We think the entire industry took a wrong turn at "Access Denied."

A blocked page is not a dead end. It is a moment — a child, mid-curiosity, one click from distraction — and that moment is the most teachable second of the whole day. GuideRail was built on a single inversion: **what if the wall was a door with a fair price on it?** Three questions from what you read this morning. Answer them, and thirty minutes of free time is yours — earned, visible, honest. Not because we gamified discipline, but because we believe children respond to fairness the way all people do: when the deal is transparent, nobody needs to sneak, and nobody needs to shout.

**We believe the child is not the enemy.** Most parental-control software is built like surveillance — it reads messages, tracks locations, reports everything to a cloud, and asks the child to accept being watched. We refuse the premise. GuideRail never reads messages, never tracks location, and the rules that apply to a child are visible *to that child*, in plain language, always. A tool a child perceives as fair is a tool a child stops fighting.

**We believe privacy is architecture, not a promise.** Your child's browsing is checked on the device itself, by a small engine that works even without internet. Nothing to upload means nothing to leak, nothing to subpoena, nothing to trust us about. Where AI helps — writing quiz questions, building worksheets — every name, number, and address is scrubbed out on the device before a single word leaves it, and every AI-written question must prove itself against the page your child actually read, or it is discarded. We built the honesty into the machine so it doesn't depend on our good behavior.

**We believe in guide rails, not gates.** The name is the philosophy. A gate stops you. A guide rail runs alongside a mountain road — it lets you travel fast and far, and simply keeps you from going over the edge. In an older telling that shaped this product's thinking, the greatest teacher on the battlefield of the Gita was not the warrior but the charioteer — the sarathi — the one who steers so the student can focus on the fight. That is the whole ambition of this tool: to be the quiet charioteer of a child's attention. Not the hero. Not the warden. The steady hand on the reins during study hours, and invisible the rest of the time.

Hinglish marginalia: *"Rok-tok nahi — saarthi."*

And one more belief, stated plainly because this industry rarely does: **we will tell you what this product cannot do.** A determined teenager can bypass any consumer software; we make bypassing unnecessary instead of impossible, and we document our limits in public. It doesn't teach your child mathematics — Khan Academy and NCERT do that beautifully; we make sure your child reaches them, and remembers them. It doesn't work on a phone in your child's hand — it protects the laptop where homework lives, and gives *you* the controls on your phone. Every boundary we state is a promise we can keep.

We are a small team building this the way we'd want it for our own children — who are, in fact, our first testers, our sharpest critics, and the names in our credits.

Sign-off: **— The GuideRail team, Bengaluru & the family study table**

---

# PART 4 — FAQ PAGE (two categories, ten questions, locked copy)

Layout note: accordion, category headers with the red margin rule. Each answer ends with its Hinglish line as a styled pull-quote where present (marked ▸).

## Category A — Who is it for

**A1. Which classes and ages does it support?**
Class 3 through Class 12 — roughly ages 8 to 17, any child who reads independently, because our quizzes come from the child's own reading. For pre-readers (LKG/UKG/Class 1–2) a simple "Little Mode" — filtering and image safety without quizzes — is on our roadmap. College and exam-prep self-control is a different product for a different day; we'd rather do one thing honestly.
▸ *"Class 3 se 12 tak — jo bachcha khud padh sakta hai, uske liye."*

**A2. Which devices does it work on?**
The child's protection runs in Chrome on laptops, desktops, and Chromebooks — Chromebooks especially; we engineered for the most affordable ones. Your parent dashboard, approvals, and Sunday report work on any phone. Chrome on Android/iOS cannot run extensions at all (a platform rule for every extension product, not just ours) — so the deal is: child studies on the laptop, you stay in control from your phone. Edge support is coming.
▸ *"Bachche ki padhai laptop pe, aapka control aapke phone pe."*

**A3. Do we have to upload the course or syllabus?**
No uploads, no setup projects. You pick your child's class and board — CBSE, ICSE, general homeschool — from a list, and the ready-made curriculum pack activates instantly. We curate packs from the actual board syllabi and keep adding classes; if your class isn't live yet, we'll tell you honestly rather than pretend.
▸ *"Kuch upload nahi karna. Bas class aur board choose karo — syllabus humne pehle se bhara hai."*

**A4. I'm a teacher — do I need to create and upload study plans?**
No. GuideRail generates quizzes from what the student actually reads — automatically. Your only optional involvement is curating this week's allowed resources in the school version, a one-click bookmark-style action. If an edtech tool gives you homework, it has failed; we designed against that.

**A5. Does it actually help with teaching, or only blocking?**
Both, genuinely. One click on any webpage produces a printable worksheet with an answer key — half of lesson-prep, done. And every distraction attempt becomes retrieval practice on that day's reading — one of the strongest evidence-backed learning techniques, running automatically, all term. The weekly report shows which topics landed and where quiz scores dipped. What it deliberately does NOT do: replace the teacher or the textbook. It works alongside the best teaching content; it doesn't compete with it.
▸ *"Padhata Khan Academy hai; yaad GuideRail karwata hai."*

## Category B — How it works

**B1. Is this spyware?**
No — and we've designed it so it can't quietly become spyware. No message reading, no location tracking, no social-media monitoring. It works during the study hours you set, checks pages on the device itself, and your child can see every rule that applies to them. Transparency isn't a feature; it's the deal that makes the whole product work.

**B2. How much AI does it use, and where?**
The filtering uses no AI at all — it's a fast, deterministic engine inside the device, which is why it works offline and why browsing never leaves the computer. AI appears in exactly two places: writing quiz questions and building worksheets, both through one controlled channel. Two guarantees: personal details are scrubbed on the device before any text reaches the AI — it never learns who your child is; and every AI question must carry a verified snippet from the page your child actually read, or it's automatically discarded and a hand-written question takes its place.
▸ *"AI ko bachche ka naam tak nahi pata."*

**B3. Can my kid just bypass it?**
A determined teenager can bypass any consumer software — anyone who says otherwise is overclaiming. Our answer is layered: tamper-resistance during study hours, a hardened managed setup for schools, and most importantly a design kids don't want to bypass, because earning time honestly beats sneaking. We document our limits publicly; every boundary we state is a promise we can keep.

**B4. Do schools need to provide their own AI API key?**
No. The subscription includes everything — no API keys, no cloud accounts, no technical setup. All AI flows through our managed, safety-checked channel; that channel is precisely where the privacy scrubbing and question-verification live, so keeping it managed is what keeps it safe.
▸ *"Koi API key, koi technical setup nahi — aap class chuniye, hum sab sambhalte hain."*

**B5. How big and heavy is the app?**
Smaller than a single WhatsApp photo — under 5 MB total. The engine is built in Rust and engineered to add less than one frame (16 milliseconds) of work even on a ₹15,000 Chromebook, so browsing never stutters. And the core protection works fully offline.
▸ *"Poora app ek WhatsApp photo se chhota, aur sasti Chromebook pe bhi ekdum smooth."*

---

# PART 5 — HOW TO WORK WITH CLAUDE DESIGN (process)

1. **Session 1 — system:** Paste PART 1 (brand system) + say: "Build a design system + landing page for this. The interactive quiz-gate demo is the hero signature — keep it functional. Elevate, don't replace, the exercise-book language."
2. **Iterate visually only:** In Design, critique layout/spacing/motion — never rewrite copy there. Copy changes come back to this brief first (single source of truth), then re-paste the changed section.
3. **Session per page:** About and FAQ as separate sessions, each starting with PART 1 pasted again for consistency, then the page's PART.
4. **What to ask Design for explicitly:** mobile-first passes, the red-margin-rule motif on every section head, accordion FAQ with category rules, the About page as a "notebook page" layout with marginalia pull-quotes, and a shared tokens/CSS file you can also hand to the Phase-2 dashboard build.
5. **Exit criteria per page:** matches tokens · copy verbatim from this brief · Lighthouse mobile a11y ≥90 · Hinglish pull-quotes styled consistently · no stock photography.
6. **Deploy:** export → Cloudflare Pages (same vendor as the proxy) → wire the beta form endpoint (Formspree/Tally) → this brief goes into the repo as `docs/website-brief.md` and future edits are PRs.
