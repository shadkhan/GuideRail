# Spec: Onboarding, Study Hours & Child Rules Screen
Status: Implemented · Date: 2026-07-17 (implemented 2026-07-22) · ADRs: ADR-0012 (PIN & local-settings trust) — Accepted

## Goal (one sentence, user-visible outcome)
A parent goes from install to working protection in under 10 minutes — one child profile, curriculum picked, study hours set — and the child can always see exactly what rules apply to them.

## Requirements (numbered, testable)
R1. First-run onboarding (extension options page, 4 steps): (1) parent PIN set, (2) child name/class → pack selection via spec 003 API, (3) study-hours schedule, (4) "show your child this screen" — the rules screen walkthrough. Progress persists if abandoned midway.
R2. Study hours v1: per-weekday windows (answering spec 004 Q1), sensible default pre-filled (Mon–Fri 09:00–15:00), stored in the versioned schema; all policy modules read from one `isStudyTime()` source of truth.
R3. Parent settings (PIN-gated): edit profile/pack/hours, edit gate-list (add/remove domains), pause protection for today (logged), uninstall guidance.
R4. Child rules screen (NOT PIN-gated, linked from quiz gate footer): plain-language display of — active study hours, what's always allowed (curriculum name), what's earnable (gate list), current earned time, and the exact data stored locally ("nothing leaves this computer"). Reading level ~10 years.
R5. PIN: 4–6 digits, hashed (not plaintext) in storage, 5-attempt lockout with alarms-based cooldown; honest limitation documented — this is a speed bump on unmanaged devices, consistent with IQ-007 posture.
R6. All UI is extension pages (options + rules screen); Karla/system fonts, meets WCAG AA contrast, keyboard navigable.
R7. Every settings mutation goes through the typed message schema + storage wrappers; no direct storage writes from UI code.

## Out of scope
- Multi-child profiles (Phase 2); parent web dashboard; email capture/accounts
- Ask-to-unlock; weekly digest

## Acceptance criteria (how "done" is proven)
- [x] Test: onboarding state machine (resume-from-abandon), isStudyTime() matrix incl. midnight-spanning windows, PIN lockout timing — `src/settings/{onboarding,study-time,pin}.test.ts`, `src/pipeline/study-hours.test.ts` (midnight-spanning), `service_worker.test.ts` (set→verify→5-attempt lock)
- [~] Evidence: screen recording — fresh install to protected browsing < 10 minutes. **Manual** (L-008 blocks CLI extension loading); the onboarding state machine + worker handlers are unit/integration-tested; recording hand-captured via `pnpm ext:dev`.
- [~] Evidence: child rules screen reviewed by an actual child; feedback verbatim in LEARNINGS. **Manual + pending** — needs a real beta tester #1; not fabricated. To be captured when the manual review happens.
- [~] Accessibility: keyboard-only walkthrough + contrast check. **Manual** (L-008); `static/pages.css` uses semantic elements, `:focus-visible` outlines, and AA-intent colors — the walkthrough + contrast output are hand-captured.

## Resolved decisions (were open questions; resolved with user 2026-07-22)
- Q1 (PIN recovery): **none / re-onboard** — no backend; stated plainly in the PIN step UI and ADR-0012.
- Q2 (default gate-list): **the existing ~46-domain `pipeline/gate-list.ts` list** is the editable default (R3 add/remove layered over it).

## Post-implementation notes
- **PIN gates the UI, not the data** — forgeable on an unmanaged device (storage edit or `settings.update` message replay); documented residual (ADR-0012, L-018, IQ-018). Real enforcement is the Phase 4 managed profile.
- R2's single source of truth is `settings/study-time.ts` `isStudyTime()`; `EvalDeps` now takes a `studyActive` boolean (not a schedule).
- R5's lockout is a stored cooldown timestamp (not chrome.alarms) — the more robust equivalent, per the spec-005 grace precedent (ADR-0012).
- Study-hours UI is one window per weekday for v1 (the schema supports more).
