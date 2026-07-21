# Spec: Quiz Gate & Earned Time
Status: Implemented · Date: 2026-07-17 (implemented 2026-07-20) · ADRs: ADR-0005 (token & revocation design) — Accepted

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
- [x] Test: selector weighting, grading matrix, token lifecycle (grant→active→expire→gate restored), alarm survives worker death — quiz-engine `{selector,grader,token,weighting}.test.ts`; extension `quiz/earned-time.test.ts` (grant/expire, reconcile-from-storage, **alarm-dispatch → revoke**), `service_worker.test.ts` (start→pass→grant, fail→grace→locked)
- [~] Evidence: screen recording of the full loop (block → quiz → pass → badge → accelerated clock → gate restored). **Manual** (L-008 blocks CLI extension loading); the loop is covered by the worker-integration tests. Produced by hand via `pnpm ext:dev`.
- [~] Evidence: worker killed mid-countdown; timer + revocation correct on revival. **Manual** (L-008); the survival property is proven by the reconcile-from-storage + alarm-dispatch tests (state lives in chrome.storage, not module scope).
- [x] ADR-0005 written incl. Negative consequences (forgeable on unmanaged devices) stated plainly — `docs/adr/0005-token-and-revocation.md`

## Resolved decisions (were open questions; resolved with user 2026-07-20)
- Q1 (pass threshold): **2 of 3** (forgiving; grace mode catches 0–1). `PASS_THRESHOLD_DEFAULT`.
- Q2 (earned window): **parent-set 15/30/45**, honored via `config.earnedWindowMinutes` (default **30**); the setter UI is spec 007.

## Post-implementation notes
- **Forgeable on unmanaged devices** is the documented residual risk (ADR-0005 Negative, IQ-007/IQ-016); grading is worker-side with answer keys in `chrome.storage.session` to raise the bar. Real enforcement is the Phase 4 managed profile.
- Grace retry uses a stored retry-not-before timestamp (more robust across the ephemeral worker than a one-shot alarm; honors R3's "never setTimeout" intent).
- Gate-list redirect captures the **origin** as `?src` (not the full URL) — DNR's regexSubstitution doesn't url-encode, so a full URL with `&` would truncate (L-015). The JS-side redirect keeps the full encoded URL.
- `quiz.log` records pass/fail **and topics** (quizzed + missed) for the future digest (R7).
- One shared **Class-7 bank** across all three seed packs for beta (all Class 7); per-board banks are a later refinement.
