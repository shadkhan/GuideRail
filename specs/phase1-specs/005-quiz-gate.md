# Spec: Quiz Gate & Earned Time
Status: Draft · Date: 2026-07-17 · ADRs: will produce ADR-0005 (token & revocation design)

## Goal (one sentence, user-visible outcome)
A child hitting YouTube during study hours meets three fair questions from their own recent reading; passing earns a visible 30-minute timer that expires on its own — the product's soul, working end to end.

## Requirements (numbered, testable)
R1. DNR redirect rule: gate-list domains → `quiz_gate.html?src=<encoded-origin>` (rule via registry; page in web_accessible_resources).
R2. Quiz source v1 (no LLM): question bank per pack (`quiz_topics[]` → ≥30 hand-written MCQs per seed pack, tagged by topic); selector picks 3 questions weighted toward topics the child's allowed-page history touched in the last 24h (history = origin tags already cached by spec 004 — no page text stored).
R3. Grading: 3/3 or 2/3 passes (config); fail → grace mode: show which topic to revisit + retry available after 10 minutes (chrome.alarms), never a hard lockout.
R4. Earned-time token: `{scope: origin-group, expires_at}` in storage; DNR session allow-rule with priority above the redirect; chrome.alarms revokes rule + token at expiry (never setTimeout).
R5. Timer UX: countdown visible on the gated tab via badge text (mm remaining) + on quiz_gate.html; expiry silently restores the gate — no nag screens.
R6. Child transparency: quiz_gate.html footer links to the rules screen (spec 007) — "why am I seeing this."
R7. All quiz interactions logged locally only (passed/failed/topic) for the future digest; nothing leaves the device.

## Out of scope
- LLM-generated questions (Phase 2 — bank-based is deliberate for v1 groundedness)
- Ask-to-unlock parent flow; adaptive difficulty beyond topic weighting
- Anti-forgery beyond storage + alarms (documented residual risk per IQ-007)

## Acceptance criteria (how "done" is proven)
- [ ] Test: selector weighting, grading matrix, token lifecycle (grant→active→expire→gate restored), alarm survives worker death
- [ ] Evidence: screen recording of the full loop — block → quiz → pass → 30:00 badge → (accelerated clock) → gate restored with zero intervention
- [ ] Evidence: worker killed mid-countdown via serviceworker-internals; timer and revocation still correct on revival
- [ ] ADR-0005 written incl. Negative consequences (forgeable on unmanaged devices) stated plainly

## Open questions (must be empty before Status: Approved)
- Q1: Pass threshold default — 2/3 (forgiving) or 3/3 (strict)? Recommend 2/3 for beta per the 1-star-review lesson.
- Q2: Earned window length config range (15/30/45) — parent-set or fixed 30 for beta?
