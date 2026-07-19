# GuideRail Design System

## What GuideRail is

GuideRail is "the study browser that turns blocked pages into learning — and screen time into a reward." It's a parental-guidance product for kids' internet use, positioned against both plain content filters (which block but don't teach) and unrestricted access. The brand's core tension, resolved in its name: **guardrails that guide, not gates that block**.

Closing line used across the site: *"Filtering tools don't teach. Teaching tools don't protect. GuideRail does both."*

**Products/surfaces covered here:** a single-nav marketing website — Landing · About (Philosophy) · FAQ — mobile-first. No app, dashboard, or other codebase was provided in this run.

**Source material:** this design system was built entirely from one pasted content & design brief ("GuideRail Website — Content & Design Brief"), delivered directly in chat. No Figma file, GitHub repo, or other codebase was attached or mentioned — there is nothing else to link back to. If a Figma link, repo, or additional brief exists, attach it and this system should be revisited against it.

## Components

Standard primitive set (no component library/Figma file was provided, so this is an original but conventional set sized to the brief's needs):

- **Core** — `Button`, `IconButton`, `Badge`, `Tag`, `Icon`
- **Forms** — `Input`, `Select`, `Checkbox`, `Radio`, `Switch`
- **Layout** — `Card`
- **Navigation** — `Tabs`
- **Feedback** — `Dialog`, `Toast`, `Tooltip`

### Intentional additions
- `Icon` — no icon codebase/CDN was reachable to link; added a small inline-SVG glyph set (Lucide-style paths, 2px stroke) since components needed *some* icon primitive. See ICONOGRAPHY below.

## Index

- `styles.css` — root stylesheet, imports everything below.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `effects.css` (shadows, motion, ruled-line background), `fonts.css` (Google Fonts import).
- `components/core/`, `components/forms/`, `components/layout/`, `components/navigation/`, `components/feedback/`, `components/icons/` — one `.jsx` + `.d.ts` + `.prompt.md` per component, one `@dsCard`-tagged `.html` per directory.
- `guidelines/colors/`, `guidelines/type/`, `guidelines/spacing/`, `guidelines/brand/` — foundation specimen cards for the Design System tab.
- `ui_kits/website/` — the GuideRail marketing site: `Shell.jsx` (nav + footer), `Landing.jsx`, `About.jsx`, `FAQ.jsx`, `index.html` (click through all three pages).
- `thumbnail.html` — project tile.
- `SKILL.md` — Claude Code-compatible skill wrapper.

## CONTENT FUNDAMENTALS

- **Copy is locked in the brief** — design has visual freedom, not copy freedom. Treat headline/body text as close to final; don't invent new marketing claims.
- **Honest before impressive**: every big claim sits next to its limit. Say *"tamper-resistant, residual risks documented"* — never *"un-bypassable"*. This pairing (claim + boundary) should appear anywhere the product's protection is described.
- **Vocabulary is deliberate and non-negotiable**: the child's word is **"earn"**, never "allow" or "permission". The parent's promise is **"no spying, no shouting"**. Don't substitute synonyms.
- **Voice is second-person-adjacent but calm** — plain declarative sentences, short paragraphs, no hype adjectives ("revolutionary", "seamless"). Example from the brief: *"The study browser that turns blocked pages into learning — and screen time into a reward."*
- **Hinglish lines are flavor, not translation** — the site is English-primary; Hinglish appears only as styled pull-quotes (italic, margin-red left rule) for the India audience, sparingly, never as the primary copy.
- **No emoji.** Tone is warm but not chatty — this is closer to a school notebook than a chat app.
- **Universal closing line**, usable anywhere a strong ending beat is needed: *"Filtering tools don't teach. Teaching tools don't protect. GuideRail does both."*

## VISUAL FOUNDATIONS

**Concept:** the entire visual world is an Indian school exercise notebook — pale blue ruled lines, one vertical red margin rule, pencil-annotation energy, earned green tick-marks. Explicitly **not** newspaper, not corporate SaaS, not neon edtech.

- **Color:** Ink navy `#1B2A4A` (text/headers) · Ruled blue `#C7D6EA` (lines, borders, dividers) · Margin red `#D64541` (the one signature accent — CTAs, the margin rule, active states) · Paper `#FBFBF6` (background, always off-white, never pure white for large surfaces) · Earned green `#2E7D4F` + soft `#E7F3EC` (success, timers, ticks, "earned" moments only) · Muted ink `#5A6A8A` (secondary/caption text). Max one accent (red) fights for attention at once; green is reserved for reward moments, not used as a second general accent.
- **Type:** Bricolage Grotesque for display/headlines (600–800 weight, tight leading ~1.1) · Karla for body (400–700, generous leading ~1.55) · IBM Plex Mono for timers, eyebrows, and labels (uppercase, letter-spaced ~0.08em). Mono is a signature detail — countdown timers and section eyebrows should always be mono, never body type.
- **Spacing:** 4px-rooted scale (4/8/12/16/24/32/48/64/96). Generous whitespace around hero copy; sections breathe at 64–96px vertical padding.
- **Backgrounds:** flat paper color, or the repeating ruled-line pattern (`--ruled-line-bg`) behind hero areas only — not tiled everywhere. No gradients, no photography, no full-bleed imagery. **No stock photos of kids at laptops** — if illustration is used at all, it should read as notebook-margin doodles, not polished illustration.
- **Borders & shadows:** 2px solid ink-navy borders on interactive surfaces (buttons, cards, dialogs). Shadows are **hard offset** (`8px 8px 0 ruled-blue`, or `6px 6px 0` ink/margin-red for emphasis) — never blurred drop shadows. This is the single most distinctive visual signature after the margin rule.
- **Radius:** soft but restrained, 8–12px. Not pill-shaped by default (buttons are rounded-rect, not capsules); pills are reserved for tags/badges only.
- **Motion:** minimal and quick — 120–200ms, standard ease. Buttons lift `translate(-2px,-2px)` on hover (shadow grows) and press flat `translate(2px,2px)` (shadow shrinks) on click — a physical "paper lifting" gesture, not fade/opacity tricks. No bounce, no spring.
- **Hover/press states:** hover = shadow grows + slight lift; press = shadow shrinks + slight sink. Toggle/tag active states switch to filled margin-red or earned-green rather than darkening a neutral.
- **The margin rule motif:** a single 3px vertical red rule to the left of section headings and pull-quotes — this is the brand's signature device, used instead of colored left-border cards (deliberately avoided as a trope elsewhere).
- **Imagery color vibe:** N/A — no photography in this system; if added later, keep it warm, human, unstaged, never stock-smiling-child-at-screen.
- **Transparency/blur:** used only for modal scrims (`rgba(navy,0.35)`), never on cards or text surfaces.
- **Cards:** white fill, 2px ink-navy border, 12px radius, hard offset shadow — never a colored left-border-only card.

## ICONOGRAPHY

No icon codebase, sprite, or CDN reference was provided in the brief. `Icon.jsx` bundles a small Lucide-style glyph set (2px stroke, rounded caps/joins, 24px grid) as inline SVG path data — Lucide is MIT-licensed and its stroke language (thin, rounded, geometric) reads as the closest neutral match to a "pencil-line" notebook aesthetic. This is a **substitution**, flagged here: if the real product has its own icon set, replace `Icon.jsx`'s path table. No emoji, no unicode-glyph icons. Hand-drawn tick marks (for "earned"/"complete" states) use a single simple SVG check path, styled in earned-green — this is the brief's own explicit motif ("hand-drawn-style ticks"), not a general illustration system.

No logo file was provided — **no logo was invented**. The wordmark is rendered as styled type everywhere a mark would go: "Guide" in ink navy, "Rail" in margin red, in Bricolage Grotesque 800. If a real logo file exists, add it to `assets/` and swap it in.

## FONTS

Bricolage Grotesque, Karla, and IBM Plex Mono are all genuine, freely-licensed Google Fonts — no substitution was needed. They're loaded via `tokens/fonts.css` (`@import` from Google Fonts) rather than self-hosted binaries, since no font files were attached. If you'd like these self-hosted instead (for offline use or stricter CSP), share the `.woff2` files and this can be switched to local `@font-face`.

## Caveats & next steps

- No product codebase, Figma file, or slide deck was attached — every screen and component here is an original build against the written brief only, not a recreation of an existing UI. If a real app/dashboard exists, attach it (codebase or Figma) so the mobile/parent-app surfaces can be built from real screens instead.
- No logo, icon set, or imagery assets were provided — flagged substitutions above (type-based wordmark, Lucide-style icon paths). Please share real files if they exist.
- Only one UI kit was buildable (the marketing website) since only one product surface was described in the brief.
